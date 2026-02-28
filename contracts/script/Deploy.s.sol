// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MedicalRecordRegistry.sol";
import "../src/MedicalRecordNFT.sol";

/**
 * @title Deploy Script
 * @notice Deploys RAPHA Protocol core contracts to Polygon Amoy
 * @dev RaphaMarket is excluded as it requires USDC which isn't on testnet
 */
contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        // Get deployer private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        console.log("========================================");
        console.log("    RAPHA Protocol Deployment");
        console.log("    Network: Polygon Amoy Testnet");
        console.log("========================================");
        console.log("");

        // 1. Deploy MedicalRecordRegistry
        MedicalRecordRegistry registry = new MedicalRecordRegistry();
        console.log("1. MedicalRecordRegistry deployed:");
        console.log("   Address:", address(registry));

        // 2. Deploy MedicalRecordNFT
        MedicalRecordNFT nft = new MedicalRecordNFT();
        console.log("2. MedicalRecordNFT deployed:");
        console.log("   Address:", address(nft));

        console.log("");
        console.log("========================================");
        console.log("    Deployment Complete!");
        console.log("========================================");
        console.log("");
        console.log("Add these to frontend-app/.env:");
        console.log("VITE_REGISTRY_CONTRACT_ADDRESS=", address(registry));
        console.log("VITE_NFT_CONTRACT_ADDRESS=", address(nft));

        vm.stopBroadcast();
    }
}
