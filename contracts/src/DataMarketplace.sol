// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DataMarketplace
 * @author Rapha Protocol
 * @notice Conditional-escrow marketplace for AI training data pools.
 *
 * @dev STATE MACHINE:
 *
 *   ┌──────────┐   deadline passes   ┌──────────────┐
 *   │  ACTIVE  │ ──────────────────→  │  evaluating  │
 *   └──────────┘                      └──────┬───────┘
 *        │                                   │
 *        │  target met                       │ target NOT met
 *        ▼                                   ▼
 *   ┌──────────┐                      ┌──────────────┐
 *   │ SUCCESS  │                      │   FAILED     │
 *   └──────────┘                      └──────────────┘
 *     • Patient stakes locked           • AI Company refunded
 *       until data verified               (deposit - keeperFeesPaid)
 *     • Keeper fees paid                • Patient stakes returned
 *     • 85/10/5 split begins             penalty-free
 *
 *   Flow:
 *     1. AI Company calls createPool() with USDC deposit, deadline, minTarget
 *     2. Patients call contributeData() to add verified records
 *     3. Keepers verify data via verifyContribution() → earn fees per record
 *     4. After deadline:
 *        - If currentDataCount >= minTarget → SUCCESS (finalizePool)
 *        - If currentDataCount <  minTarget → FAILED
 *          → AI Company calls claimRefund() (deposit - keeper fees paid)
 *          → Patients call exitPool() to withdraw stake penalty-free
 */
contract DataMarketplace is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Enums ============

    enum PoolStatus {
        Active,       // Open for data contributions
        Success,      // Met target, funds being distributed
        Failed,       // Missed target, refunds available
        Finalized     // All funds distributed / refunded
    }

    // ============ Structs ============

    struct Pool {
        // --- Creator ---
        address creator;            // AI Company that funded the pool
        uint256 deposit;            // Total USDC deposited by creator
        // --- Parameters ---
        string dataQuery;           // Description of required data
        uint256 deadline;           // Timestamp: pool closes
        uint256 minTarget;          // Minimum records needed for success
        // --- Tracking ---
        uint256 currentDataCount;   // Records contributed so far
        uint256 verifiedDataCount;  // Records verified by Keepers
        uint256 keeperFeesPaid;     // Total USDC paid to Keepers
        // --- State ---
        PoolStatus status;
        bool isFinalized;           // True after all funds settled
        // --- Fee Config ---
        uint256 keeperFeePerRecord; // USDC paid per verified record
    }

    struct Contribution {
        address patient;
        bytes32 recordId;           // Links to MedicalRecordRegistry
        bool isVerified;            // Set by Keeper
        bool isRewarded;            // Set when patient payment distributed
        address verifiedBy;         // Keeper address
    }

    // ============ Constants ============

    /// @notice Patient reward share (85%)
    uint256 public constant PATIENT_SHARE = 85;
    /// @notice Keeper reward share (10%)
    uint256 public constant KEEPER_SHARE = 10;
    /// @notice Treasury share (5%)
    uint256 public constant TREASURY_SHARE = 5;

    // ============ State ============

    /// @notice Payment token (USDC)
    IERC20 public immutable usdc;

    /// @notice RAPHA token for patient staking
    IERC20 public immutable raphaToken;

    /// @notice Treasury wallet
    address public treasury;

    /// @notice Deployer (admin)
    address public immutable deployer;

    /// @notice Authorized Keepers
    mapping(address => bool) public authorizedKeepers;

    /// @notice Pool ID → Pool
    mapping(uint256 => Pool) public pools;

    /// @notice Pool ID → contribution index → Contribution
    mapping(uint256 => mapping(uint256 => Contribution)) public contributions;

    /// @notice Pool ID → number of contributions
    mapping(uint256 => uint256) public contributionCount;

    /// @notice Pool ID → patient address → whether they contributed
    mapping(uint256 => mapping(address => bool)) public hasContributed;

    /// @notice Pool ID → patient address → patient's staked RAPHA amount
    mapping(uint256 => mapping(address => uint256)) public patientPoolStakes;

    /// @notice Pool ID → patient address → whether stake was withdrawn
    mapping(uint256 => mapping(address => bool)) public stakeWithdrawn;

    /// @notice Pool ID → whether creator has claimed refund
    mapping(uint256 => bool) public refundClaimed;

    /// @notice Total pools created
    uint256 public poolCount;

    /// @notice Minimum patient stake (50 RAPHA)
    uint256 public constant MIN_PATIENT_STAKE = 50 * 10 ** 18;

    // ============ Events ============

    event PoolCreated(
        uint256 indexed poolId,
        address indexed creator,
        uint256 deposit,
        uint256 deadline,
        uint256 minTarget,
        string dataQuery
    );

    event DataContributed(
        uint256 indexed poolId,
        address indexed patient,
        bytes32 recordId,
        uint256 contributionIndex
    );

    event ContributionVerified(
        uint256 indexed poolId,
        uint256 indexed contributionIndex,
        address indexed keeper,
        uint256 keeperFee
    );

    event PoolFinalized(
        uint256 indexed poolId,
        PoolStatus status,
        uint256 verifiedCount,
        uint256 minTarget
    );

    event RefundClaimed(
        uint256 indexed poolId,
        address indexed creator,
        uint256 refundAmount
    );

    event PatientExited(
        uint256 indexed poolId,
        address indexed patient,
        uint256 stakeReturned
    );

    event PatientRewarded(
        uint256 indexed poolId,
        address indexed patient,
        uint256 rewardAmount
    );

    // ============ Modifiers ============

    modifier onlyDeployer() {
        require(msg.sender == deployer, "Not deployer");
        _;
    }

    modifier onlyKeeper() {
        require(authorizedKeepers[msg.sender], "Not authorized keeper");
        _;
    }

    modifier poolExists(uint256 poolId) {
        require(poolId > 0 && poolId <= poolCount, "Pool does not exist");
        _;
    }

    // ============ Constructor ============

    /**
     * @param _usdc USDC token address
     * @param _raphaToken RAPHA token address (for patient staking)
     * @param _treasury Treasury wallet for the 5% split
     */
    constructor(address _usdc, address _raphaToken, address _treasury) {
        require(_usdc != address(0), "Invalid USDC");
        require(_raphaToken != address(0), "Invalid RAPHA token");
        require(_treasury != address(0), "Invalid treasury");

        usdc = IERC20(_usdc);
        raphaToken = IERC20(_raphaToken);
        treasury = _treasury;
        deployer = msg.sender;
    }

    // ============================================================
    // POOL LIFECYCLE
    // ============================================================

    /**
     * @notice AI Company creates a data pool with escrowed funds.
     * @param deposit USDC amount to escrow
     * @param dataQuery Description of the data needed (e.g., "1000 diabetic blood panels")
     * @param deadline Timestamp when the pool closes
     * @param minTarget Minimum verified records for the pool to succeed
     * @param keeperFeePerRecord USDC paid to Keeper per verified record
     * @return poolId The new pool's ID
     */
    function createPool(
        uint256 deposit,
        string calldata dataQuery,
        uint256 deadline,
        uint256 minTarget,
        uint256 keeperFeePerRecord
    ) external nonReentrant returns (uint256 poolId) {
        require(deposit > 0, "Deposit required");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(minTarget > 0, "Min target must be > 0");
        require(bytes(dataQuery).length > 0, "Data query required");

        // Transfer USDC from creator to contract (escrow)
        usdc.safeTransferFrom(msg.sender, address(this), deposit);

        poolId = ++poolCount;

        pools[poolId] = Pool({
            creator: msg.sender,
            deposit: deposit,
            dataQuery: dataQuery,
            deadline: deadline,
            minTarget: minTarget,
            currentDataCount: 0,
            verifiedDataCount: 0,
            keeperFeesPaid: 0,
            status: PoolStatus.Active,
            isFinalized: false,
            keeperFeePerRecord: keeperFeePerRecord
        });

        emit PoolCreated(poolId, msg.sender, deposit, deadline, minTarget, dataQuery);
    }

    // ============================================================
    // PATIENT ACTIONS
    // ============================================================

    /**
     * @notice Patient contributes a verified record to a pool.
     * @dev Patient must stake MIN_PATIENT_STAKE RAPHA tokens.
     *      Requires prior raphaToken.approve(address(this), MIN_PATIENT_STAKE).
     * @param poolId Target pool
     * @param recordId Record ID from MedicalRecordRegistry
     */
    function contributeData(
        uint256 poolId,
        bytes32 recordId
    ) external nonReentrant poolExists(poolId) {
        Pool storage pool = pools[poolId];

        require(pool.status == PoolStatus.Active, "Pool not active");
        require(block.timestamp < pool.deadline, "Pool deadline passed");
        require(!hasContributed[poolId][msg.sender], "Already contributed to this pool");

        // Stake RAPHA (Data Integrity Bond)
        if (patientPoolStakes[poolId][msg.sender] < MIN_PATIENT_STAKE) {
            uint256 needed = MIN_PATIENT_STAKE - patientPoolStakes[poolId][msg.sender];
            raphaToken.safeTransferFrom(msg.sender, address(this), needed);
            patientPoolStakes[poolId][msg.sender] = MIN_PATIENT_STAKE;
        }

        // Record the contribution
        uint256 idx = contributionCount[poolId];
        contributions[poolId][idx] = Contribution({
            patient: msg.sender,
            recordId: recordId,
            isVerified: false,
            isRewarded: false,
            verifiedBy: address(0)
        });

        contributionCount[poolId] = idx + 1;
        pool.currentDataCount++;
        hasContributed[poolId][msg.sender] = true;

        emit DataContributed(poolId, msg.sender, recordId, idx);
    }

    /**
     * @notice Patient exits a FAILED pool and withdraws their stake penalty-free.
     * @param poolId The failed pool
     */
    function exitPool(uint256 poolId) external nonReentrant poolExists(poolId) {
        Pool storage pool = pools[poolId];

        // Pool must be past deadline AND failed
        require(block.timestamp > pool.deadline, "Pool not yet expired");
        require(
            pool.status == PoolStatus.Failed || pool.verifiedDataCount < pool.minTarget,
            "Pool did not fail"
        );
        require(!stakeWithdrawn[poolId][msg.sender], "Stake already withdrawn");
        require(patientPoolStakes[poolId][msg.sender] > 0, "No stake in this pool");

        // Auto-finalize if not done
        if (pool.status == PoolStatus.Active) {
            _evaluatePool(poolId);
        }

        uint256 stake = patientPoolStakes[poolId][msg.sender];
        stakeWithdrawn[poolId][msg.sender] = true;

        raphaToken.safeTransfer(msg.sender, stake);

        emit PatientExited(poolId, msg.sender, stake);
    }

    // ============================================================
    // KEEPER ACTIONS
    // ============================================================

    /**
     * @notice Keeper verifies a patient's contribution.
     * @dev Keeper earns keeperFeePerRecord from the pool deposit.
     * @param poolId Pool ID
     * @param contributionIndex Index of the contribution to verify
     */
    function verifyContribution(
        uint256 poolId,
        uint256 contributionIndex
    ) external nonReentrant poolExists(poolId) onlyKeeper {
        Pool storage pool = pools[poolId];
        require(
            pool.status == PoolStatus.Active || pool.status == PoolStatus.Success,
            "Pool not in verifiable state"
        );

        Contribution storage contrib = contributions[poolId][contributionIndex];
        require(contrib.patient != address(0), "Contribution does not exist");
        require(!contrib.isVerified, "Already verified");

        // Mark verified
        contrib.isVerified = true;
        contrib.verifiedBy = msg.sender;
        pool.verifiedDataCount++;

        // Pay Keeper fee from escrow
        uint256 fee = pool.keeperFeePerRecord;
        if (fee > 0 && pool.deposit > pool.keeperFeesPaid + fee) {
            pool.keeperFeesPaid += fee;
            usdc.safeTransfer(msg.sender, fee);
        }

        emit ContributionVerified(poolId, contributionIndex, msg.sender, fee);
    }

    // ============================================================
    // AI COMPANY ACTIONS
    // ============================================================

    /**
     * @notice AI Company claims refund from a failed pool.
     * @dev Refund = deposit - keeperFeesPaid (Keepers always get paid for work done).
     * @param poolId The failed pool
     */
    function claimRefund(uint256 poolId) external nonReentrant poolExists(poolId) {
        Pool storage pool = pools[poolId];

        require(pool.creator == msg.sender, "Not pool creator");
        require(block.timestamp > pool.deadline, "Pool not yet expired");
        require(!refundClaimed[poolId], "Refund already claimed");

        // Auto-evaluate if still Active
        if (pool.status == PoolStatus.Active) {
            _evaluatePool(poolId);
        }

        require(pool.status == PoolStatus.Failed, "Pool did not fail");

        refundClaimed[poolId] = true;

        // Refund = deposit minus keeper fees already paid
        // Keepers are ALWAYS compensated for work done
        uint256 refundAmount = pool.deposit - pool.keeperFeesPaid;

        if (refundAmount > 0) {
            usdc.safeTransfer(msg.sender, refundAmount);
        }

        pool.isFinalized = true;

        emit RefundClaimed(poolId, msg.sender, refundAmount);
    }

    // ============================================================
    // FINALIZATION (SUCCESS PATH)
    // ============================================================

    /**
     * @notice Finalize a successful pool — distribute the 85/10/5 split.
     * @dev Can be called by anyone after deadline if target was met.
     *      Keepers have already been paid per-record. The remaining deposit
     *      is split: 85% patients, 5% treasury. The 10% keeper allocation
     *      is already covered by per-record fees.
     * @param poolId The successful pool
     */
    function finalizePool(uint256 poolId) external nonReentrant poolExists(poolId) {
        Pool storage pool = pools[poolId];

        require(block.timestamp > pool.deadline, "Pool not yet expired");
        require(!pool.isFinalized, "Already finalized");

        // Auto-evaluate
        if (pool.status == PoolStatus.Active) {
            _evaluatePool(poolId);
        }

        require(pool.status == PoolStatus.Success, "Pool must have succeeded");

        pool.isFinalized = true;

        // Remaining deposit after keeper fees
        uint256 remaining = pool.deposit - pool.keeperFeesPaid;

        // 5% Treasury
        uint256 treasuryAmount = (remaining * TREASURY_SHARE) / 100;
        if (treasuryAmount > 0) {
            usdc.safeTransfer(treasury, treasuryAmount);
        }

        // 85% Patient Pool (distributed equally among verified contributors)
        uint256 patientTotal = remaining - treasuryAmount;
        // NOTE: The remaining 10% "keeper share" from the gross is already
        // distributed via per-record keeperFeesPaid. The patient share here
        // is from the net remaining after keeper fees.

        // Distribute to each verified contributor
        uint256 contributions_ = contributionCount[poolId];
        uint256 verifiedCount = pool.verifiedDataCount;

        if (verifiedCount > 0 && patientTotal > 0) {
            uint256 perPatient = patientTotal / verifiedCount;

            for (uint256 i = 0; i < contributions_; i++) {
                Contribution storage c = contributions[poolId][i];
                if (c.isVerified && !c.isRewarded) {
                    c.isRewarded = true;
                    usdc.safeTransfer(c.patient, perPatient);
                    emit PatientRewarded(poolId, c.patient, perPatient);
                }
            }
        }

        emit PoolFinalized(poolId, PoolStatus.Success, verifiedCount, pool.minTarget);
    }

    // ============================================================
    // INTERNAL
    // ============================================================

    /**
     * @dev Evaluate a pool after its deadline to determine Success or Failed.
     */
    function _evaluatePool(uint256 poolId) internal {
        Pool storage pool = pools[poolId];

        require(block.timestamp > pool.deadline, "Deadline not reached");
        require(pool.status == PoolStatus.Active, "Already evaluated");

        if (pool.verifiedDataCount >= pool.minTarget) {
            pool.status = PoolStatus.Success;
        } else {
            pool.status = PoolStatus.Failed;
        }

        emit PoolFinalized(poolId, pool.status, pool.verifiedDataCount, pool.minTarget);
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    /**
     * @notice Get full pool details.
     */
    function getPool(uint256 poolId) external view returns (Pool memory) {
        return pools[poolId];
    }

    /**
     * @notice Get a contribution.
     */
    function getContribution(
        uint256 poolId,
        uint256 index
    ) external view returns (Contribution memory) {
        return contributions[poolId][index];
    }

    /**
     * @notice Check if a pool has expired and its outcome.
     * @return expired Whether the deadline has passed
     * @return succeeded Whether verified data >= minTarget
     * @return status Current pool status
     */
    function getPoolOutcome(uint256 poolId) external view poolExists(poolId) returns (
        bool expired,
        bool succeeded,
        PoolStatus status
    ) {
        Pool storage pool = pools[poolId];
        expired = block.timestamp > pool.deadline;
        succeeded = pool.verifiedDataCount >= pool.minTarget;
        status = pool.status;
    }

    /**
     * @notice Calculate the refund amount for a failed pool.
     * @return refundAmount deposit - keeperFeesPaid
     */
    function getRefundAmount(uint256 poolId) external view poolExists(poolId) returns (uint256) {
        Pool storage pool = pools[poolId];
        return pool.deposit - pool.keeperFeesPaid;
    }

    // ============================================================
    // ADMIN
    // ============================================================

    function addKeeper(address keeper) external onlyDeployer {
        authorizedKeepers[keeper] = true;
    }

    function removeKeeper(address keeper) external onlyDeployer {
        authorizedKeepers[keeper] = false;
    }

    function setTreasury(address _treasury) external onlyDeployer {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }
}
