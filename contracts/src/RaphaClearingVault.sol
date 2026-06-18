// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

interface IRaphaNodeNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function nodeHardwareHash(uint256 tokenId) external view returns (bytes32);
    function hospitalTreasury(uint256 tokenId) external view returns (address);
    function nodeOnboarder(uint256 tokenId) external view returns (address);
    function isNodeActive(uint256 tokenId) external view returns (bool);
}

/**
 * @title RaphaClearingVault
 * @notice USDC escrow and proof-gated clearing layer for Rapha Protocol node economics.
 * @dev Flow:
 *      1. AI client approves this vault for a max USDC job budget.
 *      2. depositEscrow(...) pulls that USDC into this contract.
 *      3. The attestation oracle verifies the SGX/TDX/ZK job receipt off-chain.
 *      4. submitProofAndSettle(...) validates the oracle signature on-chain and
 *         atomically splits escrow: 70% hospital, 20% current Node NFT owner,
 *         5% onboarder, 5% Rapha Protocol treasury.
 */
contract RaphaClearingVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant HOSPITAL_BPS = 7_000;
    uint256 public constant NODE_OWNER_BPS = 2_000;
    uint256 public constant ONBOARDER_BPS = 500;
    uint256 public constant RAPHA_BPS = 500;
    bytes32 public constant PROOF_DOMAIN = keccak256("RAPHA_CLEARING_VAULT_PROOF_V1");

    IERC20 public immutable usdc;
    IRaphaNodeNFT public immutable nodeRegistry;

    address public trustedAttestor;
    address public raphaTreasuryWallet;
    uint256 private _jobNonce;

    struct Escrow {
        address aiCompanyWallet;
        uint256 nodeTokenId;
        uint256 escrowAmount;
        bool settled;
        bool refunded;
    }

    mapping(bytes32 jobId => Escrow escrow) public escrows;
    mapping(bytes32 proofDigest => bool used) public usedProofDigests;

    event EscrowDeposited(
        bytes32 indexed jobId,
        address indexed aiCompanyWallet,
        uint256 indexed nodeTokenId,
        uint256 escrowAmount
    );
    event ProofSettled(
        bytes32 indexed jobId,
        address indexed aiCompanyWallet,
        uint256 indexed nodeTokenId,
        uint256 settledAmount,
        uint256 hospitalAmount,
        uint256 nodeOwnerAmount,
        uint256 onboarderAmount,
        uint256 raphaAmount,
        bytes32 proofDigest
    );
    event EscrowRefunded(bytes32 indexed jobId, address indexed aiCompanyWallet, uint256 refundAmount, string reason);
    event TrustedAttestorUpdated(address indexed oldAttestor, address indexed newAttestor);
    event RaphaTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    error ZeroAddress();
    error ZeroAmount();
    error UnknownJob();
    error UnknownOrInactiveNode();
    error JobAlreadyClosed();
    error InvalidAiCompanyWallet();
    error InvalidProofPayload();
    error InvalidProofSignature();
    error ProofAlreadyUsed();
    error UnauthorizedRefund();

    constructor(
        IERC20 _usdc,
        IRaphaNodeNFT _nodeRegistry,
        address _trustedAttestor,
        address _raphaTreasuryWallet
    ) Ownable(msg.sender) {
        _requireNonZero(address(_usdc));
        _requireNonZero(address(_nodeRegistry));
        _requireNonZero(_trustedAttestor);
        _requireNonZero(_raphaTreasuryWallet);

        usdc = _usdc;
        nodeRegistry = _nodeRegistry;
        trustedAttestor = _trustedAttestor;
        raphaTreasuryWallet = _raphaTreasuryWallet;
    }

    /**
     * @notice Locks an AI client's max USDC budget for one node-specific compute job.
     * @dev Caller must approve this vault before calling. The target node must be
     *      active before escrow can be accepted.
     */
    function depositEscrow(uint256 nodeTokenId, uint256 escrowAmount) external nonReentrant returns (bytes32 jobId) {
        if (escrowAmount == 0) revert ZeroAmount();
        _requireActiveNode(nodeTokenId);

        jobId = keccak256(abi.encode(PROOF_DOMAIN, block.chainid, address(this), msg.sender, nodeTokenId, _jobNonce++));
        escrows[jobId] = Escrow({
            aiCompanyWallet: msg.sender,
            nodeTokenId: nodeTokenId,
            escrowAmount: escrowAmount,
            settled: false,
            refunded: false
        });

        usdc.safeTransferFrom(msg.sender, address(this), escrowAmount);
        emit EscrowDeposited(jobId, msg.sender, nodeTokenId, escrowAmount);
    }

    /**
     * @notice Settles the entire escrow after an oracle-verified job-completion proof.
     * @param proof ABI-encoded `(bytes32 jobId, uint256 nodeTokenId, address aiCompanyWallet, bytes32 payloadHash, bytes signature)`.
     */
    function submitProofAndSettle(bytes calldata proof)
        external
        nonReentrant
        returns (
            uint256 hospitalAmount,
            uint256 nodeOwnerAmount,
            uint256 onboarderAmount,
            uint256 raphaAmount
        )
    {
        (bytes32 jobId, uint256 nodeTokenId, address aiCompanyWallet, bytes32 payloadHash, bytes memory signature) =
            _decodeProof(proof);

        Escrow storage escrow = escrows[jobId];
        if (escrow.aiCompanyWallet == address(0)) revert UnknownJob();
        if (escrow.settled || escrow.refunded) revert JobAlreadyClosed();
        if (escrow.aiCompanyWallet != aiCompanyWallet) revert InvalidAiCompanyWallet();
        if (escrow.nodeTokenId != nodeTokenId) revert InvalidProofPayload();
        _requireActiveNode(nodeTokenId);

        bytes32 hardwareHash = nodeRegistry.nodeHardwareHash(nodeTokenId);
        bytes32 digest = _proofDigest(jobId, nodeTokenId, aiCompanyWallet, escrow.escrowAmount, hardwareHash, payloadHash);
        if (usedProofDigests[digest]) revert ProofAlreadyUsed();

        address signer = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(digest), signature);
        if (signer != trustedAttestor) revert InvalidProofSignature();

        escrow.settled = true;
        usedProofDigests[digest] = true;

        uint256 settledAmount = escrow.escrowAmount;
        hospitalAmount = (settledAmount * HOSPITAL_BPS) / BPS_DENOMINATOR;
        nodeOwnerAmount = (settledAmount * NODE_OWNER_BPS) / BPS_DENOMINATOR;
        onboarderAmount = (settledAmount * ONBOARDER_BPS) / BPS_DENOMINATOR;
        raphaAmount = settledAmount - hospitalAmount - nodeOwnerAmount - onboarderAmount;

        address hospitalWallet = nodeRegistry.hospitalTreasury(nodeTokenId);
        address nodeOwnerWallet = nodeRegistry.ownerOf(nodeTokenId);
        address onboarderWallet = nodeRegistry.nodeOnboarder(nodeTokenId);
        _requireNonZero(hospitalWallet);
        _requireNonZero(nodeOwnerWallet);
        _requireNonZero(onboarderWallet);

        usdc.safeTransfer(hospitalWallet, hospitalAmount);
        usdc.safeTransfer(nodeOwnerWallet, nodeOwnerAmount);
        usdc.safeTransfer(onboarderWallet, onboarderAmount);
        usdc.safeTransfer(raphaTreasuryWallet, raphaAmount);

        emit ProofSettled(
            jobId,
            aiCompanyWallet,
            nodeTokenId,
            settledAmount,
            hospitalAmount,
            nodeOwnerAmount,
            onboarderAmount,
            raphaAmount,
            digest
        );
    }

    /**
     * @notice Refunds an escrow when the node is no longer active before settlement.
     * @dev Prevents permanent fund lock if a physical appliance is suspended for tamper,
     *      maintenance, or failed attestation. Only the AI wallet or owner can call.
     */
    function refundInactiveNodeEscrow(bytes32 jobId, string calldata reason) external nonReentrant {
        Escrow storage escrow = escrows[jobId];
        if (escrow.aiCompanyWallet == address(0)) revert UnknownJob();
        if (escrow.settled || escrow.refunded) revert JobAlreadyClosed();
        if (msg.sender != escrow.aiCompanyWallet && msg.sender != owner()) revert UnauthorizedRefund();
        if (nodeRegistry.isNodeActive(escrow.nodeTokenId)) revert UnknownOrInactiveNode();

        escrow.refunded = true;
        usdc.safeTransfer(escrow.aiCompanyWallet, escrow.escrowAmount);
        emit EscrowRefunded(jobId, escrow.aiCompanyWallet, escrow.escrowAmount, reason);
    }

    function proofDigestFor(
        bytes32 jobId,
        uint256 nodeTokenId,
        address aiCompanyWallet,
        bytes32 payloadHash
    ) external view returns (bytes32) {
        Escrow storage escrow = escrows[jobId];
        if (escrow.aiCompanyWallet == address(0)) revert UnknownJob();
        if (escrow.nodeTokenId != nodeTokenId || escrow.aiCompanyWallet != aiCompanyWallet) revert InvalidProofPayload();
        return _proofDigest(
            jobId,
            nodeTokenId,
            aiCompanyWallet,
            escrow.escrowAmount,
            nodeRegistry.nodeHardwareHash(nodeTokenId),
            payloadHash
        );
    }

    function setTrustedAttestor(address newTrustedAttestor) external onlyOwner {
        _requireNonZero(newTrustedAttestor);
        emit TrustedAttestorUpdated(trustedAttestor, newTrustedAttestor);
        trustedAttestor = newTrustedAttestor;
    }

    function setRaphaTreasuryWallet(address newRaphaTreasuryWallet) external onlyOwner {
        _requireNonZero(newRaphaTreasuryWallet);
        emit RaphaTreasuryUpdated(raphaTreasuryWallet, newRaphaTreasuryWallet);
        raphaTreasuryWallet = newRaphaTreasuryWallet;
    }

    function _decodeProof(bytes calldata proof)
        internal
        pure
        returns (bytes32 jobId, uint256 nodeTokenId, address aiCompanyWallet, bytes32 payloadHash, bytes memory signature)
    {
        if (proof.length == 0) revert InvalidProofPayload();
        (jobId, nodeTokenId, aiCompanyWallet, payloadHash, signature) =
            abi.decode(proof, (bytes32, uint256, address, bytes32, bytes));
        if (
            jobId == bytes32(0) ||
            nodeTokenId == 0 ||
            aiCompanyWallet == address(0) ||
            payloadHash == bytes32(0) ||
            signature.length != 65
        ) {
            revert InvalidProofPayload();
        }
    }

    function _proofDigest(
        bytes32 jobId,
        uint256 nodeTokenId,
        address aiCompanyWallet,
        uint256 escrowAmount,
        bytes32 hardwareHash,
        bytes32 payloadHash
    ) internal view returns (bytes32) {
        return keccak256(
            abi.encode(
                PROOF_DOMAIN,
                address(this),
                block.chainid,
                jobId,
                nodeTokenId,
                aiCompanyWallet,
                escrowAmount,
                hardwareHash,
                payloadHash
            )
        );
    }

    function _requireActiveNode(uint256 nodeTokenId) internal view {
        if (!nodeRegistry.isNodeActive(nodeTokenId)) revert UnknownOrInactiveNode();
        _requireNonZero(nodeRegistry.hospitalTreasury(nodeTokenId));
        _requireNonZero(nodeRegistry.nodeOnboarder(nodeTokenId));
        _requireNonZero(nodeRegistry.ownerOf(nodeTokenId));
        if (nodeRegistry.nodeHardwareHash(nodeTokenId) == bytes32(0)) revert UnknownOrInactiveNode();
    }

    function _requireNonZero(address value) internal pure {
        if (value == address(0)) revert ZeroAddress();
    }
}
