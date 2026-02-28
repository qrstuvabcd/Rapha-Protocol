/**
 * Key Management Service
 * 
 * Handles wallet/key operations for Aura Health.
 * Integrates with ethers.js for Ethereum key management.
 */

import { ethers, Wallet, HDNodeWallet } from 'ethers';

export interface KeyPair {
    address: string;
    privateKey: string;
    publicKey: string;
}

/**
 * Generate a new random Ethereum wallet
 */
export function generateWallet(): KeyPair {
    const wallet = Wallet.createRandom();

    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.signingKey.publicKey,
    };
}

/**
 * Generate a deterministic wallet from a mnemonic phrase
 * @param mnemonic - BIP-39 mnemonic phrase
 * @param path - Derivation path (default: m/44'/60'/0'/0/0)
 */
export function walletFromMnemonic(
    mnemonic: string,
    path: string = "m/44'/60'/0'/0/0"
): KeyPair {
    const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, path);

    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.signingKey.publicKey,
    };
}

/**
 * Reconstruct a wallet from a private key
 * @param privateKey - Hex-encoded private key
 */
export function walletFromPrivateKey(privateKey: string): KeyPair {
    const wallet = new Wallet(privateKey);

    return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        publicKey: wallet.signingKey.publicKey,
    };
}

/**
 * Generate a new BIP-39 mnemonic phrase
 * @param wordCount - 12, 15, 18, 21, or 24 words
 */
export function generateMnemonic(wordCount: 12 | 15 | 18 | 21 | 24 = 12): string {
    const entropyBits = {
        12: 128,
        15: 160,
        18: 192,
        21: 224,
        24: 256,
    };

    return Wallet.createRandom().mnemonic?.phrase ??
        ethers.Mnemonic.fromEntropy(
            ethers.randomBytes(entropyBits[wordCount] / 8)
        ).phrase;
}

/**
 * Sign a message with a wallet
 * @param wallet - Wallet to sign with
 * @param message - Message to sign
 */
export async function signMessage(
    wallet: Wallet,
    message: string
): Promise<string> {
    return wallet.signMessage(message);
}

/**
 * Verify a signed message
 * @param message - Original message
 * @param signature - Signature to verify
 * @returns The address that signed the message
 */
export function verifyMessage(
    message: string,
    signature: string
): string {
    return ethers.verifyMessage(message, signature);
}

/**
 * Derive multiple accounts from a mnemonic
 * @param mnemonic - BIP-39 mnemonic phrase
 * @param count - Number of accounts to derive
 */
export function deriveAccounts(
    mnemonic: string,
    count: number = 5
): KeyPair[] {
    const accounts: KeyPair[] = [];

    for (let i = 0; i < count; i++) {
        const path = `m/44'/60'/0'/0/${i}`;
        accounts.push(walletFromMnemonic(mnemonic, path));
    }

    return accounts;
}
