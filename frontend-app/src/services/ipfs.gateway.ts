/**
 * IPFS Gateway — Browser-side Pinata Integration
 * 
 * Lightweight wrapper around the Pinata API for client-side uploads.
 * Handles encrypted medical record ciphertext and JSON metadata.
 * 
 * NOTE: In production, the Pinata JWT should be proxied through a
 * backend API endpoint to avoid exposing it in the browser bundle.
 * For the MVP, credentials are loaded from environment variables.
 */

// ============================================================
// Types
// ============================================================

export interface IpfsUploadResult {
    /** IPFS Content Identifier (CID) — stored on-chain */
    cid: string;
    /** Size of uploaded content in bytes */
    size: number;
    /** Gateway URL for retrieval */
    gatewayUrl: string;
}

export interface RecordMetadata {
    /** Type of medical record (e.g., "MRI", "Blood") */
    recordType: string;
    /** Upload timestamp */
    timestamp: number;
    /** ZK-TLS verified origin provider */
    providerId?: string;
    /** Whether this record was verified via ZK-TLS */
    isOriginVerified?: boolean;
}

export interface IpfsGatewayConfig {
    /** Pinata JWT for authentication */
    jwt: string;
    /** Pinata gateway URL for retrieving content */
    gatewayUrl: string;
}

// ============================================================
// Constants
// ============================================================

const PINATA_UPLOAD_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

// ============================================================
// IpfsGateway Class
// ============================================================

export class IpfsGateway {
    private jwt: string;
    private gatewayUrl: string;

    constructor(config?: Partial<IpfsGatewayConfig>) {
        this.jwt = config?.jwt || import.meta.env.VITE_PINATA_JWT || '';
        this.gatewayUrl = config?.gatewayUrl
            || import.meta.env.VITE_PINATA_GATEWAY
            || 'https://gateway.pinata.cloud/ipfs';
    }

    // ============================================================
    // Upload Methods
    // ============================================================

    /**
     * Upload encrypted ciphertext to IPFS.
     * 
     * The ciphertext is Lit Protocol encrypted — a Uint8Array blob.
     * Pinata pins it and returns a CID that gets stored on the
     * MedicalRecordRegistry contract.
     * 
     * @param ciphertext — Encrypted data bytes
     * @param metadata — Record metadata for Pinata's metadata layer
     * @returns CID and gateway URL
     */
    async uploadEncrypted(
        ciphertext: Uint8Array | string,
        metadata: RecordMetadata
    ): Promise<IpfsUploadResult> {
        this.ensureConfigured();

        // Convert string ciphertext (base64) to bytes if needed
        const bytes = typeof ciphertext === 'string'
            ? new TextEncoder().encode(ciphertext)
            : ciphertext;

        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/octet-stream' });
        const fileName = `rapha-record-${metadata.recordType.toLowerCase()}-${metadata.timestamp}.enc`;
        const file = new File([blob], fileName);

        const formData = new FormData();
        formData.append('file', file);

        // Add Pinata metadata
        const pinataMetadata = JSON.stringify({
            name: fileName,
            keyvalues: {
                recordType: metadata.recordType,
                timestamp: String(metadata.timestamp),
                providerId: metadata.providerId || 'unknown',
                isOriginVerified: String(metadata.isOriginVerified || false),
                protocol: 'rapha',
            },
        });
        formData.append('pinataMetadata', pinataMetadata);

        // Pin options
        const pinataOptions = JSON.stringify({
            cidVersion: 1, // Use CIDv1 for better compatibility
        });
        formData.append('pinataOptions', pinataOptions);

        const response = await fetch(PINATA_UPLOAD_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.jwt}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new IpfsError(
                'UPLOAD_FAILED',
                `Pinata upload failed (${response.status}): ${errorBody}`
            );
        }

        const result = await response.json();
        const cid = result.IpfsHash;

        return {
            cid,
            size: bytes.length,
            gatewayUrl: `${this.gatewayUrl}/${cid}`,
        };
    }

    /**
     * Upload JSON metadata to IPFS.
     * Used for FHIR JSON-LD schemas (Module 4).
     */
    async uploadJSON(
        data: Record<string, unknown>,
        name?: string
    ): Promise<IpfsUploadResult> {
        this.ensureConfigured();

        const body = {
            pinataContent: data,
            pinataMetadata: {
                name: name || `rapha-metadata-${Date.now()}.json`,
                keyvalues: { protocol: 'rapha', type: 'metadata' },
            },
            pinataOptions: { cidVersion: 1 },
        };

        const response = await fetch(PINATA_JSON_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.jwt}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new IpfsError(
                'UPLOAD_FAILED',
                `Pinata JSON upload failed (${response.status}): ${errorBody}`
            );
        }

        const result = await response.json();
        const cid = result.IpfsHash;
        const jsonStr = JSON.stringify(data);

        return {
            cid,
            size: new TextEncoder().encode(jsonStr).length,
            gatewayUrl: `${this.gatewayUrl}/${cid}`,
        };
    }

    // ============================================================
    // Retrieval Methods
    // ============================================================

    /**
     * Fetch encrypted content from IPFS by CID.
     */
    async fetchEncrypted(cid: string): Promise<Uint8Array> {
        const response = await fetch(`${this.gatewayUrl}/${cid}`);

        if (!response.ok) {
            throw new IpfsError(
                'FETCH_FAILED',
                `Failed to fetch CID ${cid}: HTTP ${response.status}`
            );
        }

        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    }

    /**
     * Fetch JSON content from IPFS.
     */
    async fetchJSON<T = Record<string, unknown>>(cid: string): Promise<T> {
        const response = await fetch(`${this.gatewayUrl}/${cid}`);

        if (!response.ok) {
            throw new IpfsError(
                'FETCH_FAILED',
                `Failed to fetch JSON at CID ${cid}: HTTP ${response.status}`
            );
        }

        return response.json() as Promise<T>;
    }

    // ============================================================
    // Helpers
    // ============================================================

    /** Check if Pinata credentials are configured */
    isConfigured(): boolean {
        return !!this.jwt;
    }

    private ensureConfigured(): void {
        if (!this.jwt) {
            throw new IpfsError(
                'NOT_CONFIGURED',
                'Pinata JWT not configured. Set VITE_PINATA_JWT in your environment.'
            );
        }
    }
}

// ============================================================
// Error
// ============================================================

export type IpfsErrorCode = 'UPLOAD_FAILED' | 'FETCH_FAILED' | 'NOT_CONFIGURED';

export class IpfsError extends Error {
    code: IpfsErrorCode;

    constructor(code: IpfsErrorCode, message: string) {
        super(message);
        this.code = code;
        this.name = 'IpfsError';
    }
}

// ============================================================
// Singleton
// ============================================================

export const ipfsGateway = new IpfsGateway();
