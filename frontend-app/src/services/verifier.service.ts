/**
 * Keeper Service — Production Verifier Logic
 * 
 * Replaces localStorage-based mocks with:
 *   - On-chain keeper authorization check
 *   - Lit Protocol threshold decryption for data reveal
 *   - Smart contract calls for quality verification + Data UBI
 * 
 * Architecture:
 *   1. Keeper connects wallet → service checks authorizedKeepers(address) on-chain
 *   2. Queue: fetches unreviewed records from MedicalRecordRegistry
 *   3. Review: Lit SDK validates keeper ACC → decrypts ciphertext from IPFS
 *   4. Approve: calls finalizeRecord(recordId, tags) → sends UBI to patient
 *   5. Reject: calls flagLowQuality(recordId) → deactivates record
 */

import { ethers } from 'ethers';
import { privacyLayer } from './lit.service';
import { ipfsGateway } from './ipfs.gateway';

// Extend Window for wallet provider
declare global {
    interface Window {
        ethereum?: any;
    }
}

// ============================================================
// Types
// ============================================================

export interface PendingRecord {
    recordId: string;
    owner: string;
    ipfsHash: string;
    integrityHash: string;
    recordType: string;
    provider: string;
    providerId: string;
    proofHash: string;
    timestamp: number;
}

export interface KeeperStats {
    totalReviewed: number;
    totalApproved: number;
    totalRejected: number;
    queueSize: number;
    isAuthorized: boolean;
}

export interface DecryptedReviewData {
    /** Decrypted file content as ArrayBuffer */
    fileContent: ArrayBuffer | null;
    /** Decrypted metadata */
    metadata: Record<string, unknown>;
    /** Whether decryption was successful */
    success: boolean;
    /** Error message if decryption failed */
    error?: string;
}

// ============================================================
// Contract Configuration
// ============================================================

const REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS
    || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const REGISTRY_ABI = [
    // Read functions
    'function authorizedKeepers(address) external view returns (bool)',
    'function getUnreviewedRecords(address patient) external view returns (bytes32[] memory)',
    'function getRecord(bytes32 recordId) external view returns (tuple(address owner, string ipfsHash, string integrityHash, string recordType, address provider, bytes32 conditionId, uint256 timestamp, bool isActive, bool isOriginVerified, string providerId, bytes32 proofHash, bool isQualityChecked, string qualityTags, address keeperAddress))',
    'function getPatientRecords(address patient) external view returns (bytes32[] memory)',
    'function records(bytes32) external view returns (address owner, string ipfsHash, string integrityHash, string recordType, address provider, bytes32 conditionId, uint256 timestamp, bool isActive, bool isOriginVerified, string providerId, bytes32 proofHash, bool isQualityChecked, string qualityTags, address keeperAddress)',

    // Write functions
    'function verifyQuality(bytes32 recordId, string tags) external',
    'function flagLowQuality(bytes32 recordId) external',
    'function finalizeRecord(bytes32 recordId, string tags) external payable',

    // Events
    'event QualityVerified(bytes32 indexed recordId, address indexed keeper, string tags)',
    'event LowQualityFlagged(bytes32 indexed recordId, address indexed keeper)',
    'event DataUBIReleased(bytes32 indexed recordId, address indexed patient, uint256 amount)',
];

/** Default Data UBI amount in MATIC (0.01 MATIC for MVP) */
const DEFAULT_UBI_AMOUNT = ethers.parseEther('0.01');

// ============================================================
// KeeperService Class
// ============================================================

export class KeeperService {
    private provider: ethers.Provider | null = null;
    private signer: ethers.Signer | null = null;
    private registry: ethers.Contract | null = null;

    // ============================================================
    // Initialization
    // ============================================================

    /**
     * Connect to the blockchain via the user's wallet.
     */
    async connect(): Promise<void> {
        if (!window.ethereum) {
            throw new KeeperError('NO_WALLET', 'No wallet detected. Install MetaMask.');
        }

        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await (this.provider as ethers.BrowserProvider).getSigner();
        this.registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, this.signer);
    }

    private ensureConnected(): ethers.Contract {
        if (!this.registry || !this.signer) {
            throw new KeeperError('NOT_CONNECTED', 'Call connect() first.');
        }
        return this.registry;
    }

    // ============================================================
    // Authorization
    // ============================================================

    /**
     * Check if an address is an authorized keeper via on-chain call.
     * 
     * Calls MedicalRecordRegistry.authorizedKeepers(address) on Polygon.
     * This replaces the hardcoded whitelist from the MVP.
     */
    async isAuthorizedKeeper(address: string): Promise<boolean> {
        try {
            const registry = this.ensureConnected();
            const isKeeper: boolean = await registry.authorizedKeepers(address);
            return isKeeper;
        } catch (error) {
            console.error('[KeeperService] Authorization check failed:', error);
            return false;
        }
    }

    // ============================================================
    // Verification Queue
    // ============================================================

    /**
     * Fetch all unreviewed records across all registered patients.
     * 
     * NOTE: In production, this would query an indexer (The Graph / Goldsky)
     * for VerifiedDataSubmitted events where isQualityChecked == false.
     * For the MVP, we iterate over known patient addresses from events.
     */
    async getVerificationQueue(): Promise<PendingRecord[]> {
        const registry = this.ensureConnected();

        try {
            // Query VerifiedDataSubmitted events from the last ~1 week
            const filter = registry.filters.RecordRegistered?.();
            const currentBlock = await this.provider!.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 50000); // ~1 week on Polygon

            let events: ethers.Log[] = [];
            try {
                events = await registry.queryFilter(filter, fromBlock, currentBlock);
            } catch {
                // If filter fails (contract not deployed), return empty
                console.warn('[KeeperService] Event query failed — contract may not be deployed');
                return [];
            }

            // Deduplicate patient addresses
            const patientAddresses = new Set<string>();
            for (const event of events) {
                try {
                    const parsed = registry.interface.parseLog(event);
                    if (parsed?.args?.owner) {
                        patientAddresses.add(parsed.args.owner);
                    }
                } catch {
                    // Skip unparseable events
                }
            }

            // For each patient, get their unreviewed records
            const pendingRecords: PendingRecord[] = [];

            for (const patient of patientAddresses) {
                try {
                    const unreviewedIds: string[] = await registry.getUnreviewedRecords(patient);

                    for (const recordId of unreviewedIds) {
                        try {
                            const record = await registry.getRecord(recordId);

                            pendingRecords.push({
                                recordId,
                                owner: record.owner,
                                ipfsHash: record.ipfsHash,
                                integrityHash: record.integrityHash,
                                recordType: record.recordType,
                                provider: record.provider,
                                providerId: record.providerId,
                                proofHash: record.proofHash,
                                timestamp: Number(record.timestamp),
                            });
                        } catch {
                            // Skip records that fail to fetch
                        }
                    }
                } catch {
                    // Skip patients whose records can't be queried
                }
            }

            return pendingRecords;
        } catch (error) {
            console.error('[KeeperService] Queue fetch failed:', error);
            return [];
        }
    }

    // ============================================================
    // Threshold Decryption (Lit Protocol)
    // ============================================================

    /**
     * Decrypt a record for keeper review via Lit threshold decryption.
     * 
     * Flow:
     *   1. Fetch encrypted package from IPFS by CID
     *   2. Parse the Lit-encrypted AES key from the package
     *   3. Send decrypt request to Lit node swarm
     *   4. Lit nodes check ACC on-chain (authorizedKeepers(msg.sender))
     *   5. If authorized, nodes release key shares
     *   6. Client reassembles key and decrypts file content
     */
    async decryptForReview(cid: string): Promise<DecryptedReviewData> {
        try {
            // Step 1: Fetch encrypted package from IPFS
            console.log('[KeeperService] Fetching encrypted package from IPFS...');
            const rawBytes = await ipfsGateway.fetchEncrypted(cid);
            const packageJson = new TextDecoder().decode(rawBytes);
            const pkg = JSON.parse(packageJson);

            if (pkg.version !== 2) {
                return {
                    fileContent: null,
                    metadata: {},
                    success: false,
                    error: `Unsupported package version: ${pkg.version}`,
                };
            }

            // Step 2: Initialize Lit and decrypt the AES key
            console.log('[KeeperService] Decrypting AES key via Lit threshold...');
            await privacyLayer.initialize();

            const acc = JSON.parse(pkg.accessControlConditions);
            const rawKey = await privacyLayer.decrypt(
                pkg.litCiphertext,
                pkg.dataToEncryptHash,
                acc
            );

            // Step 3: Use AES key to decrypt file content
            console.log('[KeeperService] Decrypting file content...');
            const aesKey = await crypto.subtle.importKey(
                'raw',
                rawKey.buffer as ArrayBuffer,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );

            const iv = new Uint8Array(pkg.iv);
            const encryptedData = new Uint8Array(pkg.encryptedData);

            const decryptedContent = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                aesKey,
                encryptedData
            );

            console.log('✅ Record decrypted for keeper review');

            return {
                fileContent: decryptedContent,
                metadata: {
                    conditionId: pkg.conditionId,
                    version: pkg.version,
                },
                success: true,
            };
        } catch (error) {
            console.error('[KeeperService] Decrypt failed:', error);
            return {
                fileContent: null,
                metadata: {},
                success: false,
                error: error instanceof Error ? error.message : 'Decryption failed',
            };
        }
    }

    // ============================================================
    // Quality Actions
    // ============================================================

    /**
     * Approve a record: calls finalizeRecord() on-chain.
     * 
     * This:
     *   1. Marks the record as quality-checked with tags
     *   2. Sends Data UBI payment (MATIC) to the patient
     *   3. Emits QualityVerified and DataUBIReleased events
     */
    async approveRecord(
        recordId: string,
        tags: string,
        ubiAmount: bigint = DEFAULT_UBI_AMOUNT
    ): Promise<ethers.TransactionReceipt> {
        const registry = this.ensureConnected();

        console.log(`[KeeperService] Approving record ${recordId} with tags: ${tags}`);
        console.log(`[KeeperService] Data UBI amount: ${ethers.formatEther(ubiAmount)} MATIC`);

        const tx = await registry.finalizeRecord(recordId, tags, {
            value: ubiAmount,
        });

        const receipt = await tx.wait();

        console.log(`✅ Record ${recordId} approved. UBI sent to patient.`);
        return receipt;
    }

    /**
     * Reject a record: calls flagLowQuality() on-chain.
     * 
     * This deactivates the record (soft delete).
     */
    async rejectRecord(recordId: string): Promise<ethers.TransactionReceipt> {
        const registry = this.ensureConnected();

        console.log(`[KeeperService] Rejecting record ${recordId}`);

        const tx = await registry.flagLowQuality(recordId);
        const receipt = await tx.wait();

        console.log(`✅ Record ${recordId} flagged as low quality and deactivated.`);
        return receipt;
    }

    // ============================================================
    // Statistics
    // ============================================================

    /**
     * Get keeper statistics from on-chain events.
     */
    async getKeeperStats(keeperAddress: string): Promise<KeeperStats> {
        const registry = this.ensureConnected();

        try {
            const isAuthorized = await this.isAuthorizedKeeper(keeperAddress);

            // Count QualityVerified events from this keeper
            const currentBlock = await this.provider!.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 200000);

            let approved = 0;
            let rejected = 0;

            try {
                const approveFilter = registry.filters.QualityVerified?.(null, keeperAddress);
                const approveEvents = await registry.queryFilter(approveFilter, fromBlock, currentBlock);
                approved = approveEvents.length;

                const rejectFilter = registry.filters.LowQualityFlagged?.(null, keeperAddress);
                const rejectEvents = await registry.queryFilter(rejectFilter, fromBlock, currentBlock);
                rejected = rejectEvents.length;
            } catch {
                // Event query failed — likely contract not deployed
            }

            // Get current queue size
            const queue = await this.getVerificationQueue();

            return {
                totalReviewed: approved + rejected,
                totalApproved: approved,
                totalRejected: rejected,
                queueSize: queue.length,
                isAuthorized,
            };
        } catch (error) {
            console.error('[KeeperService] Stats fetch failed:', error);
            return {
                totalReviewed: 0,
                totalApproved: 0,
                totalRejected: 0,
                queueSize: 0,
                isAuthorized: false,
            };
        }
    }
}

// ============================================================
// Error
// ============================================================

export type KeeperErrorCode = 'NO_WALLET' | 'NOT_CONNECTED' | 'TX_FAILED';

export class KeeperError extends Error {
    code: KeeperErrorCode;

    constructor(code: KeeperErrorCode, message: string) {
        super(message);
        this.code = code;
        this.name = 'KeeperError';
    }
}

// ============================================================
// Singleton
// ============================================================

export const keeperService = new KeeperService();
