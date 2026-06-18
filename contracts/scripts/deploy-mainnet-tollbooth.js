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

function optionalEnv(name, fallback) {
    const value = process.env[name];
    return value === undefined || value === "" ? fallback : value;
}

function requireAddress(name) {
    const value = requireEnv(name);
    if (!hre.ethers.isAddress(value)) {
        throw new Error(`${name} must be a valid EVM address`);
    }
    return value;
}

function parseUsdc6(name, fallback) {
    const value = optionalEnv(name, fallback);
    if (!/^\d+$/.test(value)) {
        throw new Error(`${name} must be a non-negative integer in USDC six-decimal base units`);
    }
    return BigInt(value);
}

async function main() {
    const network = await hre.ethers.provider.getNetwork();
    if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
        throw new Error(`Refusing mainnet deploy on chain ${network.chainId}; expected Polygon ${POLYGON_CHAIN_ID}`);
    }

    const hospitalWallet = requireAddress("HOSPITAL_WALLET");
    const raphaTreasuryWallet = requireAddress("RAPHA_TREASURY_WALLET");
    const trustedAttestor = requireAddress("TRUSTED_ATTESTOR");
    const pricePerRecord = parseUsdc6("PRICE_PER_RECORD_USDC_6DP", "500000");
    const pricePerComputeEpoch = parseUsdc6("PRICE_PER_COMPUTE_EPOCH_USDC_6DP", "0");

    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balancePol = Number(hre.ethers.formatEther(balance));
    if (balancePol < MIN_DEPLOYER_POL) {
        throw new Error(`Insufficient POL balance. Need at least ${MIN_DEPLOYER_POL} POL for deployment.`);
    }

    console.log("Deploying RaphaTollbooth to Polygon Mainnet");
    console.log("Deployer:", deployer.address);
    console.log("USDC:", USDC_MAINNET);
    console.log("Hospital wallet:", hospitalWallet);
    console.log("Rapha Protocol 5% treasury wallet:", raphaTreasuryWallet);
    console.log("Trusted attestor:", trustedAttestor);
    console.log("Price per record (USDC 6dp):", pricePerRecord.toString());
    console.log("Price per compute epoch (USDC 6dp):", pricePerComputeEpoch.toString());

    const Tollbooth = await hre.ethers.getContractFactory("RaphaTollbooth");
    const tollbooth = await Tollbooth.deploy(
        USDC_MAINNET,
        hospitalWallet,
        raphaTreasuryWallet,
        trustedAttestor,
        pricePerRecord,
        pricePerComputeEpoch
    );
    await tollbooth.waitForDeployment();

    const tollboothAddress = await tollbooth.getAddress();
    const deploymentInfo = {
        network: "polygon",
        chainId: POLYGON_CHAIN_ID,
        usdc: USDC_MAINNET,
        tollbooth: tollboothAddress,
        hospitalWallet,
        raphaTreasuryWallet,
        trustedAttestor,
        pricePerRecordUsdc6dp: pricePerRecord.toString(),
        pricePerComputeEpochUsdc6dp: pricePerComputeEpoch.toString(),
        deployer: deployer.address,
        deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
        path.join(__dirname, "..", "mainnet-tollbooth-deployment.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );

    const frontendEnv = `# RaphaTollbooth Polygon MAINNET
# Deployed: ${deploymentInfo.deployedAt}
VITE_RAPHA_TOLLBOOTH_ADDRESS=${tollboothAddress}
VITE_USDC_ADDRESS=${USDC_MAINNET}
VITE_RAPHA_TREASURY_WALLET=${raphaTreasuryWallet}
`;
    fs.writeFileSync(path.join(__dirname, "..", "mainnet-tollbooth.env"), frontendEnv);

    console.log("RaphaTollbooth:", tollboothAddress);
    console.log("Polygonscan:", `https://polygonscan.com/address/${tollboothAddress}`);
    console.log(
        "Verify:",
        `npx hardhat verify --network polygon ${tollboothAddress} ${USDC_MAINNET} ${hospitalWallet} ${raphaTreasuryWallet} ${trustedAttestor} ${pricePerRecord} ${pricePerComputeEpoch}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
