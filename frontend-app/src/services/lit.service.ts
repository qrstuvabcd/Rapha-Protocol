/**
 * PrivacyLayer — Lit Protocol v7 (Naga) Integration
 * 
 * Identity-based encryption with Access Control Conditions (ACC).
 * Replaces mock AES + TACo with real Lit Protocol threshold encryption.
 * 
 * Architecture:
 *   - Encryption is client-side (no Lit nodes involved during encrypt)
 *   - Decryption requires Lit node swarm to validate ACC and release key shares
 *   - ACC checks on-chain state: patient wallet OR authorized keeper
 * 
 * Security model:
 *   Patient data is encrypted such that ONLY:
 *     1. The patient's own wallet can decrypt, OR
 *     2. An address registered as authorizedKeeper in MedicalRecordRegistry
 *   
 *   Lit nodes independently verify these conditions on Polygon before
 *   releasing their shares of the decryption key.
 */

import { ethers } from 'ethers';

// Extend Window for wallet provider
declare global {
    interface Window {
        ethereum?: any;
    }
}

// ============================================================
// Types (mirrors @lit-protocol/types without tight coupling)
// ============================================================

/** Unified Access Control Condition for Lit Protocol */
export interface UnifiedAccessControlCondition {
    conditionType: string;
    contractAddress?: string;
    chain: string;
    method?: string;
    parameters?: string[];
    returnValueTest?: {
        comparator: string;
        value: string;
    };
    standardContractType?: string;
    functionName?: string;
    functionParams?: string[];
    functionAbi?: AbiEntry[];
}

/** Boolean operator for combining ACC */
export interface AccOperator {
    operator: 'and' | 'or';
}

/** ABI entry for contract call conditions */
interface AbiEntry {
    name: string;
    type: string;
    stateMutability?: string;
    inputs: Array<{ name: string; type: string; internalType?: string }>;
    outputs: Array<{ name: string; type: string; internalType?: string }>;
}

/** Result from encrypt operation */
export interface EncryptedPayload {
    /** Base64-encoded ciphertext */
    ciphertext: string;
    /** Hash of the data that was encrypted (needed for decrypt) */
    dataToEncryptHash: string;
    /** The ACC used — must be stored alongside ciphertext */
    accessControlConditions: Array<UnifiedAccessControlCondition | AccOperator>;
}

/** Configuration for the PrivacyLayer */
export interface PrivacyLayerConfig {
    /** Polygon chain identifier for Lit */
    chain: string;
    /** Lit Protocol network */
    litNetwork: string;
    /** MedicalRecordRegistry contract address */
    registryAddress: string;
}

// ============================================================
// Constants
// ============================================================

const DEFAULT_CONFIG: PrivacyLayerConfig = {
    chain: 'polygon',
    litNetwork: 'naga',
    registryAddress: import.meta.env.VITE_REGISTRY_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
};

/** ABI fragment for the authorizedKeepers(address) view function */
const AUTHORIZED_KEEPERS_ABI: AbiEntry = {
    name: 'authorizedKeepers',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
};

// ============================================================
// PrivacyLayer Class
// ============================================================

export class PrivacyLayer {
    private config: PrivacyLayerConfig;
    private litNodeClient: any = null; // LitNodeClient instance (dynamically imported)
    private initialized = false;

    constructor(config: Partial<PrivacyLayerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // ============================================================
    // Lifecycle
    // ============================================================

    /**
     * Connect to the Lit Naga network.
     * Must be called before encrypt/decrypt operations.
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Dynamic import to avoid SSR issues and reduce bundle size
            const { LitNodeClient } = await import('@lit-protocol/lit-node-client');

            this.litNodeClient = new LitNodeClient({
                litNetwork: this.config.litNetwork as any,
                debug: import.meta.env.DEV,
            });

            await this.litNodeClient.connect();
            this.initialized = true;
            console.log(`[PrivacyLayer] Connected to Lit ${this.config.litNetwork} network`);
        } catch (error) {
            throw new PrivacyLayerError(
                'INIT_FAILED',
                `Failed to connect to Lit ${this.config.litNetwork}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Disconnect from the Lit network and free resources.
     */
    async disconnect(): Promise<void> {
        if (this.litNodeClient) {
            await this.litNodeClient.disconnect();
            this.litNodeClient = null;
            this.initialized = false;
            console.log('[PrivacyLayer] Disconnected from Lit network');
        }
    }

    // ============================================================
    // Access Control Conditions
    // ============================================================

    /**
     * Build the Medical Data ACC.
     * 
     * Decryption is permitted if:
     *   - msg.sender == patientAddress (the data owner), OR
     *   - authorizedKeepers(msg.sender) == true (on-chain keeper check)
     * 
     * This means Lit nodes will call the MedicalRecordRegistry contract
     * on Polygon to verify keeper status before releasing decryption shares.
     */
    buildMedicalACC(
        patientAddress: string,
        registryAddress?: string
    ): Array<UnifiedAccessControlCondition | AccOperator> {
        const registry = registryAddress || this.config.registryAddress;

        return [
            // Condition 1: Is the requester the patient (data owner)?
            {
                conditionType: 'evmBasic',
                contractAddress: '',
                standardContractType: '',
                chain: this.config.chain,
                method: '',
                parameters: [':userAddress'],
                returnValueTest: {
                    comparator: '=',
                    value: patientAddress.toLowerCase(),
                },
            },
            // Boolean OR
            { operator: 'or' },
            // Condition 2: Is the requester an authorized keeper?
            // Lit nodes call MedicalRecordRegistry.authorizedKeepers(address) on-chain
            {
                conditionType: 'evmContract',
                contractAddress: registry,
                chain: this.config.chain,
                functionName: 'authorizedKeepers',
                functionParams: [':userAddress'],
                functionAbi: [AUTHORIZED_KEEPERS_ABI],
                returnValueTest: {
                    comparator: '=',
                    value: 'true',
                },
            },
        ];
    }

    // ============================================================
    // Encryption (client-side, no Lit nodes needed)
    // ============================================================

    /**
     * Encrypt data with Lit Protocol using the specified ACC.
     * 
     * This is a CLIENT-SIDE operation — Lit nodes are NOT contacted.
     * The data is encrypted with a symmetric key that is then split
     * across the Lit node network. Only entities meeting the ACC
     * can reassemble the key to decrypt.
     * 
     * @param data — Raw bytes to encrypt (medical record payload)
     * @param acc — Access Control Conditions
     * @returns EncryptedPayload with ciphertext and metadata
     */
    async encrypt(
        data: Uint8Array,
        acc: Array<UnifiedAccessControlCondition | AccOperator>
    ): Promise<EncryptedPayload> {
        this.ensureInitialized();

        try {
            const { encryptUint8Array } = await import('@lit-protocol/encryption');

            const { ciphertext, dataToEncryptHash } = await encryptUint8Array(
                {
                    unifiedAccessControlConditions: acc as any,
                    dataToEncrypt: data,
                },
                this.litNodeClient
            );

            return {
                ciphertext,
                dataToEncryptHash,
                accessControlConditions: acc,
            };
        } catch (error) {
            throw new PrivacyLayerError(
                'ENCRYPT_FAILED',
                `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Convenience: encrypt a string (e.g. JSON payload).
     */
    async encryptString(
        plaintext: string,
        acc: Array<UnifiedAccessControlCondition | AccOperator>
    ): Promise<EncryptedPayload> {
        const encoder = new TextEncoder();
        return this.encrypt(encoder.encode(plaintext), acc);
    }

    // ============================================================
    // Decryption (requires Lit node swarm validation)
    // ============================================================

    /**
     * Decrypt data via Lit Protocol threshold decryption.
     * 
     * This contacts the Lit node swarm, which:
     *   1. Evaluates the ACC against on-chain state (Polygon)
     *   2. If conditions met, each node releases its key share
     *   3. Client reassembles the full decryption key
     *   4. Data is decrypted locally
     * 
     * Requires an active wallet session (user must sign a SIWE message).
     * 
     * @param ciphertext — Base64-encoded encrypted data
     * @param dataToEncryptHash — Hash from the encrypt step
     * @param acc — Same ACC used during encryption
     * @returns Decrypted bytes
     */
    async decrypt(
        ciphertext: string,
        dataToEncryptHash: string,
        acc: Array<UnifiedAccessControlCondition | AccOperator>
    ): Promise<Uint8Array> {
        this.ensureInitialized();

        try {
            const { decryptToUint8Array } = await import('@lit-protocol/encryption');

            // Get session signatures — user proves identity via wallet
            const sessionSigs = await this.getSessionSignatures();

            const decryptedBytes = await decryptToUint8Array(
                {
                    unifiedAccessControlConditions: acc as any,
                    ciphertext,
                    dataToEncryptHash,
                    sessionSigs,
                    chain: this.config.chain,
                },
                this.litNodeClient
            );

            return decryptedBytes;
        } catch (error) {
            throw new PrivacyLayerError(
                'DECRYPT_FAILED',
                `Decryption failed — ACC conditions may not be met: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    /**
     * Convenience: decrypt to string.
     */
    async decryptToString(
        ciphertext: string,
        dataToEncryptHash: string,
        acc: Array<UnifiedAccessControlCondition | AccOperator>
    ): Promise<string> {
        const bytes = await this.decrypt(ciphertext, dataToEncryptHash, acc);
        return new TextDecoder().decode(bytes);
    }

    // ============================================================
    // Session Management
    // ============================================================

    /**
     * Get Lit session signatures via wallet SIWE (Sign-In With Ethereum).
     * 
     * The user signs a message proving they own the wallet.
     * Lit nodes use this signature to verify identity before
     * evaluating ACC and releasing key shares.
     */
    private async getSessionSignatures(): Promise<any> {
        this.ensureInitialized();

        try {
            // Get the browser wallet provider
            if (!window.ethereum) {
                throw new Error('No wallet detected. Please install MetaMask or similar.');
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();

            // Generate auth signature using EIP-4361 (SIWE)
            // Lit SDK v8 uses LIT_ABILITY and LIT_RESOURCE_PREFIX enums
            const { LIT_ABILITY } = await import('@lit-protocol/constants');

            const sessionSigs = await this.litNodeClient.getSessionSigs({
                chain: this.config.chain,
                expiration: new Date(Date.now() + 1000 * 60 * 60).toISOString(), // 1 hour
                resourceAbilityRequests: [
                    {
                        resource: { resource: '*', resourcePrefix: 'lit-litaction' },
                        ability: LIT_ABILITY.AccessControlConditionDecryption,
                    },
                ],
                authNeededCallback: async (params: any) => {
                    const message = params.statement || `Lit Protocol Authentication - ${address}`;
                    const signature = await signer.signMessage(message);

                    return {
                        sig: signature,
                        derivedVia: 'web3.eth.personal.sign',
                        signedMessage: message,
                        address: address,
                    };
                },
            });

            return sessionSigs;
        } catch (error) {
            throw new PrivacyLayerError(
                'SESSION_FAILED',
                `Failed to create Lit session: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }

    // ============================================================
    // Helpers
    // ============================================================

    private ensureInitialized(): void {
        if (!this.initialized || !this.litNodeClient) {
            throw new PrivacyLayerError(
                'NOT_INITIALIZED',
                'PrivacyLayer not initialized. Call initialize() first.'
            );
        }
    }

    /** Check if the layer is connected and ready */
    isReady(): boolean {
        return this.initialized && this.litNodeClient !== null;
    }

    /**
     * Compute the conditionId (keccak256 of ACC) for on-chain storage.
     * This is stored in the MedicalRecordRegistry as the conditionId field.
     */
    computeConditionId(
        acc: Array<UnifiedAccessControlCondition | AccOperator>
    ): string {
        return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(acc)));
    }
}

// ============================================================
// Error Class
// ============================================================

export type PrivacyLayerErrorCode =
    | 'INIT_FAILED'
    | 'NOT_INITIALIZED'
    | 'ENCRYPT_FAILED'
    | 'DECRYPT_FAILED'
    | 'SESSION_FAILED';

export class PrivacyLayerError extends Error {
    code: PrivacyLayerErrorCode;

    constructor(code: PrivacyLayerErrorCode, message: string) {
        super(message);
        this.code = code;
        this.name = 'PrivacyLayerError';
    }
}

// ============================================================
// Singleton
// ============================================================

export const privacyLayer = new PrivacyLayer();
