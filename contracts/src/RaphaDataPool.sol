// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title RaphaDataPool
 * @author Rapha Protocol
 * @notice Patient staking contract for the Global Data Pool.
 *
 * @dev Patients must stake a minimum amount of RAPHA tokens to become
 *      "Active Earners" and qualify for the 85% Data Usage Fee split.
 *      This Data Integrity Bond prevents spam, aligns incentives, and
 *      ensures only committed participants earn passive income from
 *      AI training data usage.
 *
 *      Flow:
 *        1. Patient calls raphaToken.approve(dataPool, amount)
 *        2. Patient calls joinDataPool()
 *        3. Contract transfers tokens from patient to itself
 *        4. Patient is now eligible for Data Usage Fees
 */
contract RaphaDataPool {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Minimum stake required to join the data pool (50 RAPHA)
    uint256 public constant MIN_PATIENT_STAKE = 50 * 10 ** 18;

    // ============ State ============

    /// @notice The RAPHA ERC-20 token used for staking
    IERC20 public immutable raphaToken;

    /// @notice Deployer address (admin)
    address public immutable deployer;

    /// @notice Patient address → staked RAPHA amount
    mapping(address => uint256) public patientStakes;

    /// @notice Total RAPHA staked across all patients
    uint256 public totalStaked;

    /// @notice Number of active pool members
    uint256 public memberCount;

    // ============ Events ============

    event PoolJoined(address indexed patient, uint256 amount);
    event PoolLeft(address indexed patient, uint256 amount);
    event StakeIncreased(address indexed patient, uint256 additionalAmount, uint256 newTotal);

    // ============ Constructor ============

    /**
     * @param _raphaToken Address of the deployed RaphaToken (ERC-20)
     */
    constructor(address _raphaToken) {
        require(_raphaToken != address(0), "Invalid token address");
        raphaToken = IERC20(_raphaToken);
        deployer = msg.sender;
    }

    // ============ External Functions ============

    /**
     * @notice Stake RAPHA tokens to join the Global Data Pool.
     * @dev Requires prior ERC-20 approval:
     *      raphaToken.approve(address(this), MIN_PATIENT_STAKE)
     *
     *      If the patient has already staked, this adds to their
     *      existing stake (top-up).
     */
    function joinDataPool() external {
        uint256 currentStake = patientStakes[msg.sender];

        if (currentStake >= MIN_PATIENT_STAKE) {
            revert("Already a pool member");
        }

        uint256 needed = MIN_PATIENT_STAKE - currentStake;

        // Transfer RAPHA from patient to this contract
        raphaToken.safeTransferFrom(msg.sender, address(this), needed);

        if (currentStake == 0) {
            memberCount++;
        }

        patientStakes[msg.sender] = MIN_PATIENT_STAKE;
        totalStaked += needed;

        emit PoolJoined(msg.sender, MIN_PATIENT_STAKE);
    }

    /**
     * @notice Leave the data pool and withdraw staked RAPHA.
     * @dev Returns the full staked amount to the patient.
     *      Patient will no longer be eligible for Data Usage Fees.
     */
    function leaveDataPool() external {
        uint256 staked = patientStakes[msg.sender];
        require(staked > 0, "No stake to withdraw");

        patientStakes[msg.sender] = 0;
        totalStaked -= staked;
        memberCount--;

        raphaToken.safeTransfer(msg.sender, staked);

        emit PoolLeft(msg.sender, staked);
    }

    // ============ View Functions ============

    /**
     * @notice Check if an address is an active pool member.
     * @param patient Patient address to check
     * @return True if the patient has staked >= MIN_PATIENT_STAKE
     */
    function isPoolMember(address patient) external view returns (bool) {
        return patientStakes[patient] >= MIN_PATIENT_STAKE;
    }

    /**
     * @notice Get the staked amount for a patient.
     * @param patient Patient address
     * @return Amount of RAPHA staked
     */
    function getStake(address patient) external view returns (uint256) {
        return patientStakes[patient];
    }

    /**
     * @notice Get pool statistics.
     * @return _totalStaked Total RAPHA locked in the pool
     * @return _memberCount Number of active pool members
     * @return _minStake Minimum required stake
     */
    function getPoolStats() external view returns (
        uint256 _totalStaked,
        uint256 _memberCount,
        uint256 _minStake
    ) {
        return (totalStaked, memberCount, MIN_PATIENT_STAKE);
    }
}
