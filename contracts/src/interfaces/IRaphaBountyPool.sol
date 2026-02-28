// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRaphaBountyPool
 * @notice Interface for individual bounty pool campaigns
 */
interface IRaphaBountyPool {
    // ============ Enums ============
    
    enum State { OPEN, FILLED, EXECUTED, EXPIRED }

    // ============ Structs ============

    struct Submission {
        address patient;
        string dataCid;
        bool isVerified;
        bool isPaid;
    }

    // ============ Events ============
    
    event ParticipantJoined(address indexed participant, uint256 participantCount);
    event UserJoined(uint256 poolId, address indexed user);
    event PoolFilled(uint256 timestamp);
    event JobExecuted(string resultHash, uint256 treasuryAmount, uint256 participantPayout);
    event StartupRefunded(address indexed startup, uint256 amount);
    event DataSubmitted(uint256 indexed submissionId, address indexed patient, string dataCid);
    event SubmissionVerified(uint256 indexed submissionId, address indexed keeper, bool isValid);
    event KeeperAdded(address indexed keeper);
    event KeeperRemoved(address indexed keeper);
    
    // ============ View Functions ============
    
    function getPoolInfo() external view returns (
        address startup,
        string memory metadataCid,
        uint256 bountyPerUser,
        uint256 maxUsers,
        uint256 deadline,
        uint256 totalBudget,
        State state,
        uint256 participantCount
    );
    
    function hasJoined(address user) external view returns (bool);
    function getParticipants() external view returns (address[] memory);
    function getState() external view returns (State);
    function getSubmission(uint256 submissionId) external view returns (Submission memory);
    function getSubmissionCount() external view returns (uint256);
    
    // ============ Actions ============
    
    function joinPool(uint256 stakeAmount) external;
    function submitData(string calldata dataCid) external;
    function verifySubmission(uint256 submissionId, bool isValid) external;
    function addKeeper(address keeper) external;
    function removeKeeper(address keeper) external;
    function executeJob(string calldata resultHash) external;
    function refundStartup() external;
}
