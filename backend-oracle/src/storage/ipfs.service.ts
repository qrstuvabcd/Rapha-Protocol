/**
 * IPFS Service - Pinata Integration
 * 
 * Handles uploading encrypted medical records to IPFS via Pinata.
 * Returns Content Identifiers (CIDs) for blockchain storage.
 */

import { PinataSDK } from 'pinata';

export interface IPFSUploadResult {
    /** IPFS Content Identifier (CID) */
    cid: string;
    /** Size in bytes */
    size: number;
    /** Pinata gateway URL */
    gatewayUrl: string;
}

export interface IPFSServiceConfig {
    /** Pinata JWT Token */
    pinataJwt: string;
    /** Pinata Gateway URL */
    gateway?: string;
}

/**
 * IPFS Service using Pinata for pinning
 */
export class IPFSService {
    private pinata: PinataSDK;
    private gateway: string;

    constructor(config: IPFSServiceConfig) {
        this.pinata = new PinataSDK({
            pinataJwt: config.pinataJwt,
            pinataGateway: config.gateway,
        });
        this.gateway = config.gateway || 'https://gateway.pinata.cloud/ipfs';
    }

    /**
     * Upload encrypted data to IPFS
     * 
     * @param data - Encrypted data as Uint8Array or Buffer
     * @param filename - Optional filename for the content
     * @returns Upload result with CID and gateway URL
     */
    async uploadEncryptedData(
        data: Uint8Array | Buffer,
        filename: string = 'encrypted-record.bin'
    ): Promise<IPFSUploadResult> {
        try {
            // Convert to Blob for upload
            const blob = new Blob([data], { type: 'application/octet-stream' });
            const file = new File([blob], filename);

            const result = await this.pinata.upload.file(file);

            return {
                cid: result.cid,
                size: data.length,
                gatewayUrl: `${this.gateway}/${result.cid}`,
            };
        } catch (error) {
            throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Upload JSON metadata to IPFS
     * 
     * @param data - JSON-serializable object
     */
    async uploadJSON(
        data: Record<string, unknown>
    ): Promise<IPFSUploadResult> {
        try {
            const result = await this.pinata.upload.json(data);

            return {
                cid: result.cid,
                size: JSON.stringify(data).length,
                gatewayUrl: `${this.gateway}/${result.cid}`,
            };
        } catch (error) {
            throw new Error(`IPFS JSON upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Fetch content from IPFS by CID
     */
    async fetchContent(cid: string): Promise<Uint8Array> {
        try {
            const response = await fetch(`${this.gateway}/${cid}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();
            return new Uint8Array(buffer);
        } catch (error) {
            throw new Error(`IPFS fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Fetch JSON content from IPFS
     */
    async fetchJSON<T = Record<string, unknown>>(cid: string): Promise<T> {
        try {
            const response = await fetch(`${this.gateway}/${cid}`);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json() as T;
        } catch (error) {
            throw new Error(`IPFS JSON fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Check if content exists on IPFS
     */
    async contentExists(cid: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.gateway}/${cid}`, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    /**
     * Unpin content from Pinata
     * @param cid - Content Identifier to unpin
     */
    async unpinContent(cid: string): Promise<void> {
        try {
            await this.pinata.files.delete([cid]);
        } catch (error) {
            throw new Error(`IPFS unpin failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

/**
 * Create IPFS service from environment variables
 */
export function createIPFSServiceFromEnv(): IPFSService {
    const pinataJwt = process.env.PINATA_JWT;

    if (!pinataJwt) {
        throw new Error(
            'Missing Pinata JWT. Set PINATA_JWT environment variable.'
        );
    }

    return new IPFSService({
        pinataJwt,
        gateway: process.env.PINATA_GATEWAY,
    });
}
