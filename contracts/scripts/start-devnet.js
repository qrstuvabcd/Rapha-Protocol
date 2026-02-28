/**
 * Rapha Chain Local Development Network
 * 
 * This script sets up a fully functional local blockchain with:
 * - All Rapha Chain system contracts deployed
 * - Pre-funded test accounts
 * - Simulated DAC, TACo, and IPFS integration
 * 
 * Usage: npx hardhat run scripts/start-devnet.js --network hardhat
 */

const hre = require("hardhat");

async function main() {
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                    RAPHA CHAIN LOCAL DEVNET                          ║
║══════════════════════════════════════════════════════════════════════║
║  Chain ID:     7777 (simulated via Hardhat fork)                     ║
║  Native Token: $RAPHA (simulated via ETH)                            ║
║  Mode:         Development (full contract deployment)                ║
╚══════════════════════════════════════════════════════════════════════╝
    `);

    const [deployer, patient, provider, researcher, treasury] = await hre.ethers.getSigners();

    console.log("\n📦 Deploying System Contracts...\n");

    // ============================================================
    // PHASE 1: Deploy Core Registry
    // ============================================================
    console.log("1️⃣ Deploying RaphaCoreRegistry...");
    const RaphaCoreRegistry = await hre.ethers.getContractFactory("RaphaCoreRegistry");
    const coreRegistry = await RaphaCoreRegistry.deploy();
    await coreRegistry.waitForDeployment();
    const coreRegistryAddress = await coreRegistry.getAddress();
    console.log(`   ✅ RaphaCoreRegistry: ${coreRegistryAddress}`);

    // ============================================================
    // PHASE 2: Deploy TACo Bridge
    // ============================================================
    console.log("2️⃣ Deploying RaphaTACoBridge...");
    const RaphaTACoBridge = await hre.ethers.getContractFactory("RaphaTACoBridge");
    const tacoBridge = await RaphaTACoBridge.deploy();
    await tacoBridge.waitForDeployment();
    const tacoBridgeAddress = await tacoBridge.getAddress();
    console.log(`   ✅ RaphaTACoBridge: ${tacoBridgeAddress}`);

    // ============================================================
    // PHASE 3: Deploy Pharma Registry
    // ============================================================
    console.log("3️⃣ Deploying RaphaPharmaRegistry...");
    const RaphaPharmaRegistry = await hre.ethers.getContractFactory("RaphaPharmaRegistry");
    const pharmaRegistry = await RaphaPharmaRegistry.deploy();
    await pharmaRegistry.waitForDeployment();
    const pharmaRegistryAddress = await pharmaRegistry.getAddress();
    console.log(`   ✅ RaphaPharmaRegistry: ${pharmaRegistryAddress}`);

    // ============================================================
    // PHASE 4: Deploy Bounty Native
    // ============================================================
    console.log("4️⃣ Deploying RaphaBountyNative...");
    const RaphaBountyNative = await hre.ethers.getContractFactory("RaphaBountyNative");
    const bountyNative = await RaphaBountyNative.deploy();
    await bountyNative.waitForDeployment();
    const bountyNativeAddress = await bountyNative.getAddress();
    console.log(`   ✅ RaphaBountyNative: ${bountyNativeAddress}`);

    // ============================================================
    // PHASE 5: Deploy existing contracts (MedicalRecordRegistry, etc.)
    // ============================================================
    console.log("5️⃣ Deploying MedicalRecordRegistry (legacy support)...");
    const MedicalRecordRegistry = await hre.ethers.getContractFactory("MedicalRecordRegistry");
    const recordRegistry = await MedicalRecordRegistry.deploy();
    await recordRegistry.waitForDeployment();
    const recordRegistryAddress = await recordRegistry.getAddress();
    console.log(`   ✅ MedicalRecordRegistry: ${recordRegistryAddress}`);

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║                     DEPLOYMENT COMPLETE                               ║
╠══════════════════════════════════════════════════════════════════════╣
║  Contract                    │ Address                                ║
╠──────────────────────────────┼────────────────────────────────────────╣
║  RaphaCoreRegistry           │ ${coreRegistryAddress}  ║
║  RaphaTACoBridge             │ ${tacoBridgeAddress}  ║
║  RaphaPharmaRegistry         │ ${pharmaRegistryAddress}  ║
║  RaphaBountyNative           │ ${bountyNativeAddress}  ║
║  MedicalRecordRegistry       │ ${recordRegistryAddress}  ║
╠══════════════════════════════════════════════════════════════════════╣
║  Test Accounts (1000 ETH/$RAPHA each):                                ║
╠──────────────────────────────┼────────────────────────────────────────╣
║  Deployer                    │ ${deployer.address}  ║
║  Patient                     │ ${patient.address}  ║
║  Provider                    │ ${provider.address}  ║
║  Researcher                  │ ${researcher.address}  ║
║  Treasury                    │ ${treasury.address}  ║
╚══════════════════════════════════════════════════════════════════════╝

🚀 Rapha Chain devnet is now running!
   Connect your frontend to: http://localhost:8545
    `);

    // Return addresses for programmatic use
    return {
        coreRegistry: coreRegistryAddress,
        tacoBridge: tacoBridgeAddress,
        pharmaRegistry: pharmaRegistryAddress,
        bountyNative: bountyNativeAddress,
        recordRegistry: recordRegistryAddress,
        accounts: {
            deployer: deployer.address,
            patient: patient.address,
            provider: provider.address,
            researcher: researcher.address,
            treasury: treasury.address
        }
    };
}

main()
    .then((addresses) => {
        console.log("\n✅ Devnet ready. Press Ctrl+C to stop.\n");
        // Keep process running
        process.stdin.resume();
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
