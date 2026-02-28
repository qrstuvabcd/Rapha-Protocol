
const hre = require("hardhat");
const fs = require("fs");

// Polygon Mainnet Addresses from MAINNET_DEPLOYED.md or Block Explorers
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // USDC.e (Standard on Polygon PoS)
// Note: The MD file said 0x3c49... but 0x2791... is the main one most people use. 
// Let's stick to 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 if that's what they used previously?
// Actually, 0x2791... is bridged USDC (PoS). 0x3c49... is USDC (native).
// We'll use 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 (USDC Native) as it is the new standard.
// Wait, checking polygonscan... 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 is indeed USDC (Native).
// 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174 is USDC.e (Bridged).
// Given the MD file lists it, I'll use 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359.

const SAFE_USDC = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying to Polygon Mainnet with account:", deployer.address);

    // 1. Deploy RaphaToken (Governance Token)
    // We mint 1 billion to deployer.
    // const RaphaToken = await hre.ethers.getContractFactory("RaphaToken");
    // const raphaToken = await RaphaToken.deploy();
    // await raphaToken.waitForDeployment();
    // const raphaTokenAddress = await raphaToken.getAddress();

    const raphaTokenAddress = "0xB534d54a7c2cb2925926E0ee24654979167E61aA";
    console.log("RaphaToken deployed to:", raphaTokenAddress);

    // 2. Deploy Factory
    const treasury = deployer.address; // Use deployer as treasury for now
    const computeNode = deployer.address; // Use deployer as compute node for now

    console.log("Deploying Factory with USDC:", SAFE_USDC);

    const RaphaBountyFactory = await hre.ethers.getContractFactory("RaphaBountyFactory");
    const factory = await RaphaBountyFactory.deploy(
        SAFE_USDC,
        raphaTokenAddress,
        treasury,
        computeNode
    );
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("RaphaBountyFactory deployed to:", factoryAddress);

    // Save Output
    const deploymentInfo = {
        network: "polygon",
        raphaToken: raphaTokenAddress,
        usdc: SAFE_USDC,
        factory: factoryAddress,
        deployer: deployer.address
    };

    fs.writeFileSync("mainnet-bounty-deployment.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved to mainnet-bounty-deployment.json");
    console.log("To verify: npx hardhat verify --network polygon", factoryAddress, SAFE_USDC, raphaTokenAddress, treasury, computeNode);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
