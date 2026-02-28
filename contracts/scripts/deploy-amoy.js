/**
 * Deploy Rapha Chain System Contracts to Polygon Amoy Testnet
 * 
 * Usage: npx hardhat run scripts/deploy-amoy.js --network amoy
 */

const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║           RAPHA CHAIN - POLYGON AMOY TESTNET DEPLOYMENT              ║
╚══════════════════════════════════════════════════════════════════════╝
    `);

    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);

    console.log(`📍 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} MATIC\n`);

    if (balance < hre.ethers.parseEther("0.1")) {
        console.log("⚠️  Low balance! Get test MATIC from: https://faucet.polygon.technology/");
        console.log("    Select 'Amoy' network and paste your address.\n");
    }

    const deployedContracts = {};

    // ============================================================
    // PHASE 1: Deploy Core Registry
    // ============================================================
    console.log("1️⃣ Deploying RaphaCoreRegistry...");
    try {
        const RaphaCoreRegistry = await hre.ethers.getContractFactory("RaphaCoreRegistry");
        const coreRegistry = await RaphaCoreRegistry.deploy();
        await coreRegistry.waitForDeployment();
        deployedContracts.RaphaCoreRegistry = await coreRegistry.getAddress();
        console.log(`   ✅ RaphaCoreRegistry: ${deployedContracts.RaphaCoreRegistry}`);
    } catch (e) {
        console.log(`   ❌ Failed: ${e.message}`);
    }

    // ============================================================
    // PHASE 2: Deploy TACo Bridge
    // ============================================================
    console.log("2️⃣ Deploying RaphaTACoBridge...");
    try {
        const RaphaTACoBridge = await hre.ethers.getContractFactory("RaphaTACoBridge");
        const tacoBridge = await RaphaTACoBridge.deploy();
        await tacoBridge.waitForDeployment();
        deployedContracts.RaphaTACoBridge = await tacoBridge.getAddress();
        console.log(`   ✅ RaphaTACoBridge: ${deployedContracts.RaphaTACoBridge}`);
    } catch (e) {
        console.log(`   ❌ Failed: ${e.message}`);
    }

    // ============================================================
    // PHASE 3: Deploy Pharma Registry
    // ============================================================
    console.log("3️⃣ Deploying RaphaPharmaRegistry...");
    try {
        const RaphaPharmaRegistry = await hre.ethers.getContractFactory("RaphaPharmaRegistry");
        const pharmaRegistry = await RaphaPharmaRegistry.deploy();
        await pharmaRegistry.waitForDeployment();
        deployedContracts.RaphaPharmaRegistry = await pharmaRegistry.getAddress();
        console.log(`   ✅ RaphaPharmaRegistry: ${deployedContracts.RaphaPharmaRegistry}`);
    } catch (e) {
        console.log(`   ❌ Failed: ${e.message}`);
    }

    // ============================================================
    // PHASE 4: Deploy Bounty Native
    // ============================================================
    console.log("4️⃣ Deploying RaphaBountyNative...");
    try {
        const RaphaBountyNative = await hre.ethers.getContractFactory("RaphaBountyNative");
        const bountyNative = await RaphaBountyNative.deploy();
        await bountyNative.waitForDeployment();
        deployedContracts.RaphaBountyNative = await bountyNative.getAddress();
        console.log(`   ✅ RaphaBountyNative: ${deployedContracts.RaphaBountyNative}`);
    } catch (e) {
        console.log(`   ❌ Failed: ${e.message}`);
    }

    // ============================================================
    // PHASE 5: Deploy MedicalRecordRegistry (legacy)
    // ============================================================
    console.log("5️⃣ Deploying MedicalRecordRegistry...");
    try {
        const MedicalRecordRegistry = await hre.ethers.getContractFactory("MedicalRecordRegistry");
        const recordRegistry = await MedicalRecordRegistry.deploy();
        await recordRegistry.waitForDeployment();
        deployedContracts.MedicalRecordRegistry = await recordRegistry.getAddress();
        console.log(`   ✅ MedicalRecordRegistry: ${deployedContracts.MedicalRecordRegistry}`);
    } catch (e) {
        console.log(`   ❌ Failed: ${e.message}`);
    }

    // ============================================================
    // Save deployed addresses
    // ============================================================
    const envContent = `# Rapha Chain - Polygon Amoy Testnet Deployment
# Deployed: ${new Date().toISOString()}
# Network: Polygon Amoy (Chain ID: 80002)

VITE_CHAIN_ID=80002
VITE_RPC_URL=https://rpc-amoy.polygon.technology
VITE_CHAIN_NAME="Polygon Amoy"

# System Contracts
RAPHA_CORE_REGISTRY=${deployedContracts.RaphaCoreRegistry || ""}
RAPHA_TACO_BRIDGE=${deployedContracts.RaphaTACoBridge || ""}
RAPHA_PHARMA_REGISTRY=${deployedContracts.RaphaPharmaRegistry || ""}
RAPHA_BOUNTY_NATIVE=${deployedContracts.RaphaBountyNative || ""}
MEDICAL_RECORD_REGISTRY=${deployedContracts.MedicalRecordRegistry || ""}

# Explorer
BLOCK_EXPLORER=https://amoy.polygonscan.com
`;

    fs.writeFileSync("amoy-deployed.env", envContent);

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                 AMOY TESTNET DEPLOYMENT COMPLETE                      ║
╠══════════════════════════════════════════════════════════════════════╣
║  Network:  Polygon Amoy Testnet (Chain ID: 80002)                     ║
║  Explorer: https://amoy.polygonscan.com                               ║
╠══════════════════════════════════════════════════════════════════════╣
║  Contracts saved to: amoy-deployed.env                                ║
╚══════════════════════════════════════════════════════════════════════╝

🔗 Verify on PolygonScan:
   https://amoy.polygonscan.com/address/${deployedContracts.RaphaCoreRegistry}
    `);

    return deployedContracts;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
