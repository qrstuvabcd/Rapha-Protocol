// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/RaphaBountyFactory.sol";
import "../src/RaphaToken.sol";
import "../src/MockUSDC.sol";

/**
 * @title Deploy Bounty Script
 * @notice Deploys Rapha Token, MockUSDC, and RaphaBountyFactory
 */
contract DeployBountyScript is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        vm.startBroadcast(deployerPrivateKey);

        console.log("Deploying from:", deployer);

        // 1. Deploy Tokens (for Mainnet, we might use existing, but for now deploy fresh)
        RaphaToken raphaToken = new RaphaToken();
        console.log("RaphaToken:", address(raphaToken));

        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC:", address(usdc));

        // 2. Deploy Factory
        // Using deployer as treasury and compute node for now
        address treasury = deployer;
        address computeNode = deployer;

        RaphaBountyFactory factory = new RaphaBountyFactory(
            address(usdc),
            address(raphaToken),
            treasury,
            computeNode
        );
        console.log("RaphaBountyFactory:", address(factory));

        // 3. Create a Test Pool (Optional, but good for verification)
        // Approve USDC for factory first
        uint256 bountyAmount = 100 * 10**6; // 100 USDC per user
        uint256 maxUsers = 10;
        uint256 totalBudget = bountyAmount * maxUsers;

        usdc.approve(address(factory), totalBudget);
        
        // Note: createPool returns address
        address pool = factory.createPool(
            "bafkreigh2akiscaildcqmtciz7fhmkcmwd2bmn5ln7e5j2j5y3cknm25ze", // Test CID (random)
            bountyAmount,
            maxUsers,
            7 days
        );
        console.log("Test Pool Deployed:", pool);

        vm.stopBroadcast();
    }
}
