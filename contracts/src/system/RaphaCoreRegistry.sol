// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IMedicalRecordRegistry.sol";
import "../interfaces/IRaphaTACoBridge.sol";

/**
 * @title RaphaCoreRegistry
 * @author Rapha Chain - System Contract
 * @notice Upgraded MedicalRecordRegistry with native TACo integration and dual-signature requirement
 * @dev Deployed at genesis address 0x8000000000000000000000000000000000000001
 * 
 * The "Rapha Rules":
 * 1. Data hashes cannot be appended unless they include valid threshold signatures from BOTH Lab and Patient
 * 2. All data operations go through native TACo verification
 * 3. System-level permissions for elevated state access
 */
contract RaphaCoreRegistry is IMedicalRecordRegistry {
    // ============ Constants ============
    
    /// @notice TACo Bridge system contract address
    address public constant TACO_BRIDGE = 0x8000000000000000000000000000000000000002;
    
    /// @notice System contract identifier for elevated permissions
    bytes32 public constant SYSTEM_CONTRACT_ID = keccak256("RAPHA_CORE_REGISTRY_V1");

    // ============ State Variables ============

    /// @notice Mapping of record ID to medical record
    mapping(bytes32 => MedicalRecord) public records;

    /// @notice Mapping of patient address to their record IDs
    mapping(address => bytes32[]) public patientRecords;

    /// @notice Mapping of provider address to records they created
    mapping(address => bytes32[]) public providerRecords;

    /// @notice Counter for generating unique record IDs
    uint256 private _recordNonce;

    /// @notice Mapping of record ID to its Lab signature
    mapping(bytes32 => bytes) public recordLabSignatures;

    /// @notice Mapping of record ID to its Patient signature
    mapping(bytes32 => bytes) public recordPatientSignatures;

    // ============ Events ============

    /// @notice Emitted when a record is registered with dual signatures
    event RecordRegisteredWithDualSignature(
        bytes32 indexed recordId,
        address indexed owner,
        address indexed provider,
        bytes32 conditionId,
        bytes32 dataHash
    );

    // ============ Modifiers ============

    /**
     * @notice Ensures the caller has provided valid dual signatures
     * @param dataHash Hash of the data being registered
     * @param labSignature Threshold signature from the lab
     * @param patientSignature Threshold signature from the patient
     */
    modifier requiresDualSignature(
        bytes32 dataHash,
        bytes calldata labSignature,
        bytes calldata patientSignature
    ) {
        require(
            IRaphaTACoBridge(TACO_BRIDGE).verifyDualSignature(
                dataHash,
                labSignature,
                patientSignature
            ),
            "RaphaCoreRegistry: Dual signature required"
        );
        _;
    }

    /**
     * @notice Ensures only the record owner can call the function
     * @param recordId The record to check ownership for
     */
    modifier onlyRecordOwner(bytes32 recordId) {
        require(records[recordId].owner == msg.sender, "Not record owner");
        _;
    }

    /**
     * @notice Ensures the record exists
     * @param recordId The record to check
     */
    modifier recordExists(bytes32 recordId) {
        require(records[recordId].timestamp != 0, "Record does not exist");
        _;
    }

    /**
     * @notice Ensures the record is active
     * @param recordId The record to check
     */
    modifier recordActive(bytes32 recordId) {
        require(records[recordId].isActive, "Record is deactivated");
        _;
    }

    // ============ Core Functions ============

    /**
     * @notice Register a medical record with dual threshold signatures (HIPAA-Native)
     * @param ipfsHash IPFS CID of the encrypted medical data
     * @param integrityHash SHA-256 hash of original file
     * @param recordType Type of medical record (MRI, Blood, Genomics, etc.)
     * @param provider Address of the healthcare provider
     * @param conditionId TACo condition ID for access control
     * @param dataHash Hash of the data being registered
     * @param labSignature Threshold signature from the lab
     * @param patientSignature Threshold signature from the patient
     * @return recordId Unique identifier for the registered record
     */
    function registerRecordWithDualSignature(
        string calldata ipfsHash,
        string calldata integrityHash,
        string calldata recordType,
        address provider,
        bytes32 conditionId,
        bytes32 dataHash,
        bytes calldata labSignature,
        bytes calldata patientSignature
    ) 
        external 
        requiresDualSignature(dataHash, labSignature, patientSignature)
        returns (bytes32 recordId) 
    {
        // Validate inputs
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(integrityHash).length > 0, "Integrity hash required");
        require(bytes(recordType).length > 0, "Record type required");
        require(provider != address(0), "Provider address required");

        // Generate unique record ID
        recordId = keccak256(
            abi.encodePacked(
                msg.sender,
                ipfsHash,
                dataHash,
                block.timestamp,
                _recordNonce++
            )
        );

        // Create the record
        records[recordId] = MedicalRecord({
            owner: msg.sender,
            ipfsHash: ipfsHash,
            integrityHash: integrityHash,
            recordType: recordType,
            provider: provider,
            conditionId: conditionId,
            timestamp: block.timestamp,
            isActive: true,
            isOriginVerified: false,
            providerId: "",
            proofHash: bytes32(0),
            isQualityChecked: false,
            qualityTags: "",
            keeperAddress: address(0)
        });

        // Store signatures for audit trail
        recordLabSignatures[recordId] = labSignature;
        recordPatientSignatures[recordId] = patientSignature;

        // Update indexes
        patientRecords[msg.sender].push(recordId);
        providerRecords[provider].push(recordId);

        // Emit events
        emit RecordRegistered(recordId, msg.sender, provider, ipfsHash, recordType);
        emit RecordRegisteredWithDualSignature(recordId, msg.sender, provider, conditionId, dataHash);

        return recordId;
    }

    /**
     * @inheritdoc IMedicalRecordRegistry
     * @dev Standard registration without dual signature - for backward compatibility
     *      Consider deprecating in favor of registerRecordWithDualSignature
     */
    function registerRecord(
        string calldata ipfsHash,
        string calldata integrityHash,
        string calldata recordType,
        address provider,
        bytes32 conditionId
    ) external returns (bytes32 recordId) {
        // Validate inputs
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(integrityHash).length > 0, "Integrity hash required");
        require(bytes(recordType).length > 0, "Record type required");
        require(provider != address(0), "Provider address required");

        // Generate unique record ID
        recordId = keccak256(
            abi.encodePacked(
                msg.sender,
                ipfsHash,
                block.timestamp,
                _recordNonce++
            )
        );

        // Create the record
        records[recordId] = MedicalRecord({
            owner: msg.sender,
            ipfsHash: ipfsHash,
            integrityHash: integrityHash,
            recordType: recordType,
            provider: provider,
            conditionId: conditionId,
            timestamp: block.timestamp,
            isActive: true,
            isOriginVerified: false,
            providerId: "",
            proofHash: bytes32(0),
            isQualityChecked: false,
            qualityTags: "",
            keeperAddress: address(0)
        });

        // Update indexes
        patientRecords[msg.sender].push(recordId);
        providerRecords[provider].push(recordId);

        emit RecordRegistered(recordId, msg.sender, provider, ipfsHash, recordType);

        return recordId;
    }

    /**
     * @inheritdoc IMedicalRecordRegistry
     */
    function updateCondition(
        bytes32 recordId,
        bytes32 newConditionId
    ) 
        external 
        recordExists(recordId)
        recordActive(recordId)
        onlyRecordOwner(recordId) 
    {
        bytes32 oldConditionId = records[recordId].conditionId;
        records[recordId].conditionId = newConditionId;

        emit ConditionUpdated(recordId, oldConditionId, newConditionId);
    }

    /**
     * @inheritdoc IMedicalRecordRegistry
     */
    function deactivateRecord(
        bytes32 recordId
    ) 
        external 
        recordExists(recordId)
        recordActive(recordId)
        onlyRecordOwner(recordId) 
    {
        records[recordId].isActive = false;
        emit RecordDeactivated(recordId);
    }

    // ============ View Functions ============

    /**
     * @inheritdoc IMedicalRecordRegistry
     */
    function getRecord(
        bytes32 recordId
    ) 
        external 
        view 
        recordExists(recordId)
        returns (MedicalRecord memory) 
    {
        return records[recordId];
    }

    /**
     * @inheritdoc IMedicalRecordRegistry
     */
    function getPatientRecords(
        address patient
    ) external view returns (bytes32[] memory) {
        return patientRecords[patient];
    }

    /**
     * @inheritdoc IMedicalRecordRegistry
     */
    function getRecordsByType(
        address patient,
        string calldata recordType
    ) external view returns (bytes32[] memory) {
        bytes32[] memory allRecords = patientRecords[patient];
        
        // First pass: count matching records
        uint256 count = 0;
        for (uint256 i = 0; i < allRecords.length; i++) {
            if (
                keccak256(bytes(records[allRecords[i]].recordType)) == 
                keccak256(bytes(recordType)) &&
                records[allRecords[i]].isActive
            ) {
                count++;
            }
        }

        // Second pass: populate result array
        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allRecords.length; i++) {
            if (
                keccak256(bytes(records[allRecords[i]].recordType)) == 
                keccak256(bytes(recordType)) &&
                records[allRecords[i]].isActive
            ) {
                result[index++] = allRecords[i];
            }
        }

        return result;
    }

    /**
     * @notice Get all records created by a provider
     * @param provider Provider address
     * @return Array of record IDs
     */
    function getProviderRecords(
        address provider
    ) external view returns (bytes32[] memory) {
        return providerRecords[provider];
    }

    /**
     * @notice Get signatures for a record (for audit purposes)
     * @param recordId Record identifier
     * @return labSig Lab's threshold signature
     * @return patientSig Patient's threshold signature
     */
    function getRecordSignatures(
        bytes32 recordId
    ) 
        external 
        view 
        recordExists(recordId)
        returns (bytes memory labSig, bytes memory patientSig) 
    {
        return (recordLabSignatures[recordId], recordPatientSignatures[recordId]);
    }

    /**
     * @notice Check if a record was registered with dual signatures
     * @param recordId Record identifier
     * @return hasDualSig True if record has both Lab and Patient signatures
     */
    function hasDualSignature(bytes32 recordId) external view returns (bool hasDualSig) {
        return recordLabSignatures[recordId].length > 0 && 
               recordPatientSignatures[recordId].length > 0;
    }

    /**
     * @notice Get the total number of records for a patient
     * @param patient Patient address
     * @return Number of records
     */
    function getPatientRecordCount(
        address patient
    ) external view returns (uint256) {
        return patientRecords[patient].length;
    }

    /**
     * @notice Check if a record exists
     * @param recordId Record identifier
     * @return True if the record exists
     */
    function recordExistsCheck(bytes32 recordId) external view returns (bool) {
        return records[recordId].timestamp != 0;
    }

    // ============ Missing Implementation stubs ============

    function submitVerifiedData(
        string calldata,
        string calldata,
        string calldata,
        address,
        bytes32,
        string calldata,
        bytes32
    ) external pure returns (bytes32) {
        revert("Not implemented");
    }

    function verifyQuality(bytes32, string calldata) external pure {
        revert("Not implemented");
    }

    function flagLowQuality(bytes32) external pure {
        revert("Not implemented");
    }

    function finalizeRecord(bytes32, string calldata) external payable {
        revert("Not implemented");
    }
}
