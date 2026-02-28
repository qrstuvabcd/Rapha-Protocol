/**
 * Agent B (The Cryptographer) - AES-256-GCM Encryption Service
 * 
 * Handles symmetric encryption of medical files before uploading to IPFS.
 * The AES key is then encrypted via TACo for access control.
 */

import { webcrypto } from 'crypto';

const crypto = webcrypto as unknown as Crypto;

export interface EncryptedPayload {
    /** Base64-encoded encrypted data */
    ciphertext: string;
    /** Base64-encoded initialization vector (12 bytes) */
    iv: string;
    /** Base64-encoded authentication tag (16 bytes) */
    authTag: string;
}

export interface AESKey {
    /** Raw key bytes for TACo encryption */
    raw: Uint8Array;
    /** CryptoKey object for Web Crypto API */
    cryptoKey: CryptoKey;
}

/**
 * Generate a random AES-256-GCM key
 * @returns AES key with both raw bytes and CryptoKey object
 */
export async function generateAESKey(): Promise<AESKey> {
    const cryptoKey = await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true, // extractable
        ['encrypt', 'decrypt']
    );

    const rawKey = await crypto.subtle.exportKey('raw', cryptoKey);

    return {
        raw: new Uint8Array(rawKey),
        cryptoKey,
    };
}

/**
 * Reconstruct AESKey from raw bytes
 * @param rawBytes - 32-byte AES key
 */
export async function importAESKey(rawBytes: Uint8Array): Promise<AESKey> {
    if (rawBytes.length !== 32) {
        throw new Error('AES-256 key must be 32 bytes');
    }

    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        rawBytes,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    return {
        raw: rawBytes,
        cryptoKey,
    };
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - Data to encrypt (Uint8Array or string)
 * @param key - AES key
 * @returns Encrypted payload with ciphertext, IV, and auth tag
 */
export async function encryptFile(
    data: Uint8Array | string,
    key: AESKey
): Promise<EncryptedPayload> {
    // Convert string to Uint8Array if needed
    const plaintext = typeof data === 'string'
        ? new TextEncoder().encode(data)
        : data;

    // Generate random 12-byte IV (recommended for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt with AES-GCM (includes authentication)
    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv,
            tagLength: 128, // 16 bytes
        },
        key.cryptoKey,
        plaintext
    );

    // AES-GCM appends the auth tag to the ciphertext
    const encrypted = new Uint8Array(encryptedBuffer);
    const ciphertext = encrypted.slice(0, -16);
    const authTag = encrypted.slice(-16);

    return {
        ciphertext: uint8ArrayToBase64(ciphertext),
        iv: uint8ArrayToBase64(iv),
        authTag: uint8ArrayToBase64(authTag),
    };
}

/**
 * Decrypt data using AES-256-GCM
 * @param payload - Encrypted payload
 * @param key - AES key
 * @returns Decrypted data as Uint8Array
 */
export async function decryptFile(
    payload: EncryptedPayload,
    key: AESKey
): Promise<Uint8Array> {
    const ciphertext = base64ToUint8Array(payload.ciphertext);
    const iv = base64ToUint8Array(payload.iv);
    const authTag = base64ToUint8Array(payload.authTag);

    // Reconstruct the combined ciphertext + authTag
    const combined = new Uint8Array(ciphertext.length + authTag.length);
    combined.set(ciphertext);
    combined.set(authTag, ciphertext.length);

    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv,
                tagLength: 128,
            },
            key.cryptoKey,
            combined
        );

        return new Uint8Array(decryptedBuffer);
    } catch (error) {
        throw new Error('Decryption failed: invalid key or corrupted data');
    }
}

/**
 * Compute SHA-256 hash of data (for integrityHash field)
 * @param data - Data to hash
 * @returns Hex-encoded hash
 */
export async function computeIntegrityHash(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return uint8ArrayToHex(hashArray);
}

// === Utility functions ===

function uint8ArrayToBase64(bytes: Uint8Array): string {
    const binary = String.fromCharCode(...bytes);
    return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export { uint8ArrayToBase64, base64ToUint8Array, uint8ArrayToHex };
