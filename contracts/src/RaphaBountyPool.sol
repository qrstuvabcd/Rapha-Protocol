// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IRaphaBountyPool.sol";
error InsufficientStake();
error TransferFailed();
error OnlyKeeper();
error InvalidSubmission();
error AlreadyVerified();

/**
 * @title RaphaBountyPool
 * @author RAPHA Protocol
 * @notice Individual bounty campaign with Fill-or-Kill mechanism
 * @dev Deployed by RaphaBountyFactory for each campaign
 */
contract RaphaBountyPool is IRaphaBountyPool, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    uint256 public constant TREASURY_FEE_BPS = 500; // 5% for verification flow
    uint256 public constant KEEPER_FEE_BPS = 1000; // 10%
    uint256 public constant PATIENT_FEE_BPS = 8500; // 85%
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ Immutables ============
    
    IERC20 public immutable usdc;
    IERC20 public immutable raphaToken; // The staking token
    address public immutable factory;
    address public immutable treasury;
    address public immutable computeNode;
    address public immutable startup;
    string public metadataCid;
    uint256 public immutable bountyPerUser;
    uint256 public immutable maxUsers;
    uint256 public immutable deadline;
    uint256 public immutable totalBudget;

    // ============ State ============
    
    State public state;
    address[] public participants;
    mapping(address => bool) private _hasJoined;
    string public resultHash;

    // Keeper & Submission State
    mapping(address => bool) public isKeeper;
    mapping(uint256 => Submission) public submissions;
    uint256 public submissionCount;

    // ============ Constructor ============
    
    constructor(
        address _usdc,
        address _raphaToken,
        address _treasury,
        address _computeNode,
        address _startup,
        string memory _metadataCid,
        uint256 _bountyPerUser,
        uint256 _maxUsers,
        uint256 _duration
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        require(_treasury != address(0), "Invalid treasury");
        require(_startup != address(0), "Invalid startup");
        require(_bountyPerUser > 0, "Bounty must be > 0");
        require(_maxUsers > 0, "Max users must be > 0");
        require(_duration > 0, "Duration must be > 0");

        usdc = IERC20(_usdc);
        raphaToken = IERC20(_raphaToken);
        factory = msg.sender;
        treasury = _treasury;
        computeNode = _computeNode;
        startup = _startup;
        metadataCid = _metadataCid;
        bountyPerUser = _bountyPerUser;
        maxUsers = _maxUsers;
        deadline = block.timestamp + _duration;
        totalBudget = _bountyPerUser * _maxUsers;
        state = State.OPEN;
        
        // Transfer ownership to the startup/creator so they can manage keepers
        _transferOwnership(_startup);
        
        // Add startup as default keeper
        isKeeper[_startup] = true;
    }

    // ============ Modifiers ============
    
    modifier onlyComputeNode() {
        require(msg.sender == computeNode, "Only compute node");
        _;
    }

    modifier onlyKeeper() {
        if (!isKeeper[msg.sender]) revert OnlyKeeper();
        _;
    }

    modifier inState(State _state) {
        require(state == _state, "Invalid state");
        _;
    }

    // ============ External Functions ============
    
    function addKeeper(address keeper) external onlyOwner {
        isKeeper[keeper] = true;
        emit KeeperAdded(keeper);
    }

    function removeKeeper(address keeper) external onlyOwner {
        isKeeper[keeper] = false;
        emit KeeperRemoved(keeper);
    }

    /**
     * @notice Patient joins the bounty pool
     * @dev Auto-transitions to FILLED when maxUsers reached
     */
    function joinPool(uint256 _stakeAmount) external nonReentrant inState(State.OPEN) {
        require(block.timestamp < deadline, "Pool expired");
        require(participants.length < maxUsers, "Pool is full");
        require(!_hasJoined[msg.sender], "Already joined");

        // Staking Logic
        if (_stakeAmount > 0) {
            raphaToken.safeTransferFrom(msg.sender, address(this), _stakeAmount);
        }

        _hasJoined[msg.sender] = true;
        participants.push(msg.sender);

        emit ParticipantJoined(msg.sender, participants.length);
        emit UserJoined(0, msg.sender);

        // Check if pool is now full
        if (participants.length == maxUsers) {
            state = State.FILLED;
            emit PoolFilled(block.timestamp);
        }
    }

    /**
     * @notice Patient submits data for verification
     */
    function submitData(string calldata _dataCid) external nonReentrant {
        require(_hasJoined[msg.sender], "Must join pool first");
        
        uint256 newId = submissionCount++;
        submissions[newId] = Submission({
            patient: msg.sender,
            dataCid: _dataCid,
            isVerified: false,
            isPaid: false
        });

        emit DataSubmitted(newId, msg.sender, _dataCid);
    }

    /**
     * @notice Keeper verifies a submission and triggers payout
     */
    function verifySubmission(uint256 _submissionId, bool _isValid) external nonReentrant onlyKeeper {
        if (_submissionId >= submissionCount) revert InvalidSubmission();
        Submission storage sub = submissions[_submissionId];
        if (sub.isVerified) revert AlreadyVerified();

        if (_isValid) {
            sub.isVerified = true;
            sub.isPaid = true;

            // Calculate Payouts
            // NOTE: We assume bountyPerUser is the total for this submission
            uint256 patientAmount = (bountyPerUser * PATIENT_FEE_BPS) / BPS_DENOMINATOR;
            uint256 keeperAmount = (bountyPerUser * KEEPER_FEE_BPS) / BPS_DENOMINATOR;
            uint256 treasuryAmount = (bountyPerUser * TREASURY_FEE_BPS) / BPS_DENOMINATOR;

            // Transfers
            usdc.safeTransfer(sub.patient, patientAmount);
            usdc.safeTransfer(msg.sender, keeperAmount);
            usdc.safeTransfer(treasury, treasuryAmount);
        }

        emit SubmissionVerified(_submissionId, msg.sender, _isValid);
    }

    /**
     * @notice Execute the job (Legacy/Batch flow)
     * @dev Kept for compatibility, but might be redundant if per-submission verification is used
     */
    function executeJob(string calldata _resultHash) external nonReentrant onlyComputeNode inState(State.FILLED) {
        require(bytes(_resultHash).length > 0, "Invalid result hash");
        state = State.EXECUTED;
        resultHash = _resultHash;
        emit JobExecuted(_resultHash, 0, 0); // No payout here if handled per-submission
    }

    /**
     * @notice Refund startup if pool didn't fill before deadline
     * @dev Anyone can call, but only works if expired and not filled
     */
    function refundStartup() external nonReentrant inState(State.OPEN) {
        require(block.timestamp > deadline, "Pool not expired");

        state = State.EXPIRED;
        
        uint256 balance = usdc.balanceOf(address(this));
        if (balance > 0) {
            usdc.safeTransfer(startup, balance);
        }

        emit StartupRefunded(startup, balance);
    }

    // ============ View Functions ============
    
    function getPoolInfo() external view returns (
        address _startup,
        string memory _metadataCid,
        uint256 _bountyPerUser,
        uint256 _maxUsers,
        uint256 _deadline,
        uint256 _totalBudget,
        State _state,
        uint256 _participantCount
    ) {
        return (
            startup,
            metadataCid,
            bountyPerUser,
            maxUsers,
            deadline,
            totalBudget,
            state,
            participants.length
        );
    }

    function hasJoined(address user) external view returns (bool) {
        return _hasJoined[user];
    }

    function getParticipants() external view returns (address[] memory) {
        return participants;
    }

    function getState() external view returns (State) {
        return state;
    }

    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= deadline) return 0;
        return deadline - block.timestamp;
    }

    function getProgress() external view returns (uint256 current, uint256 max) {
        return (participants.length, maxUsers);
    }
    
    function getSubmission(uint256 submissionId) external view returns (Submission memory) {
        return submissions[submissionId];
    }

    function getSubmissionCount() external view returns (uint256) {
        return submissionCount;
    }
}
