// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IRaphaTACoBridge.sol";

/**
 * @title RaphaTACoBridge
 * @author Rapha Chain - System Contract
 * @notice Native TACo threshold access control integration at the execution layer
 * @dev Deployed at genesis address 0x8000000000000000000000000000000000000002
 * 
 * This contract bridges the Threshold Network's TACo (Threshold Access Control)
 * to the Rapha Chain, enabling:
 * 1. Dual-signature verification (Lab + Patient) for data submissions
 * 2. Automatic decryption key release upon bounty escrow completion
 * 3. On-chain TACo condition registry for access control policies
 */
contract RaphaTACoBridge is IRaphaTACoBridge {
    // ============ Constants ============
    
    /// @notice System contract identifier
    bytes32 public constant SYSTEM_ID = keccak256("RAPHA_TACO_BRIDGE_V1");
    
    /// @notice Address of the RaphaBountyNative contract (authorized to trigger decryption)
    address public constant BOUNTY_CONTRACT = 0x8000000000000000000000000000000000000003;
    
    /// @notice TACo Verifier precompile address
    address public constant TACO_PRECOMPILE = 0x0000000000000000000000000000000000000080;

    // ============ State Variables ============

    /// @notice Mapping of condition ID to TACo condition
    mapping(bytes32 => TacoCondition) public conditions;

    /// @notice Mapping of patient address to their condition IDs
    mapping(address => bytes32[]) public patientConditions;

    /// @notice Mapping of lab address to conditions they're part of
    mapping(address => bytes32[]) public labConditions;

    /// @notice Counter for generating unique condition IDs
    uint256 private _conditionNonce;

    /// @notice Mapping of bounty ID to its decryption status
    mapping(bytes32 => DecryptionStatus) public bountyDecryptions;

    /// @notice Decryption status for bounties
    struct DecryptionStatus {
        bool triggered;
        address researcher;
        uint256 triggeredAt;
        bytes32 conditionId;
    }

    // ============ Events ============

    /// @notice Emitted when a signature verification request is made
    event SignatureVerificationRequested(
        bytes32 indexed dataHash,
        address indexed requester
    );

    // ============ Modifiers ============

    /**
     * @notice Only the bounty contract can trigger decryption
     */
    modifier onlyBountyContract() {
        require(msg.sender == BOUNTY_CONTRACT, "Only bounty contract");
        _;
    }

    // ============ Core Functions ============

    /**
     * @inheritdoc IRaphaTACoBridge
     * @dev Calls the native TACo verifier precompile at 0x80 for signature verification
     */
    function verifyDualSignature(
        bytes32 dataHash,
        bytes calldata labSignature,
        bytes calldata patientSignature
    ) external view returns (bool valid) {
        // Validate signature lengths (65 bytes for ECDSA: r(32) + s(32) + v(1))
        require(labSignature.length >= 65, "Invalid lab signature length");
        require(patientSignature.length >= 65, "Invalid patient signature length");
        
        // Pack data for precompile call
        bytes memory input = abi.encodePacked(
            dataHash,
            labSignature,
            patientSignature,
            uint8(2) // threshold = 2 (both required)
        );
        
        // Call the TACo verifier precompile
        (bool success, bytes memory result) = TACO_PRECOMPILE.staticcall(input);
        
        if (!success || result.length == 0) {
            return false;
        }
        
        // Decode result (1 byte: 0x01 = valid, 0x00 = invalid)
        return result[0] == 0x01;
    }

    /**
     * @inheritdoc IRaphaTACoBridge
     */
    function registerCondition(
        address labAddress,
        address patientAddress,
        bytes32 policyHash
    ) external returns (bytes32 conditionId) {
        require(labAddress != address(0), "Invalid lab address");
        require(patientAddress != address(0), "Invalid patient address");
        require(policyHash != bytes32(0), "Invalid policy hash");
        
        // Only patient or lab can register a condition
        require(
            msg.sender == patientAddress || msg.sender == labAddress,
            "Only patient or lab can register"
        );
        
        // Generate unique condition ID
        conditionId = keccak256(
            abi.encodePacked(
                labAddress,
                patientAddress,
                policyHash,
                block.timestamp,
                _conditionNonce++
            )
        );
        
        // Create the condition
        conditions[conditionId] = TacoCondition({
            conditionId: conditionId,
            labAddress: labAddress,
            patientAddress: patientAddress,
            policyHash: policyHash,
            registeredAt: block.timestamp,
            isActive: true
        });
        
        // Update indexes
        patientConditions[patientAddress].push(conditionId);
        labConditions[labAddress].push(conditionId);
        
        emit ConditionRegistered(conditionId, msg.sender, policyHash);
        
        return conditionId;
    }

    /**
     * @inheritdoc IRaphaTACoBridge
     * @dev Called by RaphaBountyNative when $RAPHA is locked in escrow
     *      This triggers the release of TACo decryption keys to the researcher
     */
    function triggerDecryption(
        bytes32 bountyId,
        address researcher
    ) external onlyBountyContract {
        require(researcher != address(0), "Invalid researcher address");
        require(!bountyDecryptions[bountyId].triggered, "Already triggered");
        
        // Record the decryption trigger
        bountyDecryptions[bountyId] = DecryptionStatus({
            triggered: true,
            researcher: researcher,
            triggeredAt: block.timestamp,
            conditionId: bountyId // bountyId maps to condition in this flow
        });
        
        emit DecryptionTriggered(bountyId, researcher, bountyId);
    }

    /**
     * @inheritdoc IRaphaTACoBridge
     */
    function getCondition(
        bytes32 conditionId
    ) external view returns (TacoCondition memory condition) {
        return conditions[conditionId];
    }

    /**
     * @inheritdoc IRaphaTACoBridge
     * @dev Verifies signatures match the condition's registered lab and patient
     */
    function isConditionSatisfied(
        bytes32 conditionId,
        bytes calldata labSignature,
        bytes calldata patientSignature
    ) external view returns (bool valid) {
        TacoCondition storage condition = conditions[conditionId];
        require(condition.isActive, "Condition not active");
        
        // Reconstruct data hash from condition
        bytes32 dataHash = keccak256(
            abi.encodePacked(conditionId, condition.policyHash)
        );
        
        // Verify dual signature using precompile
        return this.verifyDualSignature(dataHash, labSignature, patientSignature);
    }

    // ============ View Functions ============

    /**
     * @notice Get all conditions for a patient
     * @param patient Patient address
     * @return Array of condition IDs
     */
    function getPatientConditions(address patient) external view returns (bytes32[] memory) {
        return patientConditions[patient];
    }

    /**
     * @notice Get all conditions for a lab
     * @param lab Lab address
     * @return Array of condition IDs
     */
    function getLabConditions(address lab) external view returns (bytes32[] memory) {
        return labConditions[lab];
    }

    /**
     * @notice Check if decryption was triggered for a bounty
     * @param bountyId Bounty identifier
     * @return status The decryption status
     */
    function getDecryptionStatus(
        bytes32 bountyId
    ) external view returns (DecryptionStatus memory status) {
        return bountyDecryptions[bountyId];
    }

    /**
     * @notice Deactivate a condition (only owner)
     * @param conditionId Condition to deactivate
     */
    function deactivateCondition(bytes32 conditionId) external {
        TacoCondition storage condition = conditions[conditionId];
        require(
            msg.sender == condition.patientAddress,
            "Only patient can deactivate"
        );
        condition.isActive = false;
    }
}
