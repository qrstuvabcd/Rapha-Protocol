// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./RaphaBountyPool.sol";
import "./interfaces/IRaphaBountyFactory.sol";
import "./interfaces/IRaphaBountyPool.sol";

/**
 * @title RaphaBountyFactory
 * @author RAPHA Protocol
 * @notice Factory contract for creating and tracking bounty pools
 * @dev Uses Factory pattern to deploy individual RaphaBountyPool contracts
 */
contract RaphaBountyFactory is IRaphaBountyFactory, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ State Variables ============
    
    IERC20 public immutable override usdc;
    IERC20 public immutable override raphaToken;
    address public override treasury;
    address public override computeNode;
    
    address[] private _allPools;
    mapping(address => address[]) private _startupPools;
    mapping(address => bool) public isPool;

    // ============ Constructor ============
    
    constructor(
        address _usdc,
        address _raphaToken,
        address _treasury,
        address _computeNode
    ) Ownable(msg.sender) {
        require(_usdc != address(0), "Invalid USDC");
        require(_raphaToken != address(0), "Invalid RAPHA token");
        require(_treasury != address(0), "Invalid treasury");
        
        usdc = IERC20(_usdc);
        raphaToken = IERC20(_raphaToken);
        treasury = _treasury;
        computeNode = _computeNode;
    }

    // ============ Admin Functions ============
    
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }

    function setComputeNode(address _computeNode) external onlyOwner {
        computeNode = _computeNode;
        emit ComputeNodeUpdated(_computeNode);
    }

    // ============ Pool Creation ============
    
    /**
     * @notice Create a new bounty pool campaign
     * @param metadataCid IPFS CID containing pool metadata (condition, dataType, etc.)
     * @param bountyPerUser Amount in USDC each participant receives
     * @param maxUsers Maximum number of participants
     * @param duration Duration in seconds until pool expires
     * @return poolAddress Address of the newly created pool
     */
    function createPool(
        string memory metadataCid,
        uint256 bountyPerUser,
        uint256 maxUsers,
        uint256 duration
    ) external nonReentrant returns (address poolAddress) {
        require(bytes(metadataCid).length > 0, "Invalid metadata");
        require(bountyPerUser > 0, "Bounty must be > 0");
        require(maxUsers > 0, "Max users must be > 0");
        require(duration >= 1 hours, "Duration too short");
        require(duration <= 30 days, "Duration too long");

        // Calculate total budget
        uint256 totalBudget = bountyPerUser * maxUsers;

        // Transfer USDC from startup to this factory
        usdc.safeTransferFrom(msg.sender, address(this), totalBudget);

        // Deploy new pool contract
        RaphaBountyPool pool = new RaphaBountyPool(
            address(usdc),
            address(usdc), // Stake USDC instead of RAPHA
            treasury,
            computeNode,
            msg.sender,
            metadataCid,
            bountyPerUser,
            maxUsers,
            duration
        );

        poolAddress = address(pool);

        // Transfer USDC to the new pool
        usdc.safeTransfer(poolAddress, totalBudget);

        // Track the pool
        _allPools.push(poolAddress);
        _startupPools[msg.sender].push(poolAddress);
        isPool[poolAddress] = true;

        emit PoolCreated(
            poolAddress,
            msg.sender,
            metadataCid,
            bountyPerUser,
            maxUsers,
            totalBudget,
            block.timestamp + duration
        );
    }

    // ============ View Functions ============
    
    function getAllPools() external view returns (address[] memory) {
        return _allPools;
    }

    function getActivePools() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // First count active pools
        for (uint256 i = 0; i < _allPools.length; i++) {
            IRaphaBountyPool pool = IRaphaBountyPool(_allPools[i]);
            if (pool.getState() == IRaphaBountyPool.State.OPEN) {
                activeCount++;
            }
        }

        // Create array and populate
        address[] memory activePools = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < _allPools.length; i++) {
            IRaphaBountyPool pool = IRaphaBountyPool(_allPools[i]);
            if (pool.getState() == IRaphaBountyPool.State.OPEN) {
                activePools[index] = _allPools[i];
                index++;
            }
        }

        return activePools;
    }

    function getPoolsByStartup(address startup) external view returns (address[] memory) {
        return _startupPools[startup];
    }

    function getPoolCount() external view returns (uint256) {
        return _allPools.length;
    }

    function getActivePoolCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < _allPools.length; i++) {
            IRaphaBountyPool pool = IRaphaBountyPool(_allPools[i]);
            if (pool.getState() == IRaphaBountyPool.State.OPEN) {
                count++;
            }
        }
        return count;
    }
}
