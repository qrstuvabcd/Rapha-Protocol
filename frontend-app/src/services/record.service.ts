/**
 * Medical Record Service — Production Pipeline
 * 
 * Orchestrates the complete upload flow:
 *   1. Encrypt file content with AES-256-GCM (local key)
 *   2. Encrypt the AES key with Lit Protocol ACC (patient OR keeper)
 *   3. Package encrypted payload (file + wrapped key)
 *   4. Upload to IPFS via Pinata → get CID
 *   5. Register on-chain via MedicalRecordRegistry
 * 
 * The Lit ACC ensures only the patient or an authorized keeper
 * can decrypt the data. AI companies CANNOT decrypt — they must
 * use Compute-over-Data via a TEE enclave.
 */

import { ethers } from 'ethers';
import { privacyLayer } from './lit.service';
import { ipfsGateway } from './ipfs.gateway';

// ============================================================
// Types
// ============================================================

export interface UploadResult {
    success: boolean;
    recordId?: string;
    ipfsCid?: string;
    integrityHash?: string;
    conditionId?: string;
    error?: string;
}

export interface RecordUploadParams {
    file: File;
    recordType: string;
    providerAddress: string;
    patientAddress: string;
    signer: ethers.Signer;
}

export interface VerifiedRecordUploadParams extends RecordUploadParams {
    /** ZK-TLS verified provider domain (e.g., "nhs.uk") */
    providerId: string;
    /** keccak256 hash of the ZK proof */
    proofHash: string;
}

/** Encrypted package stored on IPFS */
interface EncryptedPackage {
    version: 2;
    /** AES-GCM initialization vector */
    iv: number[];
    /** AES-encrypted file content */
    encryptedData: number[];
    /** Lit-encrypted AES key (ciphertext) */
    litCiphertext: string;
    /** Hash needed for Lit decryption */
    dataToEncryptHash: string;
    /** Serialized ACC for the Lit decryption call */
    accessControlConditions: string;
    /** On-chain condition reference */
    conditionId: string;
}

// ============================================================
// Registry Contract ABI (minimal)
// ============================================================

const REGISTRY_ADDRESS = import.meta.env.VITE_REGISTRY_ADDRESS
    || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

const REGISTRY_ABI = [
    'function registerRecord(string ipfsHash, string integrityHash, string recordType, address provider, bytes32 conditionId) external returns (bytes32)',
    'function submitVerifiedData(string ipfsHash, string integrityHash, string recordType, address provider, bytes32 conditionId, string providerId, bytes32 proofHash) external returns (bytes32)',
    'event RecordRegistered(bytes32 indexed recordId, address indexed owner, address indexed provider, string ipfsHash, string recordType)',
    'event VerifiedDataSubmitted(bytes32 indexed recordId, address indexed owner, string providerId, bytes32 proofHash)',
];

// ============================================================
// Crypto Helpers (AES-256-GCM — local content encryption)
// ============================================================

async function generateAESKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true, // extractable — we need to wrap it with Lit
        ['encrypt', 'decrypt']
    );
}

async function encryptFileContent(
    file: File,
    key: CryptoKey
): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const fileBuffer = await file.arrayBuffer();

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        fileBuffer
    );

    return { encrypted, iv };
}

async function exportAESKey(key: CryptoKey): Promise<Uint8Array> {
    const rawKey = await crypto.subtle.exportKey('raw', key);
    return new Uint8Array(rawKey);
}

async function computeIntegrityHash(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// ============================================================
// Upload: Standard Record (self-reported)
// ============================================================

/**
 * Upload a NEW medical record using the full production pipeline.
 * 
 * Pipeline:
 *   AES encrypt file → Lit encrypt AES key → Package → IPFS → On-chain
 */
export async function uploadMedicalRecord(
    params: RecordUploadParams
): Promise<UploadResult> {
    const { file, recordType, providerAddress, patientAddress, signer } = params;

    try {
        // Step 1: Generate AES key and encrypt file content
        console.log('[RecordService] Step 1: Encrypting file with AES-256-GCM...');
        const aesKey = await generateAESKey();
        const { encrypted, iv } = await encryptFileContent(file, aesKey);
        const rawKey = await exportAESKey(aesKey);

        // Step 2: Compute integrity hash of original file
        console.log('[RecordService] Step 2: Computing SHA-256 integrity hash...');
        const fileBuffer = await file.arrayBuffer();
        const integrityHash = await computeIntegrityHash(fileBuffer);

        // Step 3: Build Lit ACC and encrypt AES key
        console.log('[RecordService] Step 3: Encrypting AES key with Lit Protocol ACC...');
        await privacyLayer.initialize();

        const acc = privacyLayer.buildMedicalACC(patientAddress, REGISTRY_ADDRESS);
        const conditionId = privacyLayer.computeConditionId(acc);

        const litResult = await privacyLayer.encrypt(rawKey, acc);

        // Step 4: Package encrypted data
        console.log('[RecordService] Step 4: Packaging encrypted payload...');
        const encryptedPackage: EncryptedPackage = {
            version: 2,
            iv: Array.from(iv),
            encryptedData: Array.from(new Uint8Array(encrypted)),
            litCiphertext: litResult.ciphertext,
            dataToEncryptHash: litResult.dataToEncryptHash,
            accessControlConditions: JSON.stringify(acc),
            conditionId,
        };

        const packageBlob = new Uint8Array(
            new TextEncoder().encode(JSON.stringify(encryptedPackage))
        );

        // Step 5: Upload to IPFS via Pinata
        console.log('[RecordService] Step 5: Uploading to IPFS via Pinata...');
        const ipfsResult = await ipfsGateway.uploadEncrypted(packageBlob, {
            recordType,
            timestamp: Date.now(),
            isOriginVerified: false,
        });

        console.log(`[RecordService] Pinned to IPFS: ${ipfsResult.cid}`);

        // Step 6: Register on blockchain
        console.log('[RecordService] Step 6: Registering on MedicalRecordRegistry...');
        const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);

        const tx = await registry.registerRecord(
            ipfsResult.cid,
            '0x' + integrityHash,
            recordType,
            providerAddress,
            conditionId
        );

        const receipt = await tx.wait();

        // Extract recordId from event
        const event = receipt.logs.find((log: any) => {
            try {
                return registry.interface.parseLog(log)?.name === 'RecordRegistered';
            } catch {
                return false;
            }
        });

        const parsedEvent = event ? registry.interface.parseLog(event) : null;
        const recordId = parsedEvent?.args?.recordId || tx.hash;

        console.log('✅ Record uploaded successfully!', { recordId, cid: ipfsResult.cid });

        return {
            success: true,
            recordId,
            ipfsCid: ipfsResult.cid,
            integrityHash,
            conditionId,
        };
    } catch (error) {
        console.error('[RecordService] Upload failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

// ============================================================
// Upload: ZK-TLS Verified Record
// ============================================================

/**
 * Upload a ZK-TLS VERIFIED medical record.
 * Same pipeline as above, but calls submitVerifiedData() instead
 * of registerRecord(), passing the ZK proof hash and provider ID.
 * The contract auto-sets isOriginVerified = true.
 */
export async function uploadVerifiedRecord(
    params: VerifiedRecordUploadParams
): Promise<UploadResult> {
    const { file, recordType, providerAddress, patientAddress, signer, providerId, proofHash } = params;

    try {
        // Steps 1-5: Same as standard upload
        console.log('[RecordService] Verified upload — encrypting and pinning...');
        const aesKey = await generateAESKey();
        const { encrypted, iv } = await encryptFileContent(file, aesKey);
        const rawKey = await exportAESKey(aesKey);

        const fileBuffer = await file.arrayBuffer();
        const integrityHash = await computeIntegrityHash(fileBuffer);

        await privacyLayer.initialize();
        const acc = privacyLayer.buildMedicalACC(patientAddress, REGISTRY_ADDRESS);
        const conditionId = privacyLayer.computeConditionId(acc);
        const litResult = await privacyLayer.encrypt(rawKey, acc);

        const encryptedPackage: EncryptedPackage = {
            version: 2,
            iv: Array.from(iv),
            encryptedData: Array.from(new Uint8Array(encrypted)),
            litCiphertext: litResult.ciphertext,
            dataToEncryptHash: litResult.dataToEncryptHash,
            accessControlConditions: JSON.stringify(acc),
            conditionId,
        };

        const packageBlob = new Uint8Array(
            new TextEncoder().encode(JSON.stringify(encryptedPackage))
        );

        const ipfsResult = await ipfsGateway.uploadEncrypted(packageBlob, {
            recordType,
            timestamp: Date.now(),
            providerId,
            isOriginVerified: true,
        });

        // Step 6: Register as VERIFIED data on blockchain
        console.log('[RecordService] Registering verified data on-chain...');
        const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);

        const tx = await registry.submitVerifiedData(
            ipfsResult.cid,
            '0x' + integrityHash,
            recordType,
            providerAddress,
            conditionId,
            providerId,
            proofHash
        );

        const receipt = await tx.wait();

        const event = receipt.logs.find((log: any) => {
            try {
                return registry.interface.parseLog(log)?.name === 'VerifiedDataSubmitted';
            } catch {
                return false;
            }
        });

        const parsedEvent = event ? registry.interface.parseLog(event) : null;
        const recordId = parsedEvent?.args?.recordId || tx.hash;

        console.log('✅ Verified record uploaded!', { recordId, cid: ipfsResult.cid, providerId });

        return {
            success: true,
            recordId,
            ipfsCid: ipfsResult.cid,
            integrityHash,
            conditionId,
        };
    } catch (error) {
        console.error('[RecordService] Verified upload failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

// ============================================================
// Decrypt: Retrieve and decrypt a record
// ============================================================

/**
 * Decrypt a medical record from IPFS.
 * 
 * 1. Fetch encrypted package from IPFS by CID
 * 2. Use Lit Protocol to decrypt the AES key (ACC check on-chain)
 * 3. Use AES key to decrypt file content
 * 
 * @param cid — IPFS Content Identifier
 * @returns Decrypted file as ArrayBuffer, or null if unauthorized
 */
export async function decryptMedicalRecord(
    cid: string
): Promise<ArrayBuffer | null> {
    try {
        // Step 1: Fetch from IPFS
        console.log('[RecordService] Fetching encrypted package from IPFS...');
        const rawBytes = await ipfsGateway.fetchEncrypted(cid);
        const packageJson = new TextDecoder().decode(rawBytes);
        const pkg: EncryptedPackage = JSON.parse(packageJson);

        if (pkg.version !== 2) {
            throw new Error(`Unsupported package version: ${pkg.version}`);
        }

        // Step 2: Decrypt AES key via Lit Protocol
        console.log('[RecordService] Decrypting AES key via Lit threshold decryption...');
        await privacyLayer.initialize();

        const acc = JSON.parse(pkg.accessControlConditions);
        const rawKey = await privacyLayer.decrypt(
            pkg.litCiphertext,
            pkg.dataToEncryptHash,
            acc
        );

        // Step 3: Import AES key and decrypt file
        console.log('[RecordService] Decrypting file content...');
        const aesKey = await crypto.subtle.importKey(
            'raw',
            rawKey.buffer as ArrayBuffer,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );

        const iv = new Uint8Array(pkg.iv);
        const encryptedData = new Uint8Array(pkg.encryptedData);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            aesKey,
            encryptedData
        );

        console.log('✅ Record decrypted successfully');
        return decrypted;
    } catch (error) {
        console.error('[RecordService] Decryption failed:', error);
        return null;
    }
}
