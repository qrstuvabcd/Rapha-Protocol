const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const POLYGON_CHAIN_ID = 137;
const USDC_MAINNET = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const DEPLOYED = {
    nft: "0x6f0b9088350EBD347eFecA8D387c9FfEc63DB9F3",
    registry: "0x2c9d0B6069998c9c88a25105817bE5eF25033fE0",
    market: "0xA46a07FbbD6F24E8Ea178aE150118a9B425B0947",
};

function requireEnv(name) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

async function requireCode(provider, name, address) {
    const code = await provider.getCode(address);
    if (code === "0x") throw new Error(`${name} has no bytecode at ${address}`);
}

async function main() {
    const network = await hre.ethers.provider.getNetwork();
    if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
        throw new Error(`Refusing mainnet resume on chain ${network.chainId}; expected Polygon ${POLYGON_CHAIN_ID}`);
    }

    const treasury = requireEnv("TREASURY_ADDRESS");
    const raphaToken = requireEnv("RAPHA_TOKEN_ADDRESS");
    if (!hre.ethers.isAddress(treasury)) throw new Error("TREASURY_ADDRESS must be a valid EVM address");
    if (!hre.ethers.isAddress(raphaToken)) throw new Error("RAPHA_TOKEN_ADDRESS must be a valid EVM address");

    await requireCode(hre.ethers.provider, "MedicalRecordNFT", DEPLOYED.nft);
    await requireCode(hre.ethers.provider, "MedicalRecordRegistry", DEPLOYED.registry);
    await requireCode(hre.ethers.provider, "RaphaMarket", DEPLOYED.market);
    await requireCode(hre.ethers.provider, "RAPHA token", raphaToken);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Resuming Polygon mainnet deployment");
    console.log("Deployer:", deployer.address);
    console.log("Treasury:", treasury);
    console.log("RAPHA token:", raphaToken);

    const Factory = await hre.ethers.getContractFactory("RaphaBountyFactory");
    const factory = await Factory.deploy(USDC_MAINNET, raphaToken, treasury, treasury);
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();

    const output = `# RAPHA Deployed Contracts (Polygon MAINNET)
# Deployed: ${new Date().toISOString()}
# PRODUCTION - DO NOT SHARE PRIVATE KEYS

VITE_NFT_CONTRACT_ADDRESS=${DEPLOYED.nft}
VITE_REGISTRY_CONTRACT_ADDRESS=${DEPLOYED.registry}
VITE_REGISTRY_ADDRESS=${DEPLOYED.registry}
VITE_MARKET_CONTRACT_ADDRESS=${DEPLOYED.market}
VITE_BOUNTY_FACTORY_ADDRESS=${factoryAddress}
VITE_USDC_ADDRESS=${USDC_MAINNET}
VITE_RAPHA_TOKEN_ADDRESS=${raphaToken}
VITE_CHAIN_ID=${POLYGON_CHAIN_ID}
VITE_ACTIVE_NETWORK=polygon
VITE_RPC_URL=https://polygon-bor.publicnode.com
VITE_TREASURY_ADDRESS=${treasury}
`;

    fs.writeFileSync(path.join(__dirname, "..", "mainnet-deployed.env"), output);
    console.log("RaphaBountyFactory:", factoryAddress);
    console.log("Address file: contracts/mainnet-deployed.env");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
