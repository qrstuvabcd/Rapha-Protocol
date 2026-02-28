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

    // Deploy MedicalRecordNFT only (main contract for medical records)
    console.log("Deploying MedicalRecordNFT...");
    const NFT = await hre.ethers.getContractFactory("MedicalRecordNFT");
    const nft = await NFT.deploy();
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    console.log("✅ MedicalRecordNFT deployed to:", nftAddress);

    console.log("\n========================================");
    console.log("    Deployment Complete!");
    console.log("========================================\n");

    console.log("Contract Address:");
    console.log("  MedicalRecordNFT:", nftAddress);

    console.log("\nView on PolygonScan:");
    console.log(`  https://amoy.polygonscan.com/address/${nftAddress}`);

    // Save to file
    const output = `# RAPHA Deployed Contracts (Polygon Amoy)
# Deployed: ${new Date().toISOString()}

VITE_NFT_CONTRACT_ADDRESS=${nftAddress}
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
