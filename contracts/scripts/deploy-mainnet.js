const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("========================================");
    console.log("    RAPHA Protocol - MAINNET Deployment");
    console.log("    Network: Polygon Mainnet (ChainID 137)");
    console.log("========================================\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "POL\n");

    if (parseFloat(hre.ethers.formatEther(balance)) < 0.1) {
        console.error("ERROR: Insufficient POL balance. Need at least 0.1 POL for deployment.");
        process.exit(1);
    }

    const deployed = {};

    // Use real USDC on Polygon Mainnet
    // Polygon USDC: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 (native USDC)
    const USDC_MAINNET = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
    deployed.usdc = USDC_MAINNET;
    console.log("Using Polygon USDC:", deployed.usdc);

    // 1. Deploy MedicalRecordNFT  
    console.log("\n1. Deploying MedicalRecordNFT...");
    const NFT = await hre.ethers.getContractFactory("MedicalRecordNFT");
    const nft = await NFT.deploy();
    await nft.waitForDeployment();
    deployed.nft = await nft.getAddress();
    console.log("   ✅ MedicalRecordNFT:", deployed.nft);

    // 2. Deploy MedicalRecordRegistry
    console.log("2. Deploying MedicalRecordRegistry...");
    const Registry = await hre.ethers.getContractFactory("MedicalRecordRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    deployed.registry = await registry.getAddress();
    console.log("   ✅ MedicalRecordRegistry:", deployed.registry);

    // Treasury = deployer address (update this for production)
    const treasury = deployer.address;

    // 3. Deploy RaphaMarket
    console.log("3. Deploying RaphaMarket...");
    try {
        const Market = await hre.ethers.getContractFactory("RaphaMarket");
        const market = await Market.deploy(deployed.usdc, treasury, treasury);
        await market.waitForDeployment();
        deployed.market = await market.getAddress();
        console.log("   ✅ RaphaMarket:", deployed.market);
    } catch (e) {
        console.log("   ⚠️ RaphaMarket skipped (compilation issue):", e.message?.slice(0, 100));
        deployed.market = "NOT_DEPLOYED";
    }

    // 4. Deploy RaphaBountyFactory
    console.log("4. Deploying RaphaBountyFactory...");
    try {
        const Factory = await hre.ethers.getContractFactory("RaphaBountyFactory");
        const factory = await Factory.deploy(deployed.usdc, treasury, treasury);
        await factory.waitForDeployment();
        deployed.factory = await factory.getAddress();
        console.log("   ✅ RaphaBountyFactory:", deployed.factory);
    } catch (e) {
        console.log("   ⚠️ RaphaBountyFactory skipped (compilation issue):", e.message?.slice(0, 100));
        deployed.factory = "NOT_DEPLOYED";
    }

    console.log("\n========================================");
    console.log("    MAINNET Deployment Complete!");
    console.log("========================================\n");

    console.log("Contract Addresses:");
    console.log("  USDC (Native):          ", deployed.usdc);
    console.log("  MedicalRecordNFT:       ", deployed.nft);
    console.log("  MedicalRecordRegistry:  ", deployed.registry);
    console.log("  RaphaMarket:            ", deployed.market);
    console.log("  RaphaBountyFactory:     ", deployed.factory);
    console.log("  Treasury:               ", treasury);

    console.log("\nView on PolygonScan:");
    console.log(`  https://polygonscan.com/address/${deployed.nft}`);

    // Save to file
    const output = `# RAPHA Deployed Contracts (Polygon MAINNET)
# Deployed: ${new Date().toISOString()}
# PRODUCTION - DO NOT SHARE PRIVATE KEYS

# Core Contracts
VITE_NFT_CONTRACT_ADDRESS=${deployed.nft}
VITE_REGISTRY_CONTRACT_ADDRESS=${deployed.registry}
VITE_MARKET_CONTRACT_ADDRESS=${deployed.market}
VITE_BOUNTY_FACTORY_ADDRESS=${deployed.factory}

# USDC (Native Polygon USDC)
VITE_USDC_ADDRESS=${deployed.usdc}

# Network
VITE_CHAIN_ID=137
VITE_RPC_URL=https://polygon-rpc.com

# Treasury
VITE_TREASURY_ADDRESS=${treasury}
`;

    fs.writeFileSync(path.join(__dirname, "..", "mainnet-deployed.env"), output);
    console.log("\n📁 All addresses saved to contracts/mainnet-deployed.env");
    console.log("\n🎉 RAPHA Protocol is now LIVE on Polygon Mainnet!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
