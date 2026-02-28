// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RaphaPharmaRegistry
 * @author Rapha Chain - System Contract
 * @notice On-chain drug provenance tracking with near-instant finality
 * @dev Deployed at genesis address 0x8000000000000000000000000000000000000006
 *      Uses native precompile at 0x81 for zero-gas batch registration
 * 
 * Features:
 * 1. Zero-gas registration for pharmacies and manufacturers
 * 2. Batch ID tracking with full provenance chain
 * 3. Recall management and alert system
 * 4. Integration with supply chain verification
 */
contract RaphaPharmaRegistry {
    // ============ Constants ============
    
    /// @notice System contract identifier
    bytes32 public constant SYSTEM_ID = keccak256("RAPHA_PHARMA_REGISTRY_V1");
    
    /// @notice Pharma Registry precompile address (zero-gas operations)
    address public constant PHARMA_PRECOMPILE = 0x0000000000000000000000000000000000000081;

    // ============ Structs ============

    /// @notice Drug batch information
    struct DrugBatch {
        bytes32 batchId;
        address manufacturer;
        string drugName;
        string ndcCode;            // National Drug Code
        uint256 quantity;
        uint256 manufacturedAt;
        uint256 expiresAt;
        bytes32 previousBatchId;   // For provenance chain
        BatchStatus status;
        string metadataCid;        // IPFS CID for extended metadata
    }

    /// @notice Batch status tracking
    enum BatchStatus {
        REGISTERED,
        IN_TRANSIT,
        AT_DISTRIBUTOR,
        AT_PHARMACY,
        DISPENSED,
        RECALLED,
        EXPIRED
    }

    /// @notice Transfer record for provenance
    struct TransferRecord {
        address from;
        address to;
        uint256 timestamp;
        string locationCid;        // IPFS CID of location data
        bytes signature;
    }

    /// @notice Recall information
    struct RecallInfo {
        bytes32 batchId;
        string reason;
        uint256 recalledAt;
        address initiator;
        bool resolved;
    }

    // ============ State Variables ============

    /// @notice All registered batches
    mapping(bytes32 => DrugBatch) public batches;
    
    /// @notice Manufacturer to their batch IDs
    mapping(address => bytes32[]) public manufacturerBatches;
    
    /// @notice Current holder of each batch
    mapping(bytes32 => address) public batchHolder;
    
    /// @notice Transfer history for each batch
    mapping(bytes32 => TransferRecord[]) public transferHistory;
    
    /// @notice Active recalls
    mapping(bytes32 => RecallInfo) public recalls;
    
    /// @notice Registered manufacturers
    mapping(address => bool) public registeredManufacturers;
    
    /// @notice Registered pharmacies
    mapping(address => bool) public registeredPharmacies;
    
    /// @notice Registered distributors
    mapping(address => bool) public registeredDistributors;
    
    /// @notice Owner for admin functions
    address public owner;

    // ============ Events ============

    event BatchRegistered(
        bytes32 indexed batchId,
        address indexed manufacturer,
        string drugName,
        uint256 quantity,
        uint256 expiresAt
    );
    
    event BatchTransferred(
        bytes32 indexed batchId,
        address indexed from,
        address indexed to,
        BatchStatus newStatus
    );
    
    event BatchRecalled(
        bytes32 indexed batchId,
        string reason,
        address indexed initiator
    );
    
    event BatchDispensed(
        bytes32 indexed batchId,
        address indexed pharmacy,
        uint256 quantity
    );
    
    event ManufacturerRegistered(address indexed manufacturer);
    event PharmacyRegistered(address indexed pharmacy);
    event DistributorRegistered(address indexed distributor);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyManufacturer() {
        require(registeredManufacturers[msg.sender], "Not a registered manufacturer");
        _;
    }

    modifier onlyPharmacy() {
        require(registeredPharmacies[msg.sender], "Not a registered pharmacy");
        _;
    }

    modifier onlyBatchHolder(bytes32 batchId) {
        require(batchHolder[batchId] == msg.sender, "Not batch holder");
        _;
    }

    modifier batchExists(bytes32 batchId) {
        require(batches[batchId].manufacturedAt != 0, "Batch does not exist");
        _;
    }

    // ============ Constructor ============

    constructor() {
        owner = msg.sender;
    }

    // ============ Core Functions ============

    /**
     * @notice Register a new drug batch (zero-gas via precompile)
     * @param drugName Name of the drug
     * @param ndcCode National Drug Code
     * @param quantity Number of units in batch
     * @param expiresAt Expiration timestamp
     * @param previousBatchId Previous batch in provenance chain (0 for new)
     * @param metadataCid IPFS CID for extended metadata
     * @return batchId Unique batch identifier
     */
    function registerBatch(
        string calldata drugName,
        string calldata ndcCode,
        uint256 quantity,
        uint256 expiresAt,
        bytes32 previousBatchId,
        string calldata metadataCid
    ) external onlyManufacturer returns (bytes32 batchId) {
        require(bytes(drugName).length > 0, "Drug name required");
        require(quantity > 0, "Quantity must be > 0");
        require(expiresAt > block.timestamp, "Invalid expiration");
        
        // Generate unique batch ID
        batchId = keccak256(
            abi.encodePacked(
                msg.sender,
                drugName,
                ndcCode,
                block.timestamp,
                quantity
            )
        );
        
        // Create batch record
        batches[batchId] = DrugBatch({
            batchId: batchId,
            manufacturer: msg.sender,
            drugName: drugName,
            ndcCode: ndcCode,
            quantity: quantity,
            manufacturedAt: block.timestamp,
            expiresAt: expiresAt,
            previousBatchId: previousBatchId,
            status: BatchStatus.REGISTERED,
            metadataCid: metadataCid
        });
        
        // Set initial holder
        batchHolder[batchId] = msg.sender;
        
        // Track by manufacturer
        manufacturerBatches[msg.sender].push(batchId);
        
        // Register via precompile for zero-gas verification
        _registerWithPrecompile(batchId, msg.sender);
        
        emit BatchRegistered(batchId, msg.sender, drugName, quantity, expiresAt);
        
        return batchId;
    }

    /**
     * @notice Transfer batch to new holder
     * @param batchId Batch to transfer
     * @param to New holder address
     * @param newStatus Updated status
     * @param locationCid IPFS CID of transfer location
     */
    function transferBatch(
        bytes32 batchId,
        address to,
        BatchStatus newStatus,
        string calldata locationCid
    ) external batchExists(batchId) onlyBatchHolder(batchId) {
        require(to != address(0), "Invalid recipient");
        require(batches[batchId].status != BatchStatus.RECALLED, "Batch recalled");
        require(batches[batchId].status != BatchStatus.DISPENSED, "Already dispensed");
        
        // Validate status transition
        _validateStatusTransition(batches[batchId].status, newStatus);
        
        // Record transfer
        transferHistory[batchId].push(TransferRecord({
            from: msg.sender,
            to: to,
            timestamp: block.timestamp,
            locationCid: locationCid,
            signature: "" // Could add signature verification
        }));
        
        // Update batch
        batches[batchId].status = newStatus;
        batchHolder[batchId] = to;
        
        emit BatchTransferred(batchId, msg.sender, to, newStatus);
    }

    /**
     * @notice Dispense batch at pharmacy (final step)
     * @param batchId Batch to dispense
     * @param quantityDispensed Amount dispensed
     */
    function dispenseBatch(
        bytes32 batchId,
        uint256 quantityDispensed
    ) external batchExists(batchId) onlyPharmacy onlyBatchHolder(batchId) {
        require(batches[batchId].status == BatchStatus.AT_PHARMACY, "Not at pharmacy");
        require(quantityDispensed <= batches[batchId].quantity, "Exceeds quantity");
        require(batches[batchId].expiresAt > block.timestamp, "Batch expired");
        
        batches[batchId].quantity -= quantityDispensed;
        
        if (batches[batchId].quantity == 0) {
            batches[batchId].status = BatchStatus.DISPENSED;
        }
        
        emit BatchDispensed(batchId, msg.sender, quantityDispensed);
    }

    /**
     * @notice Initiate batch recall
     * @param batchId Batch to recall
     * @param reason Recall reason
     */
    function recallBatch(
        bytes32 batchId,
        string calldata reason
    ) external batchExists(batchId) {
        // Only manufacturer or owner can recall
        require(
            msg.sender == batches[batchId].manufacturer || msg.sender == owner,
            "Not authorized to recall"
        );
        
        batches[batchId].status = BatchStatus.RECALLED;
        
        recalls[batchId] = RecallInfo({
            batchId: batchId,
            reason: reason,
            recalledAt: block.timestamp,
            initiator: msg.sender,
            resolved: false
        });
        
        emit BatchRecalled(batchId, reason, msg.sender);
    }

    // ============ View Functions ============

    function getBatch(bytes32 batchId) external view returns (DrugBatch memory) {
        return batches[batchId];
    }

    function getTransferHistory(bytes32 batchId) external view returns (TransferRecord[] memory) {
        return transferHistory[batchId];
    }

    function getManufacturerBatches(address manufacturer) external view returns (bytes32[] memory) {
        return manufacturerBatches[manufacturer];
    }

    function isRecalled(bytes32 batchId) external view returns (bool) {
        return batches[batchId].status == BatchStatus.RECALLED;
    }

    function getRecallInfo(bytes32 batchId) external view returns (RecallInfo memory) {
        return recalls[batchId];
    }

    /**
     * @notice Verify batch provenance chain
     * @param batchId Batch to verify
     * @return valid True if provenance chain is valid
     * @return chainLength Number of batches in chain
     */
    function verifyProvenance(bytes32 batchId) external view returns (bool valid, uint256 chainLength) {
        bytes32 current = batchId;
        chainLength = 0;
        
        while (current != bytes32(0) && chainLength < 100) { // Max 100 to prevent infinite loop
            if (batches[current].manufacturedAt == 0) {
                return (false, chainLength);
            }
            current = batches[current].previousBatchId;
            chainLength++;
        }
        
        return (true, chainLength);
    }

    // ============ Admin Functions ============

    function registerManufacturer(address manufacturer) external onlyOwner {
        registeredManufacturers[manufacturer] = true;
        emit ManufacturerRegistered(manufacturer);
    }

    function registerPharmacy(address pharmacy) external onlyOwner {
        registeredPharmacies[pharmacy] = true;
        emit PharmacyRegistered(pharmacy);
    }

    function registerDistributor(address distributor) external onlyOwner {
        registeredDistributors[distributor] = true;
        emit DistributorRegistered(distributor);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    // ============ Internal Functions ============

    /**
     * @notice Call precompile for zero-gas registration verification
     */
    function _registerWithPrecompile(bytes32 batchId, address manufacturer) internal {
        // Pack data for precompile
        bytes memory input = abi.encodePacked(
            manufacturer,
            batchId,
            block.timestamp
        );
        
        // Call precompile (will be 0-gas in production)
        (bool success,) = PHARMA_PRECOMPILE.call(input);
        // Precompile may not exist in test environment
        if (!success) {
            // Fallback: just emit event (precompile not available)
        }
    }

    /**
     * @notice Validate batch status transitions
     */
    function _validateStatusTransition(BatchStatus from, BatchStatus to) internal pure {
        if (from == BatchStatus.REGISTERED) {
            require(to == BatchStatus.IN_TRANSIT, "Invalid transition");
        } else if (from == BatchStatus.IN_TRANSIT) {
            require(
                to == BatchStatus.AT_DISTRIBUTOR || to == BatchStatus.AT_PHARMACY,
                "Invalid transition"
            );
        } else if (from == BatchStatus.AT_DISTRIBUTOR) {
            require(
                to == BatchStatus.IN_TRANSIT || to == BatchStatus.AT_PHARMACY,
                "Invalid transition"
            );
        } else if (from == BatchStatus.AT_PHARMACY) {
            require(to == BatchStatus.DISPENSED, "Use dispenseBatch()");
        } else {
            revert("Cannot transition from current status");
        }
    }
}
