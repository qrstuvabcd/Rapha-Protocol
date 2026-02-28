/**
 * NFT Minting Service
 * 
 * Handles minting medical records as NFTs on the Rapha Protocol blockchain.
 * In production, this connects to the MedicalRecordNFT smart contract.
 */

import { ethers } from 'ethers'

// Contract ABI (simplified for frontend)
const MEDICAL_RECORD_NFT_ABI = [
    "function mintRecord(address patient, string recordType, string ipfsHash) returns (uint256)",
    "function mintOwnRecord(string recordType, string ipfsHash) returns (uint256)",
    "function grantAccess(uint256 tokenId, address provider)",
    "function revokeAccess(uint256 tokenId, address provider)",
    "function hasAccess(uint256 tokenId, address provider) view returns (bool)",
    "function getPatientRecords(address patient) view returns (uint256[])",
    "function getRecordMetadata(uint256 tokenId) view returns (string, string, address, uint256, bool)",
    "function totalRecords() view returns (uint256)",
    "event RecordMinted(uint256 indexed tokenId, address indexed patient, address indexed provider, string recordType, string ipfsHash)"
]

// Contract address (to be set after deployment)
const NFT_CONTRACT_ADDRESS = import.meta.env.VITE_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

export interface MintResult {
    success: boolean
    tokenId?: string
    transactionHash?: string
    error?: string
}

export interface NFTRecord {
    tokenId: string
    recordType: string
    ipfsHash: string
    uploadedBy: string
    uploadedAt: number
    isActive: boolean
}

/**
 * Get contract instance
 */
function getContract(signer: ethers.Signer) {
    return new ethers.Contract(NFT_CONTRACT_ADDRESS, MEDICAL_RECORD_NFT_ABI, signer)
}

/**
 * Mint a medical record as NFT
 */
export async function mintRecordNFT(
    signer: ethers.Signer,
    patientAddress: string,
    recordType: string,
    ipfsHash: string
): Promise<MintResult> {
    try {
        // For demo mode (no deployed contract), simulate minting
        if (NFT_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            console.log('Demo mode: Simulating NFT mint')
            const mockTokenId = Math.floor(Math.random() * 1000000).toString()

            // Simulate network delay
            await new Promise(r => setTimeout(r, 1500))

            return {
                success: true,
                tokenId: mockTokenId,
                transactionHash: `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`
            }
        }

        const contract = getContract(signer)

        // Call mintRecord on the contract
        const tx = await contract.mintRecord(patientAddress, recordType, ipfsHash)
        const receipt = await tx.wait()

        // Parse the RecordMinted event to get tokenId
        const event = receipt.logs.find((log: ethers.Log) => {
            try {
                const parsed = contract.interface.parseLog(log)
                return parsed?.name === 'RecordMinted'
            } catch {
                return false
            }
        })

        let tokenId = '0'
        if (event) {
            const parsed = contract.interface.parseLog(event)
            tokenId = parsed?.args?.tokenId?.toString() || '0'
        }

        return {
            success: true,
            tokenId,
            transactionHash: receipt.hash
        }
    } catch (error) {
        console.error('Mint error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Minting failed'
        }
    }
}

/**
 * Mint own record (patient mints for themselves)
 */
export async function mintOwnRecordNFT(
    signer: ethers.Signer,
    recordType: string,
    ipfsHash: string
): Promise<MintResult> {
    const address = await signer.getAddress()
    return mintRecordNFT(signer, address, recordType, ipfsHash)
}

/**
 * Get all NFT records for a patient
 */
export async function getPatientNFTRecords(
    provider: ethers.Provider,
    patientAddress: string
): Promise<NFTRecord[]> {
    try {
        // Demo mode
        if (NFT_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            return []
        }

        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, MEDICAL_RECORD_NFT_ABI, provider)

        const tokenIds = await contract.getPatientRecords(patientAddress)
        const records: NFTRecord[] = []

        for (const tokenId of tokenIds) {
            const [recordType, ipfsHash, uploadedBy, uploadedAt, isActive] =
                await contract.getRecordMetadata(tokenId)

            records.push({
                tokenId: tokenId.toString(),
                recordType,
                ipfsHash,
                uploadedBy,
                uploadedAt: Number(uploadedAt),
                isActive
            })
        }

        return records
    } catch (error) {
        console.error('Error fetching NFT records:', error)
        return []
    }
}

/**
 * Grant access to a provider for a specific record
 */
export async function grantNFTAccess(
    signer: ethers.Signer,
    tokenId: string,
    providerAddress: string
): Promise<boolean> {
    try {
        if (NFT_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            console.log('Demo mode: Simulating access grant')
            return true
        }

        const contract = getContract(signer)
        const tx = await contract.grantAccess(tokenId, providerAddress)
        await tx.wait()
        return true
    } catch (error) {
        console.error('Grant access error:', error)
        return false
    }
}

/**
 * Revoke access from a provider for a specific record
 */
export async function revokeNFTAccess(
    signer: ethers.Signer,
    tokenId: string,
    providerAddress: string
): Promise<boolean> {
    try {
        if (NFT_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            console.log('Demo mode: Simulating access revoke')
            return true
        }

        const contract = getContract(signer)
        const tx = await contract.revokeAccess(tokenId, providerAddress)
        await tx.wait()
        return true
    } catch (error) {
        console.error('Revoke access error:', error)
        return false
    }
}

/**
 * Check if a provider has access to a record
 */
export async function checkNFTAccess(
    provider: ethers.Provider,
    tokenId: string,
    providerAddress: string
): Promise<boolean> {
    try {
        if (NFT_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            return false
        }

        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, MEDICAL_RECORD_NFT_ABI, provider)
        return await contract.hasAccess(tokenId, providerAddress)
    } catch (error) {
        console.error('Check access error:', error)
        return false
    }
}

/**
 * Get total number of minted records
 */
export async function getTotalNFTRecords(provider: ethers.Provider): Promise<number> {
    try {
        if (NFT_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
            return 0
        }

        const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, MEDICAL_RECORD_NFT_ABI, provider)
        const total = await contract.totalRecords()
        return Number(total)
    } catch (error) {
        console.error('Get total records error:', error)
        return 0
    }
}
