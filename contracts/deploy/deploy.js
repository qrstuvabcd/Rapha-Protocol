/**
 * RAPHA Protocol Deployment Script
 * Deploys MedicalRecordNFT to Polygon Amoy Testnet
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Contract ABI and Bytecode (pre-compiled)
// MedicalRecordNFT simplified for deployment
const NFT_ABI = [
    "constructor()",
    "function mintRecord(address patient, string recordType, string ipfsHash) returns (uint256)",
    "function mintOwnRecord(string recordType, string ipfsHash) returns (uint256)",
    "function grantAccess(uint256 tokenId, address provider)",
    "function revokeAccess(uint256 tokenId, address provider)",
    "function hasAccess(uint256 tokenId, address provider) view returns (bool)",
    "function getPatientRecords(address patient) view returns (uint256[])",
    "function getRecordMetadata(uint256 tokenId) view returns (string, string, address, uint256, bool)",
    "function totalRecords() view returns (uint256)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function balanceOf(address owner) view returns (uint256)",
    "event RecordMinted(uint256 indexed tokenId, address indexed patient, address indexed provider, string recordType, string ipfsHash)"
];

// Pre-compiled bytecode from Foundry output
const NFT_BYTECODE = readFileSync(join(__dirname, '..', 'out', 'MedicalRecordNFT.sol', 'MedicalRecordNFT.json'), 'utf8');

async function main() {
    console.log('========================================');
    console.log('    RAPHA Protocol Deployment');
    console.log('    Network: Polygon Amoy Testnet');
    console.log('========================================\n');

    // Setup provider and wallet
    const rpcUrl = 'https://rpc-amoy.polygon.technology';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('PRIVATE_KEY not found in .env');
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('Deployer address:', wallet.address);

    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'POL\n');

    if (balance === 0n) {
        throw new Error('No POL balance! Get testnet tokens from faucet.polygon.technology');
    }

    // Parse bytecode from Foundry output
    let bytecode;
    try {
        const artifact = JSON.parse(NFT_BYTECODE);
        bytecode = artifact.bytecode.object;
    } catch (e) {
        console.error('Could not parse bytecode from Foundry output.');
        console.error('Please ensure contracts were compiled with `forge build`');
        process.exit(1);
    }

    // Deploy MedicalRecordNFT
    console.log('Deploying MedicalRecordNFT...');

    const factory = new ethers.ContractFactory(NFT_ABI, bytecode, wallet);
    const contract = await factory.deploy();

    console.log('Transaction hash:', contract.deploymentTransaction().hash);
    console.log('Waiting for confirmation...');

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log('\n========================================');
    console.log('    Deployment Complete!');
    console.log('========================================\n');
    console.log('MedicalRecordNFT deployed to:', address);
    console.log('\nView on PolygonScan:');
    console.log(`https://amoy.polygonscan.com/address/${address}`);

    // Save deployed address
    const envContent = `
# Deployed Contract Addresses (Polygon Amoy)
VITE_NFT_CONTRACT_ADDRESS=${address}
VITE_CHAIN_ID=80002
VITE_RPC_URL=https://rpc-amoy.polygon.technology
`;

    writeFileSync(join(__dirname, 'deployed.env'), envContent);
    console.log('\nAddresses saved to deploy/deployed.env');
    console.log('Copy VITE_NFT_CONTRACT_ADDRESS to frontend-app/.env');
}

main().catch(console.error);
