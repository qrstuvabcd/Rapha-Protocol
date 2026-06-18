const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const POLYGON_CHAIN_ID = 137;
const MIN_DEPLOYER_POL = 0.1;
const USDC_MAINNET = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

async function deployContract(name, args = []) {
    console.log(`Deploying ${name}...`);
    const Factory = await hre.ethers.getContractFactory(name);
    const contract = await Factory.deploy(...args);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`  ${name}: ${address}`);
    return address;
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

    console.log("========================================");
    console.log("RAPHA Protocol - Polygon Mainnet Deploy");
    console.log("========================================");
    console.log("Deployer:", deployer.address);
    console.log("Treasury:", treasury);
    console.log("RAPHA token:", raphaToken);
    console.log("Balance:", hre.ethers.formatEther(balance), "POL");

    if (balancePol < MIN_DEPLOYER_POL) {
        throw new Error(`Insufficient POL balance. Need at least ${MIN_DEPLOYER_POL} POL for deployment.`);
    }

    const deployed = {
        usdc: USDC_MAINNET,
        raphaToken,
        treasury,
    };

    console.log("Using Polygon native USDC:", deployed.usdc);

    deployed.nft = await deployContract("MedicalRecordNFT");
    deployed.registry = await deployContract("MedicalRecordRegistry");
    deployed.market = await deployContract("RaphaMarket", [deployed.usdc, treasury, treasury]);
    deployed.factory = await deployContract("RaphaBountyFactory", [deployed.usdc, deployed.raphaToken, treasury, treasury]);

    const output = `# RAPHA Deployed Contracts (Polygon MAINNET)
# Deployed: ${new Date().toISOString()}
# PRODUCTION - DO NOT SHARE PRIVATE KEYS

VITE_NFT_CONTRACT_ADDRESS=${deployed.nft}
VITE_REGISTRY_CONTRACT_ADDRESS=${deployed.registry}
VITE_REGISTRY_ADDRESS=${deployed.registry}
VITE_MARKET_CONTRACT_ADDRESS=${deployed.market}
VITE_BOUNTY_FACTORY_ADDRESS=${deployed.factory}
VITE_USDC_ADDRESS=${deployed.usdc}
VITE_RAPHA_TOKEN_ADDRESS=${deployed.raphaToken}
VITE_CHAIN_ID=${POLYGON_CHAIN_ID}
VITE_ACTIVE_NETWORK=polygon
VITE_RPC_URL=https://polygon-bor.publicnode.com
VITE_TREASURY_ADDRESS=${deployed.treasury}
`;

    fs.writeFileSync(path.join(__dirname, "..", "mainnet-deployed.env"), output);

    console.log("========================================");
    console.log("MAINNET Deployment Complete");
    console.log("========================================");
    console.log("MedicalRecordNFT:", deployed.nft);
    console.log("MedicalRecordRegistry:", deployed.registry);
    console.log("RaphaMarket:", deployed.market);
    console.log("RaphaBountyFactory:", deployed.factory);
    console.log("Polygonscan:", `https://polygonscan.com/address/${deployed.nft}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
