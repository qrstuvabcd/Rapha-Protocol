// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IRaphaTACoBridge.sol";

/**
 * @title RaphaBountyNative
 * @author Rapha Chain - System Contract
 * @notice Native $RAPHA bounty system with TACo integration for decryption key release
 * @dev Deployed at genesis address 0x8000000000000000000000000000000000000003
 * 
 * Key Features:
 * 1. Uses native $RAPHA instead of ERC-20 tokens
 * 2. Auto-triggers TACo decryption when bounty escrow is locked
 * 3. 80/20 split: 80% to patients, 20% to research treasury
 */
contract RaphaBountyNative {
    // ============ Constants ============
    
    /// @notice System contract identifier
    bytes32 public constant SYSTEM_ID = keccak256("RAPHA_BOUNTY_NATIVE_V1");
    
    /// @notice TACo Bridge system contract
    address public constant TACO_BRIDGE = 0x8000000000000000000000000000000000000002;
    
    /// @notice Research treasury for platform fees (funds gasless patient txs)
    address public constant RESEARCH_TREASURY = 0x8000000000000000000000000000000000000004;
    
    /// @notice Treasury fee percentage (20%)
    uint256 public constant TREASURY_FEE_BPS = 2000;
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    /// @notice Minimum bounty amount (100 RAPHA)
    uint256 public constant MIN_BOUNTY = 100 ether;

    // ============ Structs ============
    
    enum BountyState { OPEN, FILLED, EXECUTED, EXPIRED, CANCELLED }
    
    struct Bounty {
        bytes32 bountyId;
        address startup;           // Pharma/researcher who created the bounty
        string metadataCid;        // IPFS CID of bounty metadata
        uint256 bountyPerUser;     // RAPHA per participant
        uint256 maxUsers;          // Maximum participants
        uint256 deadline;          // Expiration timestamp
        uint256 totalBudget;       // Total RAPHA locked
        BountyState state;
        address[] participants;
        string resultHash;         // IPFS hash of computation results
        bytes32 tacoConditionId;   // TACo condition linked to this bounty
    }

    // ============ State Variables ============

    /// @notice All bounties
    mapping(bytes32 => Bounty) public bounties;
    
    /// @notice Bounty IDs by creator
    mapping(address => bytes32[]) public creatorBounties;
    
    /// @notice Whether address has joined a specific bounty
    mapping(bytes32 => mapping(address => bool)) public hasJoined;
    
    /// @notice Bounty counter
    uint256 private _bountyNonce;
    
    /// @notice Authorized compute nodes
    mapping(address => bool) public authorizedNodes;
    
    /// @notice Owner for admin functions
    address public owner;

    // ============ Events ============

    event BountyCreated(
        bytes32 indexed bountyId,
        address indexed startup,
        uint256 bountyPerUser,
        uint256 maxUsers,
        uint256 deadline,
        bytes32 tacoConditionId
    );
    
    event ParticipantJoined(
        bytes32 indexed bountyId,
        address indexed participant,
        uint256 totalParticipants
    );
    
    event BountyFilled(bytes32 indexed bountyId, uint256 timestamp);
    
    event BountyExecuted(
        bytes32 indexed bountyId,
        string resultHash,
        uint256 treasuryAmount,
        uint256 perUserPayout
    );
    
    event DecryptionKeysReleased(
        bytes32 indexed bountyId,
        address indexed researcher
    );
    
    event BountyRefunded(bytes32 indexed bountyId, address indexed startup, uint256 amount);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorizedNode() {
        require(authorizedNodes[msg.sender], "Not authorized node");
        _;
    }

    modifier bountyExists(bytes32 bountyId) {
        require(bounties[bountyId].deadline != 0, "Bounty does not exist");
        _;
    }

    // ============ Constructor ============

    constructor() {
        owner = msg.sender;
    }

    // ============ Core Functions ============

    /**
     * @notice Create a new bounty campaign with native RAPHA
     * @param metadataCid IPFS CID of bounty metadata
     * @param bountyPerUser RAPHA reward per participant
     * @param maxUsers Maximum number of participants
     * @param duration Duration in seconds
     * @param tacoConditionId TACo condition for data access
     * @return bountyId Unique bounty identifier
     */
    function createBounty(
        string calldata metadataCid,
        uint256 bountyPerUser,
        uint256 maxUsers,
        uint256 duration,
        bytes32 tacoConditionId
    ) external payable returns (bytes32 bountyId) {
        require(bountyPerUser >= MIN_BOUNTY / maxUsers, "Bounty per user too low");
        require(maxUsers > 0, "Max users must be > 0");
        require(duration > 0, "Duration must be > 0");
        require(bytes(metadataCid).length > 0, "Metadata CID required");
        
        uint256 totalBudget = bountyPerUser * maxUsers;
        require(msg.value >= totalBudget, "Insufficient RAPHA sent");
        
        // Generate unique bounty ID
        bountyId = keccak256(
            abi.encodePacked(
                msg.sender,
                metadataCid,
                block.timestamp,
                _bountyNonce++
            )
        );
        
        // Create bounty
        Bounty storage bounty = bounties[bountyId];
        bounty.bountyId = bountyId;
        bounty.startup = msg.sender;
        bounty.metadataCid = metadataCid;
        bounty.bountyPerUser = bountyPerUser;
        bounty.maxUsers = maxUsers;
        bounty.deadline = block.timestamp + duration;
        bounty.totalBudget = totalBudget;
        bounty.state = BountyState.OPEN;
        bounty.tacoConditionId = tacoConditionId;
        
        // Track by creator
        creatorBounties[msg.sender].push(bountyId);
        
        // Refund excess
        if (msg.value > totalBudget) {
            payable(msg.sender).transfer(msg.value - totalBudget);
        }
        
        emit BountyCreated(bountyId, msg.sender, bountyPerUser, maxUsers, bounty.deadline, tacoConditionId);
        
        return bountyId;
    }

    /**
     * @notice Patient joins a bounty pool
     * @param bountyId Bounty to join
     */
    function joinBounty(bytes32 bountyId) external bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        
        require(bounty.state == BountyState.OPEN, "Bounty not open");
        require(block.timestamp < bounty.deadline, "Bounty expired");
        require(bounty.participants.length < bounty.maxUsers, "Bounty full");
        require(!hasJoined[bountyId][msg.sender], "Already joined");
        
        hasJoined[bountyId][msg.sender] = true;
        bounty.participants.push(msg.sender);
        
        emit ParticipantJoined(bountyId, msg.sender, bounty.participants.length);
        
        // Auto-transition to FILLED when max reached
        if (bounty.participants.length == bounty.maxUsers) {
            bounty.state = BountyState.FILLED;
            emit BountyFilled(bountyId, block.timestamp);
        }
    }

    /**
     * @notice Execute bounty and distribute rewards
     * @param bountyId Bounty to execute
     * @param resultHash IPFS hash of computation results
     * @dev Only authorized compute nodes can call
     *      This auto-triggers TACo decryption key release
     */
    function executeBounty(
        bytes32 bountyId,
        string calldata resultHash
    ) external onlyAuthorizedNode bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        
        require(bounty.state == BountyState.FILLED, "Bounty not filled");
        require(bytes(resultHash).length > 0, "Result hash required");
        
        bounty.state = BountyState.EXECUTED;
        bounty.resultHash = resultHash;
        
        // Calculate 80/20 split
        uint256 treasuryAmount = (bounty.totalBudget * TREASURY_FEE_BPS) / BPS_DENOMINATOR;
        uint256 patientTotal = bounty.totalBudget - treasuryAmount;
        uint256 perUserPayout = patientTotal / bounty.participants.length;
        
        // Send 20% to research treasury (funds gasless txs)
        payable(RESEARCH_TREASURY).transfer(treasuryAmount);
        
        // Distribute 80% to participants
        for (uint256 i = 0; i < bounty.participants.length; i++) {
            payable(bounty.participants[i]).transfer(perUserPayout);
        }
        
        // Trigger TACo decryption key release to the researcher
        IRaphaTACoBridge(TACO_BRIDGE).triggerDecryption(bountyId, bounty.startup);
        
        emit BountyExecuted(bountyId, resultHash, treasuryAmount, perUserPayout);
        emit DecryptionKeysReleased(bountyId, bounty.startup);
    }

    /**
     * @notice Refund startup if bounty didn't fill before deadline
     * @param bountyId Bounty to refund
     */
    function refundBounty(bytes32 bountyId) external bountyExists(bountyId) {
        Bounty storage bounty = bounties[bountyId];
        
        require(bounty.state == BountyState.OPEN, "Invalid state");
        require(block.timestamp > bounty.deadline, "Not expired");
        
        bounty.state = BountyState.EXPIRED;
        
        uint256 refundAmount = address(this).balance >= bounty.totalBudget 
            ? bounty.totalBudget 
            : address(this).balance;
            
        if (refundAmount > 0) {
            payable(bounty.startup).transfer(refundAmount);
        }
        
        emit BountyRefunded(bountyId, bounty.startup, refundAmount);
    }

    // ============ View Functions ============

    function getBounty(bytes32 bountyId) external view returns (Bounty memory) {
        return bounties[bountyId];
    }

    function getParticipants(bytes32 bountyId) external view returns (address[] memory) {
        return bounties[bountyId].participants;
    }

    function getCreatorBounties(address creator) external view returns (bytes32[] memory) {
        return creatorBounties[creator];
    }

    function getBountyProgress(bytes32 bountyId) external view returns (uint256 current, uint256 max) {
        Bounty storage bounty = bounties[bountyId];
        return (bounty.participants.length, bounty.maxUsers);
    }

    // ============ Admin Functions ============

    function setAuthorizedNode(address node, bool authorized) external onlyOwner {
        authorizedNodes[node] = authorized;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    // Accept native RAPHA
    receive() external payable {}
}
