const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("========================================");
    console.log("    RAPHA Protocol Deployment");
    console.log("    Network: Polygon Amoy Testnet");
    console.log("========================================\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance), "POL\n");

    // Deploy MedicalRecordNFT
    console.log("Deploying MedicalRecordNFT...");
    const NFT = await hre.ethers.getContractFactory("MedicalRecordNFT");
    const nft = await NFT.deploy();
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    console.log("✅ MedicalRecordNFT deployed to:", nftAddress);

    // Deploy MedicalRecordRegistry  
    console.log("\nDeploying MedicalRecordRegistry...");
    const Registry = await hre.ethers.getContractFactory("MedicalRecordRegistry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("✅ MedicalRecordRegistry deployed to:", registryAddress);

    console.log("\n========================================");
    console.log("    Deployment Complete!");
    console.log("========================================\n");

    console.log("Contract Addresses:");
    console.log("  NFT:", nftAddress);
    console.log("  Registry:", registryAddress);

    console.log("\nView on PolygonScan:");
    console.log(`  https://amoy.polygonscan.com/address/${nftAddress}`);
    console.log(`  https://amoy.polygonscan.com/address/${registryAddress}`);

    // Save to file
    const output = `# RAPHA Deployed Contracts (Polygon Amoy)
# Deployed: ${new Date().toISOString()}

VITE_NFT_CONTRACT_ADDRESS=${nftAddress}
VITE_REGISTRY_CONTRACT_ADDRESS=${registryAddress}
VITE_CHAIN_ID=80002
VITE_RPC_URL=https://rpc-amoy.polygon.technology
`;

    fs.writeFileSync(path.join(__dirname, "..", "deployed-addresses.env"), output);
    console.log("\n📁 Addresses saved to contracts/deployed-addresses.env");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
