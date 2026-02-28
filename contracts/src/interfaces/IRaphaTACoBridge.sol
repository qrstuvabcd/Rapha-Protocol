// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRaphaTACoBridge
 * @author Rapha Chain - System Contract
 * @notice Interface for native TACo threshold access control bridge
 * @dev Deployed at genesis address 0x8000000000000000000000000000000000000002
 */
interface IRaphaTACoBridge {
    // ============ Events ============
    
    /// @notice Emitted when a dual signature is verified
    event DualSignatureVerified(
        bytes32 indexed dataHash,
        address indexed lab,
        address indexed patient
    );
    
    /// @notice Emitted when decryption is triggered for a bounty
    event DecryptionTriggered(
        bytes32 indexed bountyId,
        address indexed researcher,
        bytes32 conditionId
    );
    
    /// @notice Emitted when a TACo condition is registered
    event ConditionRegistered(
        bytes32 indexed conditionId,
        address indexed owner,
        bytes32 policyHash
    );

    // ============ Structs ============
    
    /// @notice TACo condition with Lab + Patient requirement
    struct TacoCondition {
        bytes32 conditionId;
        address labAddress;
        address patientAddress;
        bytes32 policyHash;        // Hash of the TACo policy document
        uint256 registeredAt;
        bool isActive;
    }

    // ============ Functions ============
    
    /// @notice Verify dual threshold signature (Lab + Patient)
    /// @param dataHash Hash of the medical data being attested
    /// @param labSignature Threshold signature from the lab
    /// @param patientSignature Threshold signature from the patient
    /// @return valid True if both signatures are valid
    function verifyDualSignature(
        bytes32 dataHash,
        bytes calldata labSignature,
        bytes calldata patientSignature
    ) external view returns (bool valid);
    
    /// @notice Register a new TACo condition
    /// @param labAddress Address of the authorized lab
    /// @param patientAddress Address of the patient
    /// @param policyHash Hash of the TACo policy document
    /// @return conditionId Unique identifier for this condition
    function registerCondition(
        address labAddress,
        address patientAddress,
        bytes32 policyHash
    ) external returns (bytes32 conditionId);
    
    /// @notice Trigger decryption key release for a bounty
    /// @param bountyId ID of the completed bounty
    /// @param researcher Address of the researcher receiving keys
    /// @dev Only callable by RaphaBountyNative contract
    function triggerDecryption(
        bytes32 bountyId,
        address researcher
    ) external;
    
    /// @notice Get a registered condition
    /// @param conditionId The condition to query
    /// @return condition The TACo condition details
    function getCondition(
        bytes32 conditionId
    ) external view returns (TacoCondition memory condition);
    
    /// @notice Check if a condition is valid for data submission
    /// @param conditionId The condition to verify
    /// @param labSignature Lab's threshold signature
    /// @param patientSignature Patient's threshold signature
    /// @return valid True if the condition is satisfied
    function isConditionSatisfied(
        bytes32 conditionId,
        bytes calldata labSignature,
        bytes calldata patientSignature
    ) external view returns (bool valid);
}
