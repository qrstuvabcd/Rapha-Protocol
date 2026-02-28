// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IRaphaMarket.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RaphaMarket
 * @author Rapha Protocol - DeSci Compute-to-Data Marketplace
 * @notice Enables pharmaceutical companies to train AI on encrypted patient data
 *         without accessing raw data. Implements 80/20 revenue split.
 * 
 * @dev Flow:
 *   1. Pharma calls submitJob() with USDC bounty → funds escrowed
 *   2. Compute Node picks up job, runs Docker against decrypted data in TEE
 *   3. Node calls finalizeJob() → 20% to platform, 80% to patients
 *   4. Buyer receives IPFS hash of compute results
 */
contract RaphaMarket is IRaphaMarket, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============
    
    /// @notice Platform fee percentage (20%)
    uint256 public constant PLATFORM_FEE_PERCENT = 20;
    
    /// @notice Patient reward percentage (80%)
    uint256 public constant PATIENT_REWARD_PERCENT = 80;
    
    /// @notice Minimum bounty amount (100 USDC with 6 decimals)
    uint256 public constant MIN_BOUNTY = 100 * 1e6;

    // ============ State Variables ============
    
    /// @notice USDC token contract
    IERC20 public immutable usdc;
    
    /// @notice Treasury wallet for platform fees
    address public treasury;
    
    /// @notice Patient staking pool for reward distribution
    address public patientPool;
    
    /// @notice Authorized compute nodes
    mapping(address => bool) public authorizedNodes;
    
    /// @notice All compute jobs
    mapping(uint256 => ComputeJob) public jobs;
    
    /// @notice Buyer address to their job IDs
    mapping(address => uint256[]) public buyerJobs;
    
    /// @notice Total job count (used for job ID generation)
    uint256 public jobCount;

    // ============ Modifiers ============
    
    modifier onlyAuthorizedNode() {
        require(authorizedNodes[msg.sender], "Not authorized compute node");
        _;
    }

    modifier jobExists(uint256 jobId) {
        require(jobs[jobId].createdAt != 0, "Job does not exist");
        _;
    }

    // ============ Constructor ============
    
    /**
     * @notice Deploy the RaphaMarket contract
     * @param _usdc USDC token address
     * @param _treasury Platform treasury wallet
     * @param _patientPool Patient staking pool address
     */
    constructor(
        address _usdc,
        address _treasury,
        address _patientPool
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_treasury != address(0), "Invalid treasury address");
        require(_patientPool != address(0), "Invalid patient pool address");
        
        usdc = IERC20(_usdc);
        treasury = _treasury;
        patientPool = _patientPool;
    }

    // ============ External Functions ============
    
    /**
     * @inheritdoc IRaphaMarket
     */
    function submitJob(
        uint256 bountyAmount,
        string calldata dataQuery,
        string calldata algoDockerHash
    ) external nonReentrant returns (uint256 jobId) {
        // Validate inputs
        require(bountyAmount >= MIN_BOUNTY, "Bounty below minimum");
        require(bytes(dataQuery).length > 0, "Data query required");
        require(bytes(algoDockerHash).length > 0, "Algorithm hash required");
        
        // Transfer USDC from buyer to contract (escrow)
        usdc.safeTransferFrom(msg.sender, address(this), bountyAmount);
        
        // Generate job ID
        jobId = ++jobCount;
        
        // Create job record
        jobs[jobId] = ComputeJob({
            jobId: jobId,
            buyer: msg.sender,
            bountyAmount: bountyAmount,
            dataQuery: dataQuery,
            algoDockerHash: algoDockerHash,
            resultsCID: "",
            status: JobStatus.Pending,
            createdAt: block.timestamp,
            completedAt: 0,
            patientCount: 0
        });
        
        // Track buyer's jobs
        buyerJobs[msg.sender].push(jobId);
        
        emit JobSubmitted(jobId, msg.sender, bountyAmount, dataQuery);
        
        return jobId;
    }

    /**
     * @inheritdoc IRaphaMarket
     * @dev The 80/20 Split (The "DeSci Tax"):
     *      - 20% of bounty → RaphaCompanyWallet (treasury)
     *      - 80% of bounty → PatientStakingPool (pro-rated to matching patients)
     */
    function finalizeJob(
        uint256 jobId,
        address[] calldata patients,
        string calldata resultsCID
    ) external nonReentrant onlyAuthorizedNode jobExists(jobId) {
        ComputeJob storage job = jobs[jobId];
        
        // Validate job state
        require(
            job.status == JobStatus.Pending || job.status == JobStatus.Computing,
            "Job not in valid state"
        );
        require(patients.length > 0, "No patients provided");
        require(bytes(resultsCID).length > 0, "Results CID required");
        
        // Calculate the split
        uint256 platformFee = (job.bountyAmount * PLATFORM_FEE_PERCENT) / 100;
        uint256 patientReward = job.bountyAmount - platformFee; // 80%
        
        // Update job state
        job.status = JobStatus.Completed;
        job.resultsCID = resultsCID;
        job.completedAt = block.timestamp;
        job.patientCount = patients.length;
        
        // Execute the DeSci Tax split
        // 20% → Platform Treasury
        usdc.safeTransfer(treasury, platformFee);
        
        // 80% → Patient Staking Pool
        // The pool contract will handle pro-rata distribution to individual patients
        usdc.safeTransfer(patientPool, patientReward);
        
        emit JobFinalized(
            jobId,
            resultsCID,
            platformFee,
            patientReward,
            patients.length
        );
    }

    /**
     * @inheritdoc IRaphaMarket
     */
    function cancelJob(uint256 jobId) external nonReentrant jobExists(jobId) {
        ComputeJob storage job = jobs[jobId];
        
        require(job.buyer == msg.sender, "Not job buyer");
        require(job.status == JobStatus.Pending, "Job already processing");
        
        // Update status
        job.status = JobStatus.Cancelled;
        
        // Refund full bounty to buyer
        usdc.safeTransfer(msg.sender, job.bountyAmount);
        
        emit JobCancelled(jobId, msg.sender, job.bountyAmount);
    }

    // ============ View Functions ============
    
    /**
     * @inheritdoc IRaphaMarket
     */
    function getJob(uint256 jobId) external view returns (ComputeJob memory) {
        return jobs[jobId];
    }

    /**
     * @inheritdoc IRaphaMarket
     */
    function getBuyerJobs(address buyer) external view returns (uint256[] memory) {
        return buyerJobs[buyer];
    }

    /**
     * @inheritdoc IRaphaMarket
     */
    function getJobCount() external view returns (uint256) {
        return jobCount;
    }

    /**
     * @inheritdoc IRaphaMarket
     */
    function getPlatformFeePercent() external pure returns (uint256) {
        return PLATFORM_FEE_PERCENT;
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Authorize a compute node to finalize jobs
     * @param node Address of the compute node
     * @param authorized Whether to authorize or revoke
     */
    function setAuthorizedNode(address node, bool authorized) external onlyOwner {
        require(node != address(0), "Invalid node address");
        authorizedNodes[node] = authorized;
    }

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury wallet address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasury = newTreasury;
    }

    /**
     * @notice Update patient pool address
     * @param newPatientPool New patient staking pool address
     */
    function setPatientPool(address newPatientPool) external onlyOwner {
        require(newPatientPool != address(0), "Invalid patient pool address");
        patientPool = newPatientPool;
    }

    /**
     * @notice Mark a job as computing (node picked it up)
     * @param jobId The job ID
     */
    function startJob(uint256 jobId) external onlyAuthorizedNode jobExists(jobId) {
        ComputeJob storage job = jobs[jobId];
        require(job.status == JobStatus.Pending, "Job not pending");
        
        job.status = JobStatus.Computing;
        
        emit JobStarted(jobId, msg.sender);
    }

    /**
     * @notice Mark a job as failed
     * @param jobId The job ID
     */
    function failJob(uint256 jobId) external onlyAuthorizedNode jobExists(jobId) {
        ComputeJob storage job = jobs[jobId];
        require(
            job.status == JobStatus.Pending || job.status == JobStatus.Computing,
            "Job not in valid state"
        );
        
        job.status = JobStatus.Failed;
        
        // Refund buyer on failure
        usdc.safeTransfer(job.buyer, job.bountyAmount);
    }
}
