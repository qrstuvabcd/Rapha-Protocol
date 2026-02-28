/**
 * Local Record Storage Service
 * 
 * Persists medical records in localStorage for demo purposes.
 * In production, this would query the blockchain as NFTs.
 */

export interface StoredRecord {
    id: string
    patientAddress: string
    providerAddress: string
    providerName: string
    recordType: string
    fileName: string
    fileSize: number
    notes: string
    ipfsHash: string
    timestamp: number
    isActive: boolean
    // New fields for image preview and NFT
    fileData?: string       // Base64 encoded file data for preview
    mimeType?: string       // e.g., 'image/png', 'application/pdf'
    // NFT metadata (for on-chain storage)
    tokenId?: string        // ERC-721 token ID when minted
    tokenUri?: string       // IPFS URI for NFT metadata
    isMinted?: boolean      // Whether this record is minted as NFT
    // ZK-TLS Origin Verification
    isOriginVerified?: boolean  // true if imported via ZK-TLS flow
    providerId?: string         // e.g., "nhs.uk"
    proofHash?: string          // Hash of the ZK proof
    // Keeper Quality Check
    isQualityChecked?: boolean  // set by authorized Keeper
    qualityTags?: string        // e.g., "#DiabetesType2, #ClearLungs"
    isRejected?: boolean        // flagged as low quality by Keeper
}

const RECORDS_STORAGE_KEY = 'rapha_medical_records'

/**
 * Get all records from localStorage
 */
function getAllRecords(): StoredRecord[] {
    const stored = localStorage.getItem(RECORDS_STORAGE_KEY)
    if (!stored) return []
    try {
        return JSON.parse(stored)
    } catch {
        return []
    }
}

/**
 * Save a new record (called by doctor during upload)
 */
export function saveRecord(record: Omit<StoredRecord, 'id' | 'timestamp' | 'isActive'>): StoredRecord {
    const records = getAllRecords()

    const newRecord: StoredRecord = {
        ...record,
        id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        isActive: true
    }

    records.push(newRecord)
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records))

    return newRecord
}

/**
 * Get records for a specific patient
 */
export function getPatientRecords(patientAddress: string): StoredRecord[] {
    const records = getAllRecords()
    return records
        .filter(r => r.patientAddress.toLowerCase() === patientAddress.toLowerCase())
        .sort((a, b) => b.timestamp - a.timestamp) // newest first
}

/**
 * Get records uploaded by a specific provider
 */
export function getProviderRecords(providerAddress: string): StoredRecord[] {
    const records = getAllRecords()
    return records
        .filter(r => r.providerAddress.toLowerCase() === providerAddress.toLowerCase())
        .sort((a, b) => b.timestamp - a.timestamp)
}

/**
 * Generate a mock IPFS hash
 */
export function generateMockIpfsHash(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let hash = 'Qm'
    for (let i = 0; i < 44; i++) {
        hash += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return hash
}
