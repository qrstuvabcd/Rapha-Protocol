const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const POLYGON_CHAIN_ID = 137;
const USDC_MAINNET = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const MIN_DEPLOYER_POL = 0.05;

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

async function main() {
    const network = await hre.ethers.provider.getNetwork();
    if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
        throw new Error(`Refusing mainnet deploy on chain ${network.chainId}; expected Polygon ${POLYGON_CHAIN_ID}`);
    }

    const treasury = requireEnv("TREASURY_ADDRESS");
    const raphaToken = requireEnv("RAPHA_TOKEN_ADDRESS");
    if (!hre.ethers.isAddress(treasury)) {
        throw new Error("TREASURY_ADDRESS must be a valid EVM address");
    }
    if (!hre.ethers.isAddress(raphaToken)) {
        throw new Error("RAPHA_TOKEN_ADDRESS must be a valid EVM address");
    }

    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balancePol = Number(hre.ethers.formatEther(balance));
    if (balancePol < MIN_DEPLOYER_POL) {
        throw new Error(`Insufficient POL balance. Need at least ${MIN_DEPLOYER_POL} POL for deployment.`);
    }

    console.log("Deploying RaphaBountyFactory to Polygon Mainnet");
    console.log("Deployer:", deployer.address);
    console.log("Treasury:", treasury);
    console.log("RAPHA token:", raphaToken);
    console.log("USDC:", USDC_MAINNET);

    const Factory = await hre.ethers.getContractFactory("RaphaBountyFactory");
    const factory = await Factory.deploy(USDC_MAINNET, raphaToken, treasury, treasury);
    await factory.waitForDeployment();

    const factoryAddress = await factory.getAddress();
    const deploymentInfo = {
        network: "polygon",
        chainId: POLYGON_CHAIN_ID,
        raphaToken,
        usdc: USDC_MAINNET,
        factory: factoryAddress,
        treasury,
        computeNode: treasury,
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
        path.join(__dirname, "..", "mainnet-bounty-deployment.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("RaphaBountyFactory:", factoryAddress);
    console.log("Polygonscan:", `https://polygonscan.com/address/${factoryAddress}`);
    console.log(
        "Verify:",
        `npx hardhat verify --network polygon ${factoryAddress} ${USDC_MAINNET} ${raphaToken} ${treasury} ${treasury}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
