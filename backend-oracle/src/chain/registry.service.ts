/**
 * Registry Service - Smart Contract Interactions
 * 
 * TypeScript interface for interacting with MedicalRecordRegistry.sol
 */

import { ethers, Contract, Wallet, ContractTransactionResponse } from 'ethers';
import { createProvider, NETWORKS } from './provider.js';

// ABI for MedicalRecordRegistry (generated from Solidity compilation)
const REGISTRY_ABI = [
    // Events
    'event RecordRegistered(bytes32 indexed recordId, address indexed owner, address indexed provider, string ipfsHash, string recordType)',
    'event ConditionUpdated(bytes32 indexed recordId, bytes32 oldConditionId, bytes32 newConditionId)',
    'event RecordDeactivated(bytes32 indexed recordId)',

    // Read functions
    'function records(bytes32 recordId) view returns (address owner, string ipfsHash, string integrityHash, string recordType, address provider, bytes32 conditionId, uint256 timestamp, bool isActive)',
    'function patientRecords(address patient, uint256 index) view returns (bytes32)',
    'function getRecord(bytes32 recordId) view returns (tuple(address owner, string ipfsHash, string integrityHash, string recordType, address provider, bytes32 conditionId, uint256 timestamp, bool isActive))',
    'function getPatientRecords(address patient) view returns (bytes32[])',

    // Write functions
    'function registerRecord(string ipfsHash, string integrityHash, string recordType, address provider, bytes32 conditionId) returns (bytes32 recordId)',
    'function updateCondition(bytes32 recordId, bytes32 newConditionId)',
    'function deactivateRecord(bytes32 recordId)',
];

export interface MedicalRecord {
    owner: string;
    ipfsHash: string;
    integrityHash: string;
    recordType: string;
    provider: string;
    conditionId: string;
    timestamp: bigint;
    isActive: boolean;
}

export interface RegisterRecordParams {
    ipfsHash: string;
    integrityHash: string;
    recordType: string;
    provider: string;
    conditionId: string;
}

/**
 * Registry Service for interacting with MedicalRecordRegistry contract
 */
export class RegistryService {
    private contract: Contract;
    private signer: Wallet;

    constructor(contractAddress: string, signer: Wallet) {
        this.signer = signer;
        this.contract = new Contract(contractAddress, REGISTRY_ABI, signer);
    }

    /**
     * Register a new medical record
     * 
     * @param params - Record parameters
     * @returns Transaction response and record ID
     */
    async registerRecord(params: RegisterRecordParams): Promise<{
        tx: ContractTransactionResponse;
        recordId: string;
    }> {
        const tx = await this.contract.registerRecord(
            params.ipfsHash,
            params.integrityHash,
            params.recordType,
            params.provider,
            params.conditionId
        );

        const receipt = await tx.wait();

        // Extract recordId from event
        const event = receipt?.logs.find(
            (log: any) => log.fragment?.name === 'RecordRegistered'
        );
        const recordId = event?.args?.[0] ?? ethers.ZeroHash;

        return { tx, recordId };
    }

    /**
     * Update the TACo condition for a record
     * Called after modifying access in TACo network
     * 
     * @param recordId - Record identifier
     * @param newConditionId - New TACo condition ID
     */
    async updateCondition(
        recordId: string,
        newConditionId: string
    ): Promise<ContractTransactionResponse> {
        return this.contract.updateCondition(recordId, newConditionId);
    }

    /**
     * Deactivate a record (soft delete)
     * 
     * @param recordId - Record identifier
     */
    async deactivateRecord(recordId: string): Promise<ContractTransactionResponse> {
        return this.contract.deactivateRecord(recordId);
    }

    /**
     * Get a record by ID
     * 
     * @param recordId - Record identifier
     */
    async getRecord(recordId: string): Promise<MedicalRecord> {
        const record = await this.contract.getRecord(recordId);

        return {
            owner: record.owner,
            ipfsHash: record.ipfsHash,
            integrityHash: record.integrityHash,
            recordType: record.recordType,
            provider: record.provider,
            conditionId: record.conditionId,
            timestamp: record.timestamp,
            isActive: record.isActive,
        };
    }

    /**
     * Get all record IDs for a patient
     * 
     * @param patientAddress - Patient wallet address
     */
    async getPatientRecords(patientAddress: string): Promise<string[]> {
        return this.contract.getPatientRecords(patientAddress);
    }

    /**
     * Get all records for a patient (full data)
     * 
     * @param patientAddress - Patient wallet address
     */
    async getPatientRecordsFull(patientAddress: string): Promise<MedicalRecord[]> {
        const recordIds = await this.getPatientRecords(patientAddress);
        return Promise.all(recordIds.map(id => this.getRecord(id)));
    }

    /**
     * Get contract address
     */
    getContractAddress(): string {
        return this.contract.target as string;
    }

    /**
     * Listen for RecordRegistered events
     */
    onRecordRegistered(
        callback: (recordId: string, owner: string, provider: string, ipfsHash: string, recordType: string) => void
    ): void {
        this.contract.on('RecordRegistered', callback);
    }

    /**
     * Listen for ConditionUpdated events
     */
    onConditionUpdated(
        callback: (recordId: string, oldConditionId: string, newConditionId: string) => void
    ): void {
        this.contract.on('ConditionUpdated', callback);
    }

    /**
     * Remove all event listeners
     */
    removeAllListeners(): void {
        this.contract.removeAllListeners();
    }
}

/**
 * Create a RegistryService for the local devnet
 */
export function createDevnetRegistryService(
    contractAddress: string,
    privateKey: string
): RegistryService {
    const provider = createProvider('cdkDevnet');
    const signer = new Wallet(privateKey, provider);
    return new RegistryService(contractAddress, signer);
}
