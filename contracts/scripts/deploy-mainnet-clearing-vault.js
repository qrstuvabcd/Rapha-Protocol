const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

const POLYGON_CHAIN_ID = 137;
const USDC_MAINNET = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";
const MIN_DEPLOYER_POL = 0.08;

function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

function optionalEnv(name) {
    const value = process.env[name];
    return value === undefined || value === "" ? undefined : value;
}

function requireAddress(name) {
    const value = requireEnv(name);
    if (!hre.ethers.isAddress(value)) {
        throw new Error(`${name} must be a valid EVM address`);
    }
    return value;
}

function optionalAddress(name) {
    const value = optionalEnv(name);
    if (value === undefined) {
        return undefined;
    }
    if (!hre.ethers.isAddress(value)) {
        throw new Error(`${name} must be a valid EVM address`);
    }
    return value;
}

function requireBytes32(name) {
    const value = requireEnv(name);
    if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
        throw new Error(`${name} must be bytes32 hex, e.g. 0x followed by 64 hex characters`);
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
    return contract;
}

async function maybeMintInitialNode(nodeRegistry) {
    const investor = optionalAddress("NODE_INVESTOR_WALLET");
    const hospitalTreasury = optionalAddress("HOSPITAL_TREASURY_WALLET");
    const onboarder = optionalAddress("NODE_ONBOARDER_WALLET");
    const metadataURI = optionalEnv("NODE_METADATA_URI") || "";
    const hardwareHash = process.env.NODE_HARDWARE_HASH;

    const provided = [investor, hospitalTreasury, onboarder, hardwareHash].filter(Boolean).length;
    if (provided === 0) {
        return undefined;
    }
    if (provided !== 4) {
        throw new Error(
            "To mint the first node, provide all of NODE_INVESTOR_WALLET, HOSPITAL_TREASURY_WALLET, NODE_ONBOARDER_WALLET, NODE_HARDWARE_HASH"
        );
    }

    const checkedHardwareHash = requireBytes32("NODE_HARDWARE_HASH");
    console.log("Minting initial RaphaNodeNFT...");
    const tx = await nodeRegistry.mintNode(investor, checkedHardwareHash, hospitalTreasury, onboarder, metadataURI);
    const receipt = await tx.wait();

    for (const log of receipt.logs) {
        try {
            const parsed = nodeRegistry.interface.parseLog(log);
            if (parsed.name === "NodeMinted") {
                const tokenId = parsed.args.tokenId.toString();
                console.log(`  Node token ID: ${tokenId}`);
                return {
                    tokenId,
                    investor,
                    hospitalTreasury,
                    onboarder,
                    hardwareHash: checkedHardwareHash,
                    metadataURI,
                    transactionHash: receipt.hash,
                };
            }
        } catch (_) {
            // Ignore logs emitted by other contracts.
        }
    }

    throw new Error("NodeMinted event not found");
}

async function main() {
    const network = await hre.ethers.provider.getNetwork();
    if (Number(network.chainId) !== POLYGON_CHAIN_ID) {
        throw new Error(`Refusing mainnet deploy on chain ${network.chainId}; expected Polygon ${POLYGON_CHAIN_ID}`);
    }

    const trustedAttestor = requireAddress("TRUSTED_ATTESTOR");
    const raphaTreasuryWallet = requireAddress("RAPHA_TREASURY_WALLET");

    const [deployer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(deployer.address);
    const balancePol = Number(hre.ethers.formatEther(balance));
    if (balancePol < MIN_DEPLOYER_POL) {
        throw new Error(`Insufficient POL balance. Need at least ${MIN_DEPLOYER_POL} POL for deployment.`);
    }

    console.log("==================================================");
    console.log("Rapha Protocol Module 2 - Polygon Mainnet Deploy");
    console.log("==================================================");
    console.log("Deployer:", deployer.address);
    console.log("USDC:", USDC_MAINNET);
    console.log("Trusted attestor:", trustedAttestor);
    console.log("Rapha Protocol treasury:", raphaTreasuryWallet);
    console.log("Balance:", hre.ethers.formatEther(balance), "POL");

    const nodeRegistry = await deployContract("RaphaNodeNFT");
    const nodeRegistryAddress = await nodeRegistry.getAddress();

    const clearingVault = await deployContract("RaphaClearingVault", [
        USDC_MAINNET,
        nodeRegistryAddress,
        trustedAttestor,
        raphaTreasuryWallet,
    ]);
    const clearingVaultAddress = await clearingVault.getAddress();

    const initialNode = await maybeMintInitialNode(nodeRegistry);

    const deploymentInfo = {
        network: "polygon",
        chainId: POLYGON_CHAIN_ID,
        usdc: USDC_MAINNET,
        nodeRegistry: nodeRegistryAddress,
        clearingVault: clearingVaultAddress,
        trustedAttestor,
        raphaTreasuryWallet,
        deployer: deployer.address,
        initialNode,
        deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
        path.join(__dirname, "..", "mainnet-clearing-vault-deployment.json"),
        JSON.stringify(deploymentInfo, null, 2)
    );

    const frontendEnv = `# Rapha Protocol Module 2 Polygon MAINNET
# Deployed: ${deploymentInfo.deployedAt}
VITE_RAPHA_NODE_NFT_ADDRESS=${nodeRegistryAddress}
VITE_RAPHA_CLEARING_VAULT_ADDRESS=${clearingVaultAddress}
VITE_USDC_ADDRESS=${USDC_MAINNET}
VITE_RAPHA_TREASURY_WALLET=${raphaTreasuryWallet}
`;
    fs.writeFileSync(path.join(__dirname, "..", "mainnet-clearing-vault.env"), frontendEnv);

    console.log("==================================================");
    console.log("MAINNET Deployment Complete");
    console.log("==================================================");
    console.log("RaphaNodeNFT:", nodeRegistryAddress);
    console.log("RaphaClearingVault:", clearingVaultAddress);
    console.log("Node registry Polygonscan:", `https://polygonscan.com/address/${nodeRegistryAddress}`);
    console.log("Clearing vault Polygonscan:", `https://polygonscan.com/address/${clearingVaultAddress}`);
    console.log(
        "Verify Node NFT:",
        `npx hardhat verify --network polygon ${nodeRegistryAddress}`
    );
    console.log(
        "Verify Clearing Vault:",
        `npx hardhat verify --network polygon ${clearingVaultAddress} ${USDC_MAINNET} ${nodeRegistryAddress} ${trustedAttestor} ${raphaTreasuryWallet}`
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
