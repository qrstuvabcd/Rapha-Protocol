// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IRaphaMarket
 * @notice Interface for the Rapha DeSci Compute-to-Data Marketplace
 * @dev Enables pharmaceutical companies to submit AI compute jobs
 *      against encrypted patient data with USDC bounties
 */
interface IRaphaMarket {
    // ============ Enums ============
    
    enum JobStatus {
        Pending,      // Job submitted, awaiting node pickup
        Computing,    // Node is processing
        Completed,    // Results delivered
        Cancelled,    // Buyer cancelled before compute
        Failed        // Compute failed
    }

    // ============ Structs ============
    
    struct ComputeJob {
        uint256 jobId;           // Unique identifier
        address buyer;           // Pharma company wallet
        uint256 bountyAmount;    // Total USDC bounty
        string dataQuery;        // Query criteria (JSON: condition, dataType, minSample)
        string algoDockerHash;   // Docker image IPFS hash
        string resultsCID;       // IPFS hash of compute results (filled on completion)
        JobStatus status;        // Current job status
        uint256 createdAt;       // Timestamp of submission
        uint256 completedAt;     // Timestamp of completion
        uint256 patientCount;    // Number of patients whose data matched
    }

    // ============ Events ============
    
    event JobSubmitted(
        uint256 indexed jobId,
        address indexed buyer,
        uint256 bountyAmount,
        string dataQuery
    );

    event JobStarted(
        uint256 indexed jobId,
        address indexed computeNode
    );

    event JobFinalized(
        uint256 indexed jobId,
        string resultsCID,
        uint256 platformFee,
        uint256 patientReward,
        uint256 patientCount
    );

    event JobCancelled(
        uint256 indexed jobId,
        address indexed buyer,
        uint256 refundAmount
    );

    // ============ External Functions ============
    
    /**
     * @notice Submit a new compute job with USDC bounty
     * @param bountyAmount Total USDC to escrow
     * @param dataQuery JSON query criteria for patient data matching
     * @param algoDockerHash IPFS hash of the algorithm Docker image
     * @return jobId The unique identifier for this job
     */
    function submitJob(
        uint256 bountyAmount,
        string calldata dataQuery,
        string calldata algoDockerHash
    ) external returns (uint256 jobId);

    /**
     * @notice Finalize a compute job and distribute rewards
     * @dev Called by authorized compute node after successful computation
     * @param jobId The job to finalize
     * @param patients Array of patient addresses who contributed data
     * @param resultsCID IPFS hash of the computation results
     */
    function finalizeJob(
        uint256 jobId,
        address[] calldata patients,
        string calldata resultsCID
    ) external;

    /**
     * @notice Cancel a pending job and refund buyer
     * @param jobId The job to cancel
     */
    function cancelJob(uint256 jobId) external;

    // ============ View Functions ============
    
    function getJob(uint256 jobId) external view returns (ComputeJob memory);
    function getBuyerJobs(address buyer) external view returns (uint256[] memory);
    function getJobCount() external view returns (uint256);
    function getPlatformFeePercent() external view returns (uint256);
}
