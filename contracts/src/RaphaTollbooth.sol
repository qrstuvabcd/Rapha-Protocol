// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title RaphaTollbooth
 * @notice USDC escrow and proof-gated settlement for confidential clinical AI jobs.
 * @dev Blockchain contracts cannot debit an AI company's wallet without consent.
 *      The required flow is:
 *      1. AI company approves this contract to spend a maximum USDC budget.
 *      2. depositEscrow(...) pulls that budget into this contract with transferFrom.
 *      3. The hospital node starts only after the escrowed budget exists.
 *      4. A trusted attestor verifies the SGX/TDX/ZK receipt off-chain and signs
 *         the deterministic proof digest.
 *      5. submitProofAndSettle(...) charges actual usage, pays 95% to the hospital,
 *         pays 5% to Rapha Protocol treasury, and refunds the unused budget.
 */
contract RaphaTollbooth is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant DEFAULT_TREASURY_FEE_BPS = 500; // 5%
    bytes32 public constant PROOF_DOMAIN = keccak256("RAPHA_TOLLBOOTH_PROOF_V2");

    IERC20 public immutable usdc;

    address public hospitalWallet;
    address public raphaTreasuryWallet;
    address public trustedAttestor;
    uint256 public pricePerRecord;
    uint256 public pricePerComputeEpoch;
    uint16 public treasuryFeeBps;

    uint256 private _jobNonce;

    struct Escrow {
        address aiCompanyWallet;
        uint256 maxRecords;
        uint256 maxEpochs;
        uint256 escrowAmount;
        uint256 pricePerRecordAtDeposit;
        uint256 pricePerComputeEpochAtDeposit;
        bool settled;
    }

    mapping(bytes32 jobId => Escrow escrow) public escrows;
    mapping(bytes32 digest => bool used) public usedProofDigests;

    event EscrowDeposited(
        bytes32 indexed jobId,
        address indexed aiCompanyWallet,
        uint256 maxRecords,
        uint256 maxEpochs,
        uint256 escrowAmount,
        uint256 pricePerRecord,
        uint256 pricePerComputeEpoch
    );
    event ProofSettled(
        bytes32 indexed jobId,
        address indexed aiCompanyWallet,
        uint256 actualRecordsProcessed,
        uint256 epochsCompleted,
        uint256 totalCost,
        uint256 hospitalAmount,
        uint256 treasuryAmount,
        uint256 refundAmount,
        bytes32 proofDigest
    );
    event PricingUpdated(
        uint256 oldPricePerRecord,
        uint256 newPricePerRecord,
        uint256 oldPricePerComputeEpoch,
        uint256 newPricePerComputeEpoch
    );
    event TrustedAttestorUpdated(address indexed oldAttestor, address indexed newAttestor);
    event SettlementWalletsUpdated(address indexed hospitalWallet, address indexed raphaTreasuryWallet);
    event TreasuryFeeUpdated(uint16 oldFeeBps, uint16 newFeeBps);

    error ZeroAddress();
    error ZeroRecords();
    error ZeroPrice();
    error UnknownJob();
    error JobAlreadySettled();
    error ProofAlreadyUsed();
    error InvalidAiCompanyWallet();
    error InvalidProofSignature();
    error InvalidProofPayload();
    error ActualRecordsExceedEscrow();
    error ActualEpochsExceedEscrow();
    error ActualUsageExceedsEscrow();
    error TreasuryFeeTooHigh();
    error UnauthorizedPricingUpdate();

    constructor(
        IERC20 _usdc,
        address _hospitalWallet,
        address _raphaTreasuryWallet,
        address _trustedAttestor,
        uint256 _pricePerRecord,
        uint256 _pricePerComputeEpoch
    ) Ownable(msg.sender) {
        _requireNonZero(address(_usdc));
        _requireNonZero(_hospitalWallet);
        _requireNonZero(_raphaTreasuryWallet);
        _requireNonZero(_trustedAttestor);
        if (_pricePerRecord == 0) revert ZeroPrice();

        usdc = _usdc;
        hospitalWallet = _hospitalWallet;
        raphaTreasuryWallet = _raphaTreasuryWallet;
        trustedAttestor = _trustedAttestor;
        pricePerRecord = _pricePerRecord;
        pricePerComputeEpoch = _pricePerComputeEpoch;
        treasuryFeeBps = uint16(DEFAULT_TREASURY_FEE_BPS);
    }

    modifier onlyOwnerOrHospital() {
        if (msg.sender != owner() && msg.sender != hospitalWallet) revert UnauthorizedPricingUpdate();
        _;
    }

    /**
     * @notice Deposits the maximum data-only USDC budget for one confidential-compute job.
     * @dev Backward-compatible overload for jobs that do not charge a compute epoch fee.
     */
    function depositEscrow(uint256 maxRecords) external nonReentrant returns (bytes32 jobId) {
        return _depositEscrow(maxRecords, 0);
    }

    /**
     * @notice Deposits the maximum USDC budget for one confidential-compute job.
     * @dev The AI company must approve at least:
     *      maxRecords * pricePerRecord + maxEpochs * pricePerComputeEpoch.
     *      The emitted jobId must be included in the enclave receipt/proof flow.
     */
    function depositEscrow(uint256 maxRecords, uint256 maxEpochs) external nonReentrant returns (bytes32 jobId) {
        return _depositEscrow(maxRecords, maxEpochs);
    }

    /**
     * @notice Data-only settlement overload.
     */
    function submitProofAndSettle(
        bytes calldata proof,
        uint256 actualRecordsProcessed
    )
        external
        nonReentrant
        returns (uint256 totalCost, uint256 hospitalAmount, uint256 treasuryAmount, uint256 refundAmount)
    {
        return _submitProofAndSettle(proof, actualRecordsProcessed, 0);
    }

    /**
     * @notice Settles the job using a trusted attestor signature.
     * @param proof ABI-encoded `(bytes32 jobId, address aiCompanyWallet, bytes32 payloadHash, bytes signature)`.
     * @param actualRecordsProcessed Unique record count emitted by the enclave counter.
     * @param epochsCompleted Completed full loader passes emitted by the enclave counter.
     */
    function submitProofAndSettle(
        bytes calldata proof,
        uint256 actualRecordsProcessed,
        uint256 epochsCompleted
    )
        external
        nonReentrant
        returns (uint256 totalCost, uint256 hospitalAmount, uint256 treasuryAmount, uint256 refundAmount)
    {
        return _submitProofAndSettle(proof, actualRecordsProcessed, epochsCompleted);
    }

    function proofDigestFor(
        bytes32 jobId,
        address aiCompanyWallet,
        uint256 actualRecordsProcessed,
        bytes32 payloadHash
    ) external view returns (bytes32) {
        return _proofDigestFor(jobId, aiCompanyWallet, actualRecordsProcessed, 0, payloadHash);
    }

    function proofDigestFor(
        bytes32 jobId,
        address aiCompanyWallet,
        uint256 actualRecordsProcessed,
        uint256 epochsCompleted,
        bytes32 payloadHash
    ) external view returns (bytes32) {
        return _proofDigestFor(jobId, aiCompanyWallet, actualRecordsProcessed, epochsCompleted, payloadHash);
    }

    /**
     * @notice Updates hospital pricing for future escrows only.
     * @dev Existing escrows keep the prices snapshotted at deposit time.
     */
    function setPricing(uint256 newPricePerRecord, uint256 newPricePerComputeEpoch) external onlyOwnerOrHospital {
        if (newPricePerRecord == 0) revert ZeroPrice();
        emit PricingUpdated(pricePerRecord, newPricePerRecord, pricePerComputeEpoch, newPricePerComputeEpoch);
        pricePerRecord = newPricePerRecord;
        pricePerComputeEpoch = newPricePerComputeEpoch;
    }

    function setPricePerRecord(uint256 newPricePerRecord) external onlyOwnerOrHospital {
        if (newPricePerRecord == 0) revert ZeroPrice();
        emit PricingUpdated(pricePerRecord, newPricePerRecord, pricePerComputeEpoch, pricePerComputeEpoch);
        pricePerRecord = newPricePerRecord;
    }

    function setPricePerComputeEpoch(uint256 newPricePerComputeEpoch) external onlyOwnerOrHospital {
        emit PricingUpdated(pricePerRecord, pricePerRecord, pricePerComputeEpoch, newPricePerComputeEpoch);
        pricePerComputeEpoch = newPricePerComputeEpoch;
    }

    function setTrustedAttestor(address newTrustedAttestor) external onlyOwner {
        _requireNonZero(newTrustedAttestor);
        emit TrustedAttestorUpdated(trustedAttestor, newTrustedAttestor);
        trustedAttestor = newTrustedAttestor;
    }

    function setSettlementWallets(address newHospitalWallet, address newRaphaTreasuryWallet) external onlyOwner {
        _requireNonZero(newHospitalWallet);
        _requireNonZero(newRaphaTreasuryWallet);
        hospitalWallet = newHospitalWallet;
        raphaTreasuryWallet = newRaphaTreasuryWallet;
        emit SettlementWalletsUpdated(newHospitalWallet, newRaphaTreasuryWallet);
    }

    function setTreasuryFeeBps(uint16 newTreasuryFeeBps) external onlyOwner {
        if (newTreasuryFeeBps > 1_000) revert TreasuryFeeTooHigh(); // hard cap at 10%
        emit TreasuryFeeUpdated(treasuryFeeBps, newTreasuryFeeBps);
        treasuryFeeBps = newTreasuryFeeBps;
    }

    function _depositEscrow(uint256 maxRecords, uint256 maxEpochs) internal returns (bytes32 jobId) {
        if (maxRecords == 0) revert ZeroRecords();

        uint256 lockedPricePerRecord = pricePerRecord;
        if (lockedPricePerRecord == 0) revert ZeroPrice();

        uint256 lockedPricePerComputeEpoch = pricePerComputeEpoch;
        uint256 escrowAmount = (maxRecords * lockedPricePerRecord) + (maxEpochs * lockedPricePerComputeEpoch);

        jobId = keccak256(abi.encode(PROOF_DOMAIN, block.chainid, address(this), msg.sender, _jobNonce++));
        escrows[jobId] = Escrow({
            aiCompanyWallet: msg.sender,
            maxRecords: maxRecords,
            maxEpochs: maxEpochs,
            escrowAmount: escrowAmount,
            pricePerRecordAtDeposit: lockedPricePerRecord,
            pricePerComputeEpochAtDeposit: lockedPricePerComputeEpoch,
            settled: false
        });

        usdc.safeTransferFrom(msg.sender, address(this), escrowAmount);
        emit EscrowDeposited(
            jobId,
            msg.sender,
            maxRecords,
            maxEpochs,
            escrowAmount,
            lockedPricePerRecord,
            lockedPricePerComputeEpoch
        );
    }

    function _submitProofAndSettle(
        bytes calldata proof,
        uint256 actualRecordsProcessed,
        uint256 epochsCompleted
    )
        internal
        returns (uint256 totalCost, uint256 hospitalAmount, uint256 treasuryAmount, uint256 refundAmount)
    {
        if (actualRecordsProcessed == 0) revert ZeroRecords();

        (bytes32 jobId, address aiCompanyWallet, bytes32 payloadHash, bytes memory signature) = _decodeProof(proof);
        Escrow storage escrow = escrows[jobId];
        if (escrow.aiCompanyWallet == address(0)) revert UnknownJob();
        if (escrow.settled) revert JobAlreadySettled();
        if (escrow.aiCompanyWallet != aiCompanyWallet) revert InvalidAiCompanyWallet();
        if (actualRecordsProcessed > escrow.maxRecords) revert ActualRecordsExceedEscrow();
        if (epochsCompleted > escrow.maxEpochs) revert ActualEpochsExceedEscrow();

        bytes32 digest = _proofDigest(
            jobId,
            aiCompanyWallet,
            actualRecordsProcessed,
            epochsCompleted,
            escrow.pricePerRecordAtDeposit,
            escrow.pricePerComputeEpochAtDeposit,
            payloadHash
        );
        if (usedProofDigests[digest]) revert ProofAlreadyUsed();

        address signer = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(digest), signature);
        if (signer != trustedAttestor) revert InvalidProofSignature();

        totalCost =
            (actualRecordsProcessed * escrow.pricePerRecordAtDeposit) +
            (epochsCompleted * escrow.pricePerComputeEpochAtDeposit);
        if (totalCost > escrow.escrowAmount) revert ActualUsageExceedsEscrow();

        escrow.settled = true;
        usedProofDigests[digest] = true;

        treasuryAmount = (totalCost * treasuryFeeBps) / BPS_DENOMINATOR;
        hospitalAmount = totalCost - treasuryAmount;
        refundAmount = escrow.escrowAmount - totalCost;

        if (hospitalAmount > 0) {
            usdc.safeTransfer(hospitalWallet, hospitalAmount);
        }
        if (treasuryAmount > 0) {
            usdc.safeTransfer(raphaTreasuryWallet, treasuryAmount);
        }
        if (refundAmount > 0) {
            usdc.safeTransfer(aiCompanyWallet, refundAmount);
        }

        emit ProofSettled(
            jobId,
            aiCompanyWallet,
            actualRecordsProcessed,
            epochsCompleted,
            totalCost,
            hospitalAmount,
            treasuryAmount,
            refundAmount,
            digest
        );
    }

    function _decodeProof(
        bytes calldata proof
    ) internal pure returns (bytes32 jobId, address aiCompanyWallet, bytes32 payloadHash, bytes memory signature) {
        if (proof.length == 0) revert InvalidProofPayload();
        (jobId, aiCompanyWallet, payloadHash, signature) = abi.decode(proof, (bytes32, address, bytes32, bytes));
        if (jobId == bytes32(0) || aiCompanyWallet == address(0) || payloadHash == bytes32(0) || signature.length != 65) {
            revert InvalidProofPayload();
        }
    }

    function _proofDigestFor(
        bytes32 jobId,
        address aiCompanyWallet,
        uint256 actualRecordsProcessed,
        uint256 epochsCompleted,
        bytes32 payloadHash
    ) internal view returns (bytes32) {
        Escrow storage escrow = escrows[jobId];
        if (escrow.aiCompanyWallet == address(0)) revert UnknownJob();
        return _proofDigest(
            jobId,
            aiCompanyWallet,
            actualRecordsProcessed,
            epochsCompleted,
            escrow.pricePerRecordAtDeposit,
            escrow.pricePerComputeEpochAtDeposit,
            payloadHash
        );
    }

    function _proofDigest(
        bytes32 jobId,
        address aiCompanyWallet,
        uint256 actualRecordsProcessed,
        uint256 epochsCompleted,
        uint256 lockedPricePerRecord,
        uint256 lockedPricePerComputeEpoch,
        bytes32 payloadHash
    ) internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                PROOF_DOMAIN,
                address(this),
                block.chainid,
                jobId,
                aiCompanyWallet,
                actualRecordsProcessed,
                epochsCompleted,
                lockedPricePerRecord,
                lockedPricePerComputeEpoch,
                payloadHash
            )
        );
    }

    function _requireNonZero(address value) internal pure {
        if (value == address(0)) revert ZeroAddress();
    }
}
