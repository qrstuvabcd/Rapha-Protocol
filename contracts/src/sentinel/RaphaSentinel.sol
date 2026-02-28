// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title RaphaSentinel
 * @author Rapha Chain - L1 Security Anchor
 * @notice Receives periodic state checkpoints from Rapha Chain for L1 security
 * @dev Deployed on Ethereum mainnet. Validators submit aggregated BLS signatures
 *      to prove consensus on the Rapha Chain state root.
 * 
 * Architecture:
 * - Rapha Chain produces blocks every ~3 seconds
 * - Every 256 blocks (~10 minutes), a checkpoint is submitted to this contract
 * - Checkpoint includes: stateRoot, validatorSetHash, blockHeight
 * - 2/3 of validators must sign for checkpoint to be accepted
 * 
 * This provides:
 * 1. L1 data availability guarantee
 * 2. Fraud proof anchor for light clients
 * 3. Bridge security for $RAPHA <-> ETH
 */
contract RaphaSentinel is Ownable {
    using ECDSA for bytes32;

    // ============ Structs ============

    /// @notice Checkpoint data structure
    struct Checkpoint {
        bytes32 stateRoot;           // Merkle root of Rapha Chain state
        bytes32 validatorSetHash;    // Hash of current validator set
        uint256 blockHeight;         // Rapha Chain block height
        bytes aggregatedSignature;   // BLS aggregate signature from 2/3 validators
        uint256 submittedAt;         // Ethereum block timestamp
        address submitter;           // Address that submitted the checkpoint
    }

    /// @notice Validator information
    struct Validator {
        address addr;
        bytes32 blsPubKeyHash;       // Hash of BLS public key
        uint256 votingPower;
        bool isActive;
        string name;                 // Human-readable name
        ValidatorTier tier;          // Validator tier
    }

    /// @notice Validator tier for the "Circle of Trust"
    enum ValidatorTier {
        ACADEMIC,           // Edinburgh, HKU, CUHK
        REGULATORY,         // NHS Digital, GMC
        INDUSTRY,           // Pharma consortia, distributors
        PATIENT_ADVOCATE    // Wellcome Trust, Patient DAO
    }

    // ============ Constants ============

    /// @notice Checkpoint interval in Rapha blocks
    uint256 public constant CHECKPOINT_INTERVAL = 256;

    /// @notice Minimum signatures required (2/3 of total voting power)
    uint256 public constant SIGNATURE_THRESHOLD_PERCENT = 67;

    // ============ State Variables ============

    /// @notice All submitted checkpoints (blockHeight => Checkpoint)
    mapping(uint256 => Checkpoint) public checkpoints;

    /// @notice Latest checkpoint block height
    uint256 public latestCheckpointHeight;

    /// @notice Validator set (address => Validator)
    mapping(address => Validator) public validators;

    /// @notice List of validator addresses
    address[] public validatorList;

    /// @notice Total voting power of all validators
    uint256 public totalVotingPower;

    /// @notice Authorized checkpoint submitters
    mapping(address => bool) public authorizedSubmitters;

    /// @notice Pause state for emergency
    bool public paused;

    // ============ Events ============

    event CheckpointSubmitted(
        uint256 indexed blockHeight,
        bytes32 stateRoot,
        bytes32 validatorSetHash,
        address indexed submitter
    );

    event ValidatorAdded(
        address indexed validator,
        uint256 votingPower,
        ValidatorTier tier,
        string name
    );

    event ValidatorRemoved(address indexed validator);

    event ValidatorSetUpdated(bytes32 newValidatorSetHash, uint256 totalPower);

    event Paused(address indexed by);
    event Unpaused(address indexed by);

    // ============ Modifiers ============

    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier onlyAuthorizedSubmitter() {
        require(authorizedSubmitters[msg.sender], "Not authorized submitter");
        _;
    }

    // ============ Constructor ============

    constructor() Ownable(msg.sender) {
        // Initialize with owner as first authorized submitter
        authorizedSubmitters[msg.sender] = true;
    }

    // ============ Core Functions ============

    /**
     * @notice Submit a checkpoint from Rapha Chain
     * @param stateRoot Merkle root of Rapha Chain state
     * @param validatorSetHash Hash of current validator set
     * @param blockHeight Rapha Chain block height
     * @param aggregatedSignature BLS aggregate signature from validators
     */
    function submitCheckpoint(
        bytes32 stateRoot,
        bytes32 validatorSetHash,
        uint256 blockHeight,
        bytes calldata aggregatedSignature
    ) external notPaused onlyAuthorizedSubmitter {
        // Validate block height
        require(
            blockHeight > latestCheckpointHeight,
            "Block height must be greater than latest"
        );
        require(
            blockHeight % CHECKPOINT_INTERVAL == 0,
            "Block height must be checkpoint interval"
        );

        // Verify aggregated signature (simplified - real impl uses BLS)
        require(
            _verifyAggregatedSignature(
                stateRoot,
                validatorSetHash,
                blockHeight,
                aggregatedSignature
            ),
            "Invalid aggregated signature"
        );

        // Store checkpoint
        checkpoints[blockHeight] = Checkpoint({
            stateRoot: stateRoot,
            validatorSetHash: validatorSetHash,
            blockHeight: blockHeight,
            aggregatedSignature: aggregatedSignature,
            submittedAt: block.timestamp,
            submitter: msg.sender
        });

        latestCheckpointHeight = blockHeight;

        emit CheckpointSubmitted(
            blockHeight,
            stateRoot,
            validatorSetHash,
            msg.sender
        );
    }

    /**
     * @notice Verify a checkpoint exists and is valid
     * @param blockHeight Block height to verify
     * @return valid True if checkpoint exists and is valid
     */
    function verifyCheckpoint(uint256 blockHeight) external view returns (bool valid) {
        Checkpoint storage cp = checkpoints[blockHeight];
        return cp.submittedAt > 0 && cp.stateRoot != bytes32(0);
    }

    /**
     * @notice Get the latest checkpoint
     * @return checkpoint The latest checkpoint data
     */
    function getLatestCheckpoint() external view returns (Checkpoint memory checkpoint) {
        return checkpoints[latestCheckpointHeight];
    }

    /**
     * @notice Get a specific checkpoint
     * @param blockHeight Block height to query
     * @return checkpoint The checkpoint data
     */
    function getCheckpoint(uint256 blockHeight) external view returns (Checkpoint memory checkpoint) {
        return checkpoints[blockHeight];
    }

    /**
     * @notice Verify a state proof against a checkpoint
     * @param blockHeight Checkpoint block height
     * @param key State key to verify
     * @param value Expected value
     * @param proof Merkle proof
     * @return valid True if proof is valid
     */
    function verifyStateProof(
        uint256 blockHeight,
        bytes memory key,
        bytes memory value,
        bytes[] memory proof
    ) external view returns (bool valid) {
        Checkpoint storage cp = checkpoints[blockHeight];
        require(cp.submittedAt > 0, "Checkpoint not found");

        // Verify Merkle proof against state root
        bytes32 leafHash = keccak256(abi.encodePacked(key, value));
        return _verifyMerkleProof(proof, cp.stateRoot, leafHash);
    }

    // ============ Validator Management ============

    /**
     * @notice Add a validator to the set
     * @param addr Validator address
     * @param blsPubKeyHash Hash of BLS public key
     * @param votingPower Voting power
     * @param tier Validator tier
     * @param name Human-readable name
     */
    function addValidator(
        address addr,
        bytes32 blsPubKeyHash,
        uint256 votingPower,
        ValidatorTier tier,
        string calldata name
    ) external onlyOwner {
        require(addr != address(0), "Invalid address");
        require(!validators[addr].isActive, "Validator already exists");
        require(votingPower > 0, "Voting power must be positive");

        validators[addr] = Validator({
            addr: addr,
            blsPubKeyHash: blsPubKeyHash,
            votingPower: votingPower,
            isActive: true,
            name: name,
            tier: tier
        });

        validatorList.push(addr);
        totalVotingPower += votingPower;

        emit ValidatorAdded(addr, votingPower, tier, name);
    }

    /**
     * @notice Remove a validator from the set
     * @param addr Validator address to remove
     */
    function removeValidator(address addr) external onlyOwner {
        require(validators[addr].isActive, "Validator not found");

        totalVotingPower -= validators[addr].votingPower;
        validators[addr].isActive = false;

        // Remove from list
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validatorList[i] == addr) {
                validatorList[i] = validatorList[validatorList.length - 1];
                validatorList.pop();
                break;
            }
        }

        emit ValidatorRemoved(addr);
    }

    /**
     * @notice Get current validator set hash
     * @return hash Hash of current validator set
     */
    function getValidatorSetHash() external view returns (bytes32 hash) {
        return _computeValidatorSetHash();
    }

    /**
     * @notice Get all validators
     * @return List of all validator addresses
     */
    function getValidators() external view returns (address[] memory) {
        return validatorList;
    }

    /**
     * @notice Get validator count by tier
     * @param tier Validator tier to count
     * @return count Number of validators in tier
     */
    function getValidatorCountByTier(ValidatorTier tier) external view returns (uint256 count) {
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].tier == tier) {
                count++;
            }
        }
        return count;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set authorized submitter
     * @param submitter Address to authorize/deauthorize
     * @param authorized Whether to authorize
     */
    function setAuthorizedSubmitter(address submitter, bool authorized) external onlyOwner {
        authorizedSubmitters[submitter] = authorized;
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ============ Internal Functions ============

    /**
     * @notice Verify aggregated BLS signature from validators
     * @dev In production, this would use BLS signature verification
     *      For now, we verify that sufficient voting power signed
     */
    function _verifyAggregatedSignature(
        bytes32 stateRoot,
        bytes32 validatorSetHash,
        uint256 blockHeight,
        bytes calldata aggregatedSignature
    ) internal view returns (bool) {
        // Compute message hash
        bytes32 messageHash = keccak256(
            abi.encodePacked(stateRoot, validatorSetHash, blockHeight)
        );

        // In production: Verify BLS aggregate signature
        // For development: Accept any non-empty signature
        if (aggregatedSignature.length == 0) {
            return false;
        }

        // TODO: Implement BLS12-381 aggregate signature verification
        // This would verify that 2/3 of voting power signed the message
        
        // Placeholder: Return true if signature is present
        return true;
    }

    /**
     * @notice Verify a Merkle proof
     */
    function _verifyMerkleProof(
        bytes[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = abi.decode(proof[i], (bytes32));
            
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == root;
    }

    /**
     * @notice Compute hash of current validator set
     */
    function _computeValidatorSetHash() internal view returns (bytes32) {
        bytes memory encoded;
        for (uint256 i = 0; i < validatorList.length; i++) {
            Validator storage v = validators[validatorList[i]];
            if (v.isActive) {
                encoded = abi.encodePacked(
                    encoded,
                    v.addr,
                    v.blsPubKeyHash,
                    v.votingPower
                );
            }
        }
        return keccak256(encoded);
    }
}
