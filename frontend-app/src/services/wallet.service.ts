/**
 * In-App Wallet Service
 * 
 * Allows users to create and manage wallets directly in Aura Health
 * without needing MetaMask or any external crypto wallet.
 * 
 * Keys are encrypted with user's password and stored in localStorage.
 */

import { ethers } from 'ethers'

const STORAGE_KEY = 'aura_health_wallet'
const SALT = 'aura_health_v1_' // Prefix for key derivation

export interface StoredWallet {
    address: string
    encryptedPrivateKey: string
    createdAt: number
}

export interface WalletSession {
    address: string
    privateKey: string
    signer: ethers.Wallet | ethers.HDNodeWallet
}

/**
 * Derive an encryption key from password using PBKDF2
 */
async function deriveKey(password: string): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    )

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(SALT),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

/**
 * Encrypt private key with password
 */
async function encryptPrivateKey(privateKey: string, password: string): Promise<string> {
    const key = await deriveKey(password)
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoder = new TextEncoder()

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(privateKey)
    )

    // Combine IV + encrypted data and encode as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt private key with password
 */
async function decryptPrivateKey(encryptedData: string, password: string): Promise<string> {
    const key = await deriveKey(password)
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))

    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)

    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        )

        return new TextDecoder().decode(decrypted)
    } catch {
        throw new Error('Invalid password')
    }
}

/**
 * Create a new wallet with password protection
 */
export async function createWallet(password: string): Promise<WalletSession> {
    // Validate password strength
    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters')
    }

    // Generate new wallet
    const wallet = ethers.Wallet.createRandom()

    // Encrypt private key
    const encryptedPrivateKey = await encryptPrivateKey(wallet.privateKey, password)

    // Store in localStorage
    const storedWallet: StoredWallet = {
        address: wallet.address,
        encryptedPrivateKey,
        createdAt: Date.now(),
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedWallet))

    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        signer: wallet,
    }
}

/**
 * Unlock existing wallet with password
 */
export async function unlockWallet(password: string): Promise<WalletSession> {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
        throw new Error('No wallet found. Please create one first.')
    }

    const storedWallet: StoredWallet = JSON.parse(stored)

    // Decrypt private key
    const privateKey = await decryptPrivateKey(storedWallet.encryptedPrivateKey, password)
    const wallet = new ethers.Wallet(privateKey)

    return {
        address: wallet.address,
        privateKey,
        signer: wallet,
    }
}

/**
 * Check if a wallet exists in storage
 */
export function hasStoredWallet(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null
}

/**
 * Get stored wallet address (without unlocking)
 */
export function getStoredWalletAddress(): string | null {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const storedWallet: StoredWallet = JSON.parse(stored)
    return storedWallet.address
}

/**
 * Delete stored wallet (logout/reset)
 */
export function deleteWallet(): void {
    localStorage.removeItem(STORAGE_KEY)
}

/**
 * Export wallet as mnemonic (for backup)
 * Note: This requires the wallet to be created with mnemonic
 */
export function exportMnemonic(session: WalletSession): string | null {
    try {
        const wallet = ethers.Wallet.fromPhrase(session.privateKey)
        return wallet.mnemonic?.phrase || null
    } catch {
        return null
    }
}

/**
 * Network configurations
 */
export const NETWORKS = {
    raphaL2: {
        name: 'Rapha L2',
        rpcUrl: 'http://localhost:8545',
        chainId: 1337,
        symbol: 'ETH',
        explorer: ''
    },
    polygon: {
        name: 'Polygon Mainnet',
        rpcUrl: 'https://polygon-rpc.com',
        chainId: 137,
        symbol: 'MATIC',
        explorer: 'https://polygonscan.com'
    },
    amoy: {
        name: 'Polygon Amoy',
        rpcUrl: 'https://rpc-amoy.polygon.technology',
        chainId: 80002,
        symbol: 'MATIC',
        explorer: 'https://amoy.polygonscan.com'
    }
} as const

export type NetworkName = keyof typeof NETWORKS

/**
 * Get current network from env
 */
export function getCurrentNetwork(): typeof NETWORKS[NetworkName] {
    const activeNetwork = import.meta.env.VITE_ACTIVE_NETWORK || 'raphaL2'
    return NETWORKS[activeNetwork as NetworkName] || NETWORKS.raphaL2
}

/**
 * Connect wallet to a provider (for blockchain transactions)
 */
export function connectToProvider(
    session: WalletSession,
    networkName?: NetworkName
): ethers.Wallet | ethers.HDNodeWallet {
    const network = networkName ? NETWORKS[networkName] : getCurrentNetwork()
    const provider = new ethers.JsonRpcProvider(network.rpcUrl)
    return session.signer.connect(provider)
}

/**
 * Get provider without wallet (for read-only operations)
 */
export function getProvider(networkName?: NetworkName): ethers.JsonRpcProvider {
    const network = networkName ? NETWORKS[networkName] : getCurrentNetwork()
    return new ethers.JsonRpcProvider(network.rpcUrl)
}

/**
 * Switch MetaMask to Rapha L2 network
 */
export async function switchToRaphaL2(): Promise<void> {
    const win = window as any
    if (!win.ethereum) {
        throw new Error('MetaMask not installed')
    }

    const network = NETWORKS.raphaL2

    try {
        await win.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${network.chainId.toString(16)}` }],
        })
    } catch (error: any) {
        // Chain not added, add it
        if (error.code === 4902) {
            await win.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${network.chainId.toString(16)}`,
                    chainName: network.name,
                    nativeCurrency: {
                        name: 'Ether',
                        symbol: network.symbol,
                        decimals: 18
                    },
                    rpcUrls: [network.rpcUrl],
                }],
            })
        } else {
            throw error
        }
    }
}

