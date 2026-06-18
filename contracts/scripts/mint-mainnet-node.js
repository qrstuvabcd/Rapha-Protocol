const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const POLYGON_CHAIN_ID = 137;
const ZERO_BYTES32 = "0x" + "00".repeat(32);
const DEPLOYMENT_PATH = path.join(__dirname, "..", "mainnet-clearing-vault-deployment.json");

function requireEnv(name) {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

function optionalEnv(name) {
    const value = process.env[name];
    return value === undefined || value === "" ? undefined : value;
}

function requireAddress(name) {
    const value = requireEnv(name);
    if (!hre.ethers.isAddress(value)) throw new Error(`${name} must be a valid EVM address`);
    return hre.ethers.getAddress(value);
}

function requireBytes32(name) {
    const value = requireEnv(name);
    if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
        throw new Error(`${name} must be 0x-prefixed bytes32 hex`);
    }
    if (value.toLowerCase() === ZERO_BYTES32) {
        throw new Error(`${name} cannot be zero`);
    }
    return value;
}

function loadDeployment() {
    if (!fs.existsSync(DEPLOYMENT_PATH)) {
        throw new Error(`Missing ${DEPLOYMENT_PATH}. Deploy or record the clearing-vault deployment first.`);
    }
    return JSON.parse(fs.readFileSync(DEPLOYMENT_PATH, "utf8"));
}

async function main() {
    if (process.env.CONFIRM_MAINNET_NODE_MINT !== "YES") {
        throw new Error("Refusing to mint on mainnet. Set CONFIRM_MAINNET_NODE_MINT=YES after legal/commercial approval.");
    }

    const network = await hre.ethers.provider.getNetwork();
    if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
        throw new Error(`Refusing to mint on chain ${network.chainId}; expected Polygon mainnet ${POLYGON_CHAIN_ID}`);
    }

    const deployment = loadDeployment();
    const nodeRegistryAddress = hre.ethers.getAddress(optionalEnv("RAPHA_NODE_NFT_ADDRESS") || deployment.nodeRegistry);
    const investor = requireAddress("NODE_INVESTOR_WALLET");
    const hospitalTreasury = requireAddress("HOSPITAL_TREASURY_WALLET");
    const onboarder = requireAddress("NODE_ONBOARDER_WALLET");
    const hardwareHash = requireBytes32("NODE_HARDWARE_HASH");
    const metadataURI = optionalEnv("NODE_METADATA_URI") || "";

    const [deployer] = await hre.ethers.getSigners();
    const registry = await hre.ethers.getContractAt("RaphaNodeNFT", nodeRegistryAddress);
    const owner = await registry.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        throw new Error(`PRIVATE_KEY must control RaphaNodeNFT owner ${owner}; current signer is ${deployer.address}`);
    }

    const existingTokenId = await registry.tokenIdByHardwareHash(hardwareHash);
    if (existingTokenId !== 0n) {
        throw new Error(`Hardware hash is already registered as token ${existingTokenId.toString()}`);
    }

    console.log("==================================================");
    console.log("Rapha Protocol Mainnet Node Mint");
    console.log("==================================================");
    console.log("Registry:", nodeRegistryAddress);
    console.log("Signer:", deployer.address);
    console.log("Investor/node owner:", investor);
    console.log("Hospital treasury:", hospitalTreasury);
    console.log("Onboarder:", onboarder);
    console.log("Hardware hash:", hardwareHash);

    const tx = await registry.mintNode(investor, hardwareHash, hospitalTreasury, onboarder, metadataURI);
    const receipt = await tx.wait();

    let tokenId;
    for (const log of receipt.logs) {
        try {
            const parsed = registry.interface.parseLog(log);
            if (parsed?.name === "NodeMinted") {
                tokenId = parsed.args.tokenId.toString();
                break;
            }
        } catch (_) {
            // Ignore non-registry logs.
        }
    }
    if (!tokenId) throw new Error("NodeMinted event was not found in transaction receipt");

    const activation = {
        network: "polygon",
        chainId: POLYGON_CHAIN_ID,
        nodeRegistry: nodeRegistryAddress,
        tokenId,
        investor,
        hospitalTreasury,
        onboarder,
        hardwareHash,
        metadataURI,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        mintedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
        path.join(__dirname, "..", "mainnet-node-activation.json"),
        JSON.stringify(activation, null, 2),
    );

    fs.writeFileSync(
        path.join(__dirname, "..", "mainnet-node-activation.env"),
        `# Rapha Protocol active mainnet node\nVITE_RAPHA_ACTIVE_NODE_TOKEN_IDS=${tokenId}\nVITE_RAPHA_NODE_DISCOVERY_START_BLOCK=${receipt.blockNumber}\n`,
    );

    console.log("==================================================");
    console.log("Node Mint Complete");
    console.log("==================================================");
    console.log("Token ID:", tokenId);
    console.log("PolygonScan tx:", `https://polygonscan.com/tx/${receipt.hash}`);
    console.log("Frontend env:");
    console.log(`VITE_RAPHA_ACTIVE_NODE_TOKEN_IDS=${tokenId}`);
    console.log(`VITE_RAPHA_NODE_DISCOVERY_START_BLOCK=${receipt.blockNumber}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
