// Deploy Rapha contracts to L2 local network
const hre = require("hardhat");

async function main() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║         DEPLOYING TO RAPHA L2 BLOCKCHAIN                 ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "ETH");
    console.log("");

    // Deploy MedicalRecordRegistry
    console.log("1. Deploying MedicalRecordRegistry...");
    const MedicalRecordRegistry = await hre.ethers.getContractFactory("MedicalRecordRegistry");
    const registry = await MedicalRecordRegistry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("   ✅ MedicalRecordRegistry:", registryAddress);

    // Deploy RaphaBountyPool
    console.log("2. Deploying RaphaBountyPool...");
    const USDC_ADDRESS = "0x0000000000000000000000000000000000000001"; // Placeholder
    const RaphaBountyPool = await hre.ethers.getContractFactory("RaphaBountyPool");
    const bountyPool = await RaphaBountyPool.deploy(USDC_ADDRESS);
    await bountyPool.waitForDeployment();
    const bountyAddress = await bountyPool.getAddress();
    console.log("   ✅ RaphaBountyPool:", bountyAddress);

    // Deploy RaphaMarket
    console.log("3. Deploying RaphaMarket...");
    const RaphaMarket = await hre.ethers.getContractFactory("RaphaMarket");
    const market = await RaphaMarket.deploy(USDC_ADDRESS, deployer.address);
    await market.waitForDeployment();
    const marketAddress = await market.getAddress();
    console.log("   ✅ RaphaMarket:", marketAddress);

    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  DEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");
    console.log("Deployed Contracts:");
    console.log(`  MedicalRecordRegistry: ${registryAddress}`);
    console.log(`  RaphaBountyPool:       ${bountyAddress}`);
    console.log(`  RaphaMarket:           ${marketAddress}`);
    console.log("");

    // Save addresses to file
    const fs = require("fs");
    const addresses = {
        network: "raphaL2",
        chainId: 1337,
        deployedAt: new Date().toISOString(),
        contracts: {
            MedicalRecordRegistry: registryAddress,
            RaphaBountyPool: bountyAddress,
            RaphaMarket: marketAddress
        }
    };

    fs.writeFileSync(
        "../RAPHA_L2_DEPLOYED.json",
        JSON.stringify(addresses, null, 2)
    );
    console.log("📁 Saved to RAPHA_L2_DEPLOYED.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
