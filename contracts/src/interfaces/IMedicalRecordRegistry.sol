// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMedicalRecordRegistry
 * @notice Interface for the Medical Record Registry contract
 * @dev Used for type-safe interactions and upgradeability patterns
 */
interface IMedicalRecordRegistry {
    /// @notice Medical record structure
    struct MedicalRecord {
        address owner;          // Patient wallet address
        string ipfsHash;        // IPFS CID - pointer to TACo-encrypted file
        string integrityHash;   // SHA-256 hash of original file (for audit)
        string recordType;      // e.g., "MRI", "Blood", "Genomics"
        address provider;       // Hospital/clinic that created the record
        bytes32 conditionId;    // TACo policy ID for access control
        uint256 timestamp;      // Block timestamp of registration
        bool isActive;          // Soft delete flag
        // --- ZK-TLS Origin Verification ---
        bool isOriginVerified;  // True only if imported via ZK-TLS flow
        string providerId;      // e.g., "nhs.uk"
        bytes32 proofHash;      // Hash of the ZK proof
        // --- Keeper Quality Check ---
        bool isQualityChecked;  // Set by authorized Keeper
        string qualityTags;     // e.g., "#DiabetesType2, #ClearLungs"
        address keeperAddress;  // Keeper who verified quality
    }

    /// @notice Emitted when a new record is registered
    event RecordRegistered(
        bytes32 indexed recordId,
        address indexed owner,
        address indexed provider,
        string ipfsHash,
        string recordType
    );

    /// @notice Emitted when a verified record is submitted via ZK-TLS
    event VerifiedDataSubmitted(
        bytes32 indexed recordId,
        address indexed owner,
        string providerId,
        bytes32 proofHash
    );

    /// @notice Emitted when a Keeper approves record quality
    event QualityVerified(
        bytes32 indexed recordId,
        address indexed keeper,
        string tags
    );

    /// @notice Emitted when a Keeper flags low-quality data
    event LowQualityFlagged(
        bytes32 indexed recordId,
        address indexed keeper
    );

    /// @notice Emitted when a record's TACo condition is updated
    event ConditionUpdated(
        bytes32 indexed recordId,
        bytes32 oldConditionId,
        bytes32 newConditionId
    );

    /// @notice Emitted when a record is deactivated
    event RecordDeactivated(bytes32 indexed recordId);

    /// @notice Emitted when Data UBI payment is released to the patient
    event DataUBIReleased(
        bytes32 indexed recordId,
        address indexed patient,
        uint256 amount
    );

    /**
     * @notice Register a new medical record (standard upload)
     */
    function registerRecord(
        string calldata ipfsHash,
        string calldata integrityHash,
        string calldata recordType,
        address provider,
        bytes32 conditionId
    ) external returns (bytes32 recordId);

    /**
     * @notice Submit a verified record via ZK-TLS flow
     * @param ipfsHash IPFS CID of the encrypted file
     * @param integrityHash SHA-256 hash of the original file
     * @param recordType Type of medical record
     * @param provider Address of the healthcare provider
     * @param conditionId TACo condition ID for access control
     * @param providerId Domain identifier (e.g., "nhs.uk")
     * @param proofHash Hash of the ZK proof of origin
     * @return recordId Unique identifier for the record
     */
    function submitVerifiedData(
        string calldata ipfsHash,
        string calldata integrityHash,
        string calldata recordType,
        address provider,
        bytes32 conditionId,
        string calldata providerId,
        bytes32 proofHash
    ) external returns (bytes32 recordId);

    /**
     * @notice Approve record quality and add labels (Keeper only)
     * @param recordId Record identifier
     * @param tags Medical labels (e.g., "#DiabetesType2, #ClearLungs")
     */
    function verifyQuality(bytes32 recordId, string calldata tags) external;

    /**
     * @notice Flag a record as low quality (Keeper only)
     * @param recordId Record identifier
     */
    function flagLowQuality(bytes32 recordId) external;

    /**
     * @notice Finalize a verified record — quality check + Data UBI payment to patient
     * @param recordId Record identifier
     * @param tags Medical labels (e.g., "#DiabetesType2, #ClearLungs")
     * @dev Keeper sends ETH/MATIC with the call; contract forwards to patient as UBI
     */
    function finalizeRecord(bytes32 recordId, string calldata tags) external payable;

    /**
     * @notice Update the TACo condition for a record
     */
    function updateCondition(bytes32 recordId, bytes32 newConditionId) external;

    /**
     * @notice Deactivate a record (soft delete)
     */
    function deactivateRecord(bytes32 recordId) external;

    /**
     * @notice Get a record by ID
     */
    function getRecord(bytes32 recordId) external view returns (MedicalRecord memory);

    /**
     * @notice Get all record IDs for a patient
     */
    function getPatientRecords(address patient) external view returns (bytes32[] memory);

    /**
     * @notice Get records filtered by type
     */
    function getRecordsByType(
        address patient,
        string calldata recordType
    ) external view returns (bytes32[] memory);
}
