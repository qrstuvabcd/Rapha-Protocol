// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IMedicalRecordRegistry.sol";

/**
 * @title MedicalRecordRegistry
 * @author Rapha Protocol
 * @notice Indexes encrypted medical records with ZK-TLS origin verification
 *         and Keeper-based quality assurance.
 * @dev Access control is delegated to Threshold TACo conditions. The conditionId
 *      links to the Threshold Network policy that determines who can decrypt.
 */
contract MedicalRecordRegistry is IMedicalRecordRegistry {
    // ============ State Variables ============

    /// @notice Mapping of record ID to medical record
    mapping(bytes32 => MedicalRecord) public records;

    /// @notice Mapping of patient address to their record IDs
    mapping(address => bytes32[]) public patientRecords;

    /// @notice Mapping of provider address to records they created
    mapping(address => bytes32[]) public providerRecords;

    /// @notice Counter for generating unique record IDs
    uint256 private _recordNonce;

    /// @notice Contract deployer (used for keeper management)
    address public immutable deployer;

    // ============ Keeper Whitelist ============

    /// @notice Authorized keepers who can verify data quality
    mapping(address => bool) public authorizedKeepers;

    // ============ Access Control ============

    enum AccessLevel { NONE, COMPUTE, OWNER }
    
    /// @notice Permissions for each record: recordId => user => level
    mapping(bytes32 => mapping(address => AccessLevel)) public permissions;

    // ============ Modifiers ============

    modifier onlyDeployer() {
        require(msg.sender == deployer, "Only deployer");
        _;
    }

    modifier onlyKeeper() {
        require(authorizedKeepers[msg.sender], "Not authorized keeper");
        _;
    }

    modifier onlyRecordOwner(bytes32 recordId) {
        require(records[recordId].owner == msg.sender, "Not record owner");
        _;
    }

    modifier onlyCompute(bytes32 recordId) {
        require(
            permissions[recordId][msg.sender] == AccessLevel.COMPUTE || 
            records[recordId].owner == msg.sender,
            "Compute access required"
        );
        _;
    }

    modifier onlyPatientOrProvider(bytes32 recordId) {
        MedicalRecord storage record = records[recordId];
        require(
            record.owner == msg.sender || record.provider == msg.sender,
            "Not patient or provider"
        );
        _;
    }

    modifier recordExists(bytes32 recordId) {
        require(records[recordId].timestamp != 0, "Record does not exist");
        _;
    }

    modifier recordActive(bytes32 recordId) {
        require(records[recordId].isActive, "Record is deactivated");
        _;
    }

    // ============ Constructor ============

    constructor() {
        deployer = msg.sender;
    }

    // ============ Keeper Management ============

    function addKeeper(address keeper) external onlyDeployer {
        require(keeper != address(0), "Invalid address");
        authorizedKeepers[keeper] = true;
    }

    function removeKeeper(address keeper) external onlyDeployer {
        authorizedKeepers[keeper] = false;
    }

    // ============ External Functions ============

    /**
     * @inheritdoc IMedicalRecordRegistry
     */
    function registerRecord(
        string calldata ipfsHash,
        string calldata integrityHash,
        string calldata recordType,
        address provider,
        bytes32 conditionId
    ) external returns (bytes32 recordId) {
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(integrityHash).length > 0, "Integrity hash required");
        require(bytes(recordType).length > 0, "Record type required");
        require(provider != address(0), "Provider address required");

        recordId = keccak256(
            abi.encodePacked(
                msg.sender,
                ipfsHash,
                block.timestamp,
                _recordNonce++
            )
        );

        records[recordId] = MedicalRecord({
            owner: msg.sender,
            ipfsHash: ipfsHash,
            integrityHash: integrityHash,
            recordType: recordType,
            provider: provider,
            conditionId: conditionId,
            timestamp: block.timestamp,
            isActive: true,
            // ZK-TLS fields default to unverified
            isOriginVerified: false,
            providerId: "",
            proofHash: bytes32(0),
            // Quality fields default to unchecked
            isQualityChecked: false,
            qualityTags: "",
            keeperAddress: address(0)
        });

        patientRecords[msg.sender].push(recordId);
        providerRecords[provider].push(recordId);

        emit RecordRegistered(
            recordId,
            msg.sender,
            provider,
            ipfsHash,
            recordType
        );

        return recordId;
    }

    /**
     * @inheritdoc IMedicalRecordRegistry
     * @dev Automatically sets isOriginVerified = true
     */
    function submitVerifiedData(
        string calldata ipfsHash,
        string calldata integrityHash,
        string calldata recordType,
        address provider,
        bytes32 conditionId,
        string calldata providerId,
        bytes32 proofHash
    ) external returns (bytes32 recordId) {
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        require(bytes(integrityHash).length > 0, "Integrity hash required");
        require(bytes(recordType).length > 0, "Record type required");
        require(provider != address(0), "Provider address required");
        require(bytes(providerId).length > 0, "Provider ID required");
        require(proofHash != bytes32(0), "Proof hash required");

        recordId = keccak256(
            abi.encodePacked(
                msg.sender,
                ipfsHash,
                block.timestamp,
                _recordNonce++
            )
        );

        records[recordId] = MedicalRecord({
            owner: msg.sender,
            ipfsHash: ipfsHash,
            integrityHash: integrityHash,
            recordType: recordType,
            provider: provider,
            conditionId: conditionId,
            timestamp: block.timestamp,
            isActive: true,
            // ZK-TLS verified
            isOriginVerified: true,
            providerId: providerId,
            proofHash: proofHash,
            // Quality pending Keeper review
            isQualityChecked: false,
            qualityTags: "",
            keeperAddress: address(0)
        });

        patientRecords[msg.sender].push(recordId);
        providerRecords[provider].push(recordId);

        emit RecordRegistered(
            recordId,
            msg.sender,
            provider,
            ipfsHash,
            recordType
        );

        emit VerifiedDataSubmitted(
            recordId,
            msg.sender,
            providerId,
            proofHash
        );

        return recordId;
    }

    /**
     * @inheritdoc IMedicalRecordRegistry
     * @dev Only callable by authorized Keepers. Triggers Data UBI payment (off-chain).
     */
    function verifyQuality(
        bytes32 recordId,
        string calldata tags
    )
        external
        recordExists(recordId)
        recordActive(recordId)
        onlyKeeper
    {
        require(records[recordId].isOriginVerified, "Record must be origin-verified");
        require(!records[recordId].isQualityChecked, "Already quality-checked");
        require(bytes(tags).length > 0, "Tags required");

        records[recordId].isQualityChecked = true;
        records[recordId].qualityTags = tags;
        records[recordId].keeperAddress = msg.sender;

        emit QualityVerified(recordId, msg.sender, tags);
    }

    /**
     * @inheritdoc IMedicalRecordRegistry
     * @dev Finalizes a record: quality check + Data UBI payment to patient.
     *      The Keeper sends MATIC with the call. The contract forwards it
     *      to the patient as their Data UBI reward for contributing verified data.
     */
    function finalizeRecord(
        bytes32 recordId,
        string calldata tags
    )
        external
        payable
        recordExists(recordId)
        recordActive(recordId)
        onlyKeeper
    {
        require(records[recordId].isOriginVerified, "Must be origin-verified");
        require(!records[recordId].isQualityChecked, "Already finalized");
        require(bytes(tags).length > 0, "Tags required");

        // Mark quality checked
        records[recordId].isQualityChecked = true;
        records[recordId].qualityTags = tags;
        records[recordId].keeperAddress = msg.sender;

        emit QualityVerified(recordId, msg.sender, tags);

        // Transfer Data UBI to patient (if value sent)
        if (msg.value > 0) {
            address patient = records[recordId].owner;
            (bool sent, ) = payable(patient).call{value: msg.value}("");
            require(sent, "UBI transfer failed");
            emit DataUBIReleased(recordId, patient, msg.value);
        }
    }

    /**
     * @inheritdoc IMedicalRecordRegistry
     * @dev Only callable by authorized Keepers. Deactivates the record.
     */
    function flagLowQuality(
        bytes32 recordId
    )
        external
        recordExists(recordId)
        recordActive(recordId)
        onlyKeeper
    {
        require(records[recordId].isOriginVerified, "Record must be origin-verified");
        require(!records[recordId].isQualityChecked, "Already quality-checked");

        records[recordId].isActive = false;

        emit LowQualityFlagged(recordId, msg.sender);
        emit RecordDeactivated(recordId);
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

    /**
     * @notice Get unreviewed records for a patient (origin-verified but not quality-checked)
     * @param patient Patient address
     * @return Array of record IDs pending quality review
     */
    function getUnreviewedRecords(
        address patient
    ) external view returns (bytes32[] memory) {
        bytes32[] memory allRecords = patientRecords[patient];
        
        uint256 count = 0;
        for (uint256 i = 0; i < allRecords.length; i++) {
            if (
                records[allRecords[i]].isOriginVerified &&
                !records[allRecords[i]].isQualityChecked &&
                records[allRecords[i]].isActive
            ) {
                count++;
            }
        }

        bytes32[] memory result = new bytes32[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allRecords.length; i++) {
            if (
                records[allRecords[i]].isOriginVerified &&
                !records[allRecords[i]].isQualityChecked &&
                records[allRecords[i]].isActive
            ) {
                result[index++] = allRecords[i];
            }
        }

        return result;
    }
}
