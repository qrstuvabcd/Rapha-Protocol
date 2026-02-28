const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("========================================");
    console.log("    RAPHA Protocol - FULL Deployment");
    console.log("    Network: Polygon Amoy Testnet");
    console.log("========================================\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "POL\n");

    const deployed = {};

    // 1. Deploy MockUSDC (for testnet)
    console.log("1. Deploying MockUSDC...");
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    deployed.usdc = await usdc.getAddress();
    console.log("   ✅ MockUSDC:", deployed.usdc);

    // 2. Deploy MedicalRecordNFT  
    console.log("2. Deploying MedicalRecordNFT...");
    const NFT = await hre.ethers.getContractFactory("MedicalRecordNFT");
    const nft = await NFT.deploy();
    await nft.waitForDeployment();
    deployed.nft = await nft.getAddress();
    console.log("   ✅ MedicalRecordNFT:", deployed.nft);

    // 3. Deploy MedicalRecordRegistry
    console.log("3. Deploying MedicalRecordRegistry...");
    const Registry = await hre.ethers.getContractFactory("MedicalRecordRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    deployed.registry = await registry.getAddress();
    console.log("   ✅ MedicalRecordRegistry:", deployed.registry);

    // Treasury = deployer address
    const treasury = deployer.address;

    // 4. Deploy RaphaMarket
    console.log("4. Deploying RaphaMarket...");
    const Market = await hre.ethers.getContractFactory("RaphaMarket");
    const market = await Market.deploy(deployed.usdc, treasury, treasury); // patientPool = treasury for now
    await market.waitForDeployment();
    deployed.market = await market.getAddress();
    console.log("   ✅ RaphaMarket:", deployed.market);

    // 5. Deploy RaphaBountyFactory
    console.log("5. Deploying RaphaBountyFactory...");
    const Factory = await hre.ethers.getContractFactory("RaphaBountyFactory");
    const factory = await Factory.deploy(deployed.usdc, treasury, treasury); // computeNode = treasury for now
    await factory.waitForDeployment();
    deployed.factory = await factory.getAddress();
    console.log("   ✅ RaphaBountyFactory:", deployed.factory);

    console.log("\n========================================");
    console.log("    Deployment Complete!");
    console.log("========================================\n");

    console.log("Contract Addresses:");
    console.log("  MockUSDC:               ", deployed.usdc);
    console.log("  MedicalRecordNFT:       ", deployed.nft);
    console.log("  MedicalRecordRegistry:  ", deployed.registry);
    console.log("  RaphaMarket:            ", deployed.market);
    console.log("  RaphaBountyFactory:     ", deployed.factory);
    console.log("  Treasury:               ", treasury);

    console.log("\nView on PolygonScan:");
    console.log(`  https://amoy.polygonscan.com/address/${deployed.nft}`);

    // Save to file
    const output = `# RAPHA Deployed Contracts (Polygon Amoy)
# Deployed: ${new Date().toISOString()}

# Core Contracts
VITE_NFT_CONTRACT_ADDRESS=${deployed.nft}
VITE_REGISTRY_CONTRACT_ADDRESS=${deployed.registry}
VITE_MARKET_CONTRACT_ADDRESS=${deployed.market}
VITE_BOUNTY_FACTORY_ADDRESS=${deployed.factory}

# Test USDC (for marketplace)
VITE_USDC_ADDRESS=${deployed.usdc}

# Network
VITE_CHAIN_ID=80002
VITE_RPC_URL=https://rpc-amoy.polygon.technology

# Treasury
VITE_TREASURY_ADDRESS=${treasury}
`;

    fs.writeFileSync(path.join(__dirname, "..", "deployed-addresses.env"), output);
    console.log("\n📁 All addresses saved to contracts/deployed-addresses.env");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
