// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IRaphaBountyFactory
 * @notice Interface for the bounty pool factory contract
 */
interface IRaphaBountyFactory {
    // ============ Events ============
    
    event PoolCreated(
        address indexed poolAddress,
        address indexed startup,
        string metadataCid,
        uint256 bountyPerUser,
        uint256 maxUsers,
        uint256 totalBudget,
        uint256 deadline
    );
    
    event TreasuryUpdated(address indexed newTreasury);
    event ComputeNodeUpdated(address indexed newComputeNode);
    
    // ============ View Functions ============
    
    function getAllPools() external view returns (address[] memory);
    function getActivePools() external view returns (address[] memory);
    function getPoolsByStartup(address startup) external view returns (address[] memory);
    function treasury() external view returns (address);
    function computeNode() external view returns (address);
    function usdc() external view returns (IERC20);
    function raphaToken() external view returns (IERC20);
    
    // ============ Actions ============
    
    function createPool(
        string memory metadataCid,
        uint256 bountyPerUser,
        uint256 maxUsers,
        uint256 duration
    ) external returns (address poolAddress);
}
