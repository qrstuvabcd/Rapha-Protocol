/**
 * Ethereum Provider Configuration
 * 
 * Sets up ethers.js providers for connecting to Polygon CDK devnet
 * and other networks.
 */

import { ethers, JsonRpcProvider, Wallet, Signer } from 'ethers';

export interface NetworkConfig {
    name: string;
    chainId: number;
    rpcUrl: string;
    explorerUrl?: string;
}

// Network configurations
export const NETWORKS: Record<string, NetworkConfig> = {
    // Local CDK devnet
    cdkDevnet: {
        name: 'Aura CDK Devnet',
        chainId: 1001,
        rpcUrl: 'http://localhost:8545',
    },
    // Polygon Amoy testnet (for TACo)
    polygonAmoy: {
        name: 'Polygon Amoy',
        chainId: 80002,
        rpcUrl: 'https://rpc-amoy.polygon.technology',
        explorerUrl: 'https://amoy.polygonscan.com',
    },
    // Polygon mainnet
    polygon: {
        name: 'Polygon',
        chainId: 137,
        rpcUrl: 'https://polygon-rpc.com',
        explorerUrl: 'https://polygonscan.com',
    },
};

/**
 * Create a JSON-RPC provider for a network
 */
export function createProvider(network: NetworkConfig | string): JsonRpcProvider {
    const config = typeof network === 'string' ? NETWORKS[network] : network;

    if (!config) {
        throw new Error(`Unknown network: ${network}`);
    }

    return new JsonRpcProvider(config.rpcUrl, {
        chainId: config.chainId,
        name: config.name,
    });
}

/**
 * Create a wallet connected to a provider
 */
export function createWallet(
    privateKey: string,
    network: NetworkConfig | string
): Wallet {
    const provider = createProvider(network);
    return new Wallet(privateKey, provider);
}

/**
 * Get the default devnet provider
 */
export function getDevnetProvider(): JsonRpcProvider {
    return createProvider('cdkDevnet');
}

/**
 * Get a signer for the devnet with a prefunded test account
 * Uses Hardhat/Anvil default accounts
 */
export function getDevnetSigner(accountIndex: number = 0): Wallet {
    // Hardhat/Anvil default private keys
    const defaultPrivateKeys = [
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Account 0
        '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Account 1
        '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', // Account 2
    ];

    if (accountIndex >= defaultPrivateKeys.length) {
        throw new Error(`Account index ${accountIndex} not available`);
    }

    return createWallet(defaultPrivateKeys[accountIndex], 'cdkDevnet');
}

/**
 * Wait for a transaction and return the receipt
 */
export async function waitForTransaction(
    txHash: string,
    provider: JsonRpcProvider,
    confirmations: number = 1
): Promise<ethers.TransactionReceipt> {
    const receipt = await provider.waitForTransaction(txHash, confirmations);

    if (!receipt) {
        throw new Error(`Transaction ${txHash} not found`);
    }

    return receipt;
}

/**
 * Get current block number
 */
export async function getBlockNumber(
    provider: JsonRpcProvider
): Promise<number> {
    return provider.getBlockNumber();
}

/**
 * Get account balance in ETH
 */
export async function getBalance(
    address: string,
    provider: JsonRpcProvider
): Promise<string> {
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
}
