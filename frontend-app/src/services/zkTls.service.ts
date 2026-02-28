/**
 * ZK-TLS Service — Reclaim Protocol Integration
 * 
 * Wraps @reclaimprotocol/js-sdk to generate ZK proofs of data origin. 
 * The SDK intercepts a TLS session with a healthcare provider (e.g. NHS),
 * generates a zero-knowledge proof that the data came from that domain,
 * and extracts specific JSON attributes without revealing the full response.
 * 
 * Architecture:
 *   1. Server-side: ProofRequest is initialized with app credentials
 *   2. Client-side: QR code / deep link presented to user
 *   3. User's device: Reclaim app intercepts TLS, generates proof
 *   4. Callback: Proof is delivered via session polling or webhook
 */

import { ethers } from 'ethers';

// ============================================================
// Types
// ============================================================

export interface ZkTlsConfig {
    /** Application ID from Reclaim Developer Portal */
    appId: string;
    /** Application Secret (used server-side for initialization) */
    appSecret: string;
    /** Provider ID — identifies the data source (e.g. NHS, Quest Diagnostics) */
    providerId: string;
}

/** Represents a verified claim extracted from a ZK-TLS proof */
export interface VerifiedClaim {
    /** keccak256 hash of the serialized proof — stored on-chain */
    proofHash: string;
    /** Data source domain (e.g. "nhs.uk") */
    providerId: string;
    /** Extracted JSON attributes from the HTTPS response */
    claimData: Record<string, unknown>;
    /** Full proof object for on-chain submission / audit */
    rawProof: ReclaimProof;
    /** When the proof was generated */
    timestamp: number;
}

/** Raw proof structure from Reclaim SDK */
export interface ReclaimProof {
    /** Unique proof identifier */
    identifier: string;
    /** Claim information */
    claimData: {
        provider: string;
        parameters: string;
        owner: string;
        timestampS: number;
        context: string;
        epoch: number;
    };
    /** Cryptographic signatures from Reclaim witnesses */
    signatures: string[];
    /** Witnesses who attested to the proof */
    witnesses: Array<{
        id: string;
        url: string;
    }>;
}

/** Active proof session state */
export interface ProofSession {
    /** URL for QR code display or deep link */
    requestUrl: string;
    /** URL for polling session status */
    statusUrl: string;
    /** Session identifier */
    sessionId: string;
}

/** Supported healthcare providers */
export interface HealthcareProvider {
    id: string;
    name: string;
    domain: string;
    icon: string;
    providerId: string;
    /** Which JSON attributes to extract from the TLS response */
    extractFields: string[];
}

// ============================================================
// Provider Registry
// ============================================================

/**
 * Registry of supported healthcare data providers.
 * Each entry maps to a configured Reclaim Protocol provider.
 * 
 * NOTE: Provider IDs must be registered on the Reclaim Developer Portal.
 * The providerId values below are placeholders — replace with actual
 * registered provider IDs from https://dev.reclaimprotocol.org
 */
export const HEALTHCARE_PROVIDERS: HealthcareProvider[] = [
    {
        id: 'nhs',
        name: 'NHS (UK)',
        domain: 'nhs.uk',
        icon: '🏥',
        providerId: process.env.VITE_RECLAIM_NHS_PROVIDER_ID || 'nhs-patient-portal',
        extractFields: ['blood_type', 'latest_diagnosis', 'medications', 'allergies'],
    },
    {
        id: 'quest',
        name: 'Quest Diagnostics',
        domain: 'questdiagnostics.com',
        icon: '🧪',
        providerId: process.env.VITE_RECLAIM_QUEST_PROVIDER_ID || 'quest-lab-results',
        extractFields: ['test_name', 'result_value', 'reference_range', 'date'],
    },
    {
        id: 'mychart',
        name: 'MyChart (Epic)',
        domain: 'mychart.com',
        icon: '📋',
        providerId: process.env.VITE_RECLAIM_MYCHART_PROVIDER_ID || 'mychart-health-summary',
        extractFields: ['conditions', 'vitals', 'lab_results', 'immunizations'],
    },
    {
        id: 'medicare',
        name: 'Medicare (AU)',
        domain: 'my.gov.au',
        icon: '🦘',
        providerId: process.env.VITE_RECLAIM_MEDICARE_PROVIDER_ID || 'medicare-claims',
        extractFields: ['claim_type', 'service_date', 'provider_name', 'benefit_amount'],
    },
];

// ============================================================
// Configuration
// ============================================================

/**
 * Default ZK-TLS configuration.
 * In production, these values come from environment variables
 * set in the Vercel dashboard or .env.local file.
 */
const DEFAULT_CONFIG: ZkTlsConfig = {
    appId: import.meta.env.VITE_RECLAIM_APP_ID || '',
    appSecret: import.meta.env.VITE_RECLAIM_APP_SECRET || '',
    providerId: '', // Set per-request based on selected provider
};

// ============================================================
// ZkTlsService
// ============================================================

export class ZkTlsService {
    private config: ZkTlsConfig;

    constructor(config: Partial<ZkTlsConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Create a new proof request session.
     *
     * Initializes the Reclaim SDK ProofRequest, builds the verification
     * session, and returns URLs for QR code display and status polling.
     *
     * @param providerId — The Reclaim provider ID for the target data source
     * @returns ProofSession with requestUrl and statusUrl
     */
    async createProofRequest(providerId: string): Promise<ProofSession> {
        // Dynamically import to avoid SSR issues
        const { ReclaimProofRequest } = await import('@reclaimprotocol/js-sdk');

        if (!this.config.appId || !this.config.appSecret) {
            throw new ZkTlsError(
                'MISSING_CREDENTIALS',
                'Reclaim Protocol APP_ID and APP_SECRET are required. ' +
                'Set VITE_RECLAIM_APP_ID and VITE_RECLAIM_APP_SECRET in your environment.'
            );
        }

        try {
            // Initialize the proof request with app credentials and target provider
            const proofRequest = await ReclaimProofRequest.init(
                this.config.appId,
                this.config.appSecret,
                providerId
            );

            // Build the request — generates the verification URL
            const requestUrl = await proofRequest.getRequestUrl();
            const statusUrl = proofRequest.getStatusUrl();

            // Extract session ID from the status URL
            const sessionId = this.extractSessionId(statusUrl);

            return {
                requestUrl,
                statusUrl,
                sessionId,
            };
        } catch (error) {
            throw new ZkTlsError(
                'SESSION_CREATION_FAILED',
                `Failed to create proof request: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Start listening for proof completion via the SDK's session mechanism.
     *
     * This sets up the onSuccess/onFailure callbacks that the Reclaim SDK
     * invokes when the user completes (or fails) the verification flow.
     *
     * @param providerId — The provider ID used to create the session
     * @param onSuccess — Called with the completed proof
     * @param onFailure — Called with an error
     * @returns Cleanup function to stop listening
     */
    async startSession(
        providerId: string,
        onSuccess: (proof: ReclaimProof) => void,
        onFailure: (error: Error) => void
    ): Promise<{ requestUrl: string; stopListening: () => void }> {
        const { ReclaimProofRequest } = await import('@reclaimprotocol/js-sdk');

        const proofRequest = await ReclaimProofRequest.init(
            this.config.appId,
            this.config.appSecret,
            providerId
        );

        const requestUrl = await proofRequest.getRequestUrl();

        let stopped = false;

        // Start the session — SDK handles polling internally
        await proofRequest.startSession({
            onSuccess: (proofData: unknown) => {
                if (stopped) return;
                try {
                    const proof = this.parseProofData(proofData);
                    onSuccess(proof);
                } catch (e) {
                    onFailure(e instanceof Error ? e : new Error('Proof parsing failed'));
                }
            },
            onError: (error: unknown) => {
                if (stopped) return;
                onFailure(error instanceof Error ? error : new Error(String(error)));
            }
        });

        return {
            requestUrl,
            stopListening: () => { stopped = true; },
        };
    }

    /**
     * Extract and validate a VerifiedClaim from a raw Reclaim proof.
     *
     * This is the critical security boundary — we verify the proof structure,
     * extract the claimed data attributes, and compute the proof hash that
     * gets stored on-chain via submitVerifiedData().
     */
    extractVerifiedClaim(proof: ReclaimProof, providerDomain: string): VerifiedClaim {
        // Validate proof structure
        if (!proof.claimData || !proof.signatures || proof.signatures.length === 0) {
            throw new ZkTlsError('INVALID_PROOF', 'Proof is missing required fields');
        }

        // Parse the parameters string — contains the extracted JSON attributes
        let claimData: Record<string, unknown>;
        try {
            claimData = JSON.parse(proof.claimData.parameters);
        } catch {
            // If parameters isn't valid JSON, wrap it
            claimData = { raw: proof.claimData.parameters };
        }

        // Compute deterministic proof hash for on-chain storage
        const proofHash = ethers.keccak256(
            ethers.toUtf8Bytes(JSON.stringify({
                identifier: proof.identifier,
                claimData: proof.claimData,
                signatures: proof.signatures,
            }))
        );

        return {
            proofHash,
            providerId: providerDomain,
            claimData,
            rawProof: proof,
            timestamp: proof.claimData.timestampS || Math.floor(Date.now() / 1000),
        };
    }

    /**
     * Look up a healthcare provider by its ID.
     */
    getProvider(providerId: string): HealthcareProvider | undefined {
        return HEALTHCARE_PROVIDERS.find(p => p.id === providerId);
    }

    /**
     * Check if the service has valid credentials configured.
     */
    isConfigured(): boolean {
        return !!(this.config.appId && this.config.appSecret);
    }

    // ============================================================
    // Private helpers
    // ============================================================

    private extractSessionId(statusUrl: string): string {
        try {
            const url = new URL(statusUrl);
            return url.pathname.split('/').pop() || `session-${Date.now()}`;
        } catch {
            return `session-${Date.now()}`;
        }
    }

    private parseProofData(data: unknown): ReclaimProof {
        // The SDK may return the proof in different formats
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                // Could be an array of proofs or a single proof
                return Array.isArray(parsed) ? parsed[0] : parsed;
            } catch {
                throw new ZkTlsError('PARSE_ERROR', 'Failed to parse proof data string');
            }
        }

        if (Array.isArray(data)) {
            if (data.length === 0) throw new ZkTlsError('EMPTY_PROOF', 'No proofs in response');
            return data[0] as ReclaimProof;
        }

        return data as ReclaimProof;
    }
}

// ============================================================
// Error class
// ============================================================

export type ZkTlsErrorCode =
    | 'MISSING_CREDENTIALS'
    | 'SESSION_CREATION_FAILED'
    | 'INVALID_PROOF'
    | 'PARSE_ERROR'
    | 'EMPTY_PROOF'
    | 'TIMEOUT';

export class ZkTlsError extends Error {
    code: ZkTlsErrorCode;

    constructor(code: ZkTlsErrorCode, message: string) {
        super(message);
        this.code = code;
        this.name = 'ZkTlsError';
    }
}

// ============================================================
// Singleton export
// ============================================================

export const zkTlsService = new ZkTlsService();
