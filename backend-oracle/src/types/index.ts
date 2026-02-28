/**
 * TypeScript Type Definitions for Aura Health
 */

/** Record types for medical files */
export type RecordType =
    | 'MRI'
    | 'CT'
    | 'X-Ray'
    | 'Blood'
    | 'Genomics'
    | 'Lab'
    | 'Prescription'
    | 'Clinical Notes'
    | 'Other';

/** Medical record as stored on-chain */
export interface OnChainRecord {
    recordId: string;
    owner: string;
    ipfsHash: string;
    integrityHash: string;
    recordType: RecordType;
    provider: string;
    conditionId: string;
    timestamp: number;
    isActive: boolean;
}

/** Encrypted package stored on IPFS */
export interface EncryptedPackage {
    /** AES-encrypted file data (base64) */
    encryptedData: string;
    /** AES IV (base64) */
    iv: string;
    /** AES auth tag (base64) */
    authTag: string;
    /** TACo-encrypted AES key */
    tacoCiphertext: string;
    /** TACo condition ID */
    conditionId: string;
    /** SHA-256 hash of original file */
    integrityHash: string;
    /** Encryption timestamp */
    encryptedAt: number;
}

/** User roles in the system */
export type UserRole = 'patient' | 'provider' | 'admin';

/** Patient profile */
export interface PatientProfile {
    address: string;
    name?: string;
    dateOfBirth?: string;
    recordIds: string[];
}

/** Provider (hospital/clinic) profile */
export interface ProviderProfile {
    address: string;
    name: string;
    licenseNumber?: string;
    specialty?: string;
}

/** Access grant metadata */
export interface AccessGrant {
    grantee: string;
    grantedAt: number;
    expiresAt?: number;
    recordIds: string[];
}

/** File upload request */
export interface UploadRequest {
    file: Uint8Array;
    filename: string;
    recordType: RecordType;
    patientAddress: string;
    providerAddress: string;
    allowedAddresses?: string[];
}

/** Upload result */
export interface UploadResult {
    recordId: string;
    ipfsHash: string;
    integrityHash: string;
    conditionId: string;
    transactionHash: string;
}
