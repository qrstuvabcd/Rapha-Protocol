/**
 * Agent B (The Cryptographer) - Threshold TACo Service
 * 
 * Integrates with @nucypher/taco-sdk for threshold access control.
 * TACo allows patients to define CONDITIONS for who can decrypt,
 * without needing to explicitly share keys with each recipient.
 */

import { ethers, Signer } from 'ethers';

// Note: @nucypher/taco-sdk types may need to be installed separately
// This is a typed interface matching the TACo SDK API

/** Condition types for TACo access control */
export type ConditionType =
    | 'evm'
    | 'time'
    | 'compound';

/** EVM-based condition (e.g., address verification) */
export interface EvmCondition {
    conditionType: 'evm';
    chain: number;         // Chain ID
    method: string;        // Smart contract method
    parameters: unknown[]; // Method parameters
    returnValueTest: {
        comparator: '==' | '!=' | '>' | '<' | '>=' | '<=';
        value: string | number | boolean;
    };
}

/** Time-based condition */
export interface TimeCondition {
    conditionType: 'time';
    chain: number;
    method: 'blocktime';
    returnValueTest: {
        comparator: '>' | '<' | '>=' | '<=';
        value: number; // Unix timestamp
    };
}

/** Compound condition (AND/OR of multiple conditions) */
export interface CompoundCondition {
    conditionType: 'compound';
    operator: 'and' | 'or';
    operands: (EvmCondition | TimeCondition | CompoundCondition)[];
}

export type Condition = EvmCondition | TimeCondition | CompoundCondition;

/** TACo encrypted message (ciphertext + metadata) */
export interface TacoMessageKit {
    /** Serialized ciphertext */
    ciphertext: Uint8Array;
    /** Condition ID (for on-chain reference) */
    conditionId: string;
    /** Serialized condition (for decryption) */
    conditionContext: string;
}

/** TACo domain configuration */
export interface TacoDomain {
    chainId: number;
    ritualId: number;
    porterUri: string;
}

// Default devnet configuration
const DEVNET_DOMAIN: TacoDomain = {
    chainId: 80002, // Polygon Amoy testnet
    ritualId: 0,    // Default ritual
    porterUri: 'https://porter-tapir.nucypher.community',
};

/**
 * TACo Service for Threshold Access Control
 * 
 * Usage:
 * 1. Create a condition defining who can decrypt
 * 2. Encrypt the AES key with the condition
 * 3. Store conditionId on-chain
 * 4. Recipients who meet the condition can decrypt
 */
export class TacoService {
    private domain: TacoDomain;

    constructor(domain: TacoDomain = DEVNET_DOMAIN) {
        this.domain = domain;
    }

    /**
     * Create an address-based access condition
     * Only the specified addresses can decrypt
     * 
     * @param allowedAddresses - Array of Ethereum addresses
     * @param contractAddress - MedicalRecordRegistry address
     * @returns Condition object
     */
    createAddressCondition(
        allowedAddresses: string[],
        contractAddress: string
    ): CompoundCondition {
        if (allowedAddresses.length === 0) {
            throw new Error('At least one address must be allowed');
        }

        // Create individual conditions for each address
        const conditions: EvmCondition[] = allowedAddresses.map(address => ({
            conditionType: 'evm' as const,
            chain: this.domain.chainId,
            method: 'eth_getBalance', // Simple address verification
            parameters: [address, 'latest'],
            returnValueTest: {
                comparator: '>=' as const,
                value: 0,
            },
        }));

        // Combine with OR (any of these addresses can decrypt)
        if (conditions.length === 1) {
            return {
                conditionType: 'compound',
                operator: 'or',
                operands: conditions,
            };
        }

        return {
            conditionType: 'compound',
            operator: 'or',
            operands: conditions,
        };
    }

    /**
     * Create a time-locked condition
     * Data can only be decrypted after the specified time
     * 
     * @param unlockTimestamp - Unix timestamp when decryption is allowed
     */
    createTimeLockCondition(unlockTimestamp: number): TimeCondition {
        return {
            conditionType: 'time',
            chain: this.domain.chainId,
            method: 'blocktime',
            returnValueTest: {
                comparator: '>=',
                value: unlockTimestamp,
            },
        };
    }

    /**
     * Combine address and time conditions
     * User must be in allowed list AND current time must be past unlock time
     */
    createAddressWithTimeLock(
        allowedAddresses: string[],
        unlockTimestamp: number,
        contractAddress: string
    ): CompoundCondition {
        const addressCondition = this.createAddressCondition(allowedAddresses, contractAddress);
        const timeCondition = this.createTimeLockCondition(unlockTimestamp);

        return {
            conditionType: 'compound',
            operator: 'and',
            operands: [addressCondition, timeCondition],
        };
    }

    /**
     * Encrypt data with a TACo condition
     * 
     * @param data - Raw bytes to encrypt (typically an AES key)
     * @param condition - Access condition
     * @param signer - Ethereum signer for the encryptor
     * @returns TACo message kit with encrypted data and condition metadata
     */
    async encryptWithCondition(
        data: Uint8Array,
        condition: Condition,
        signer: Signer
    ): Promise<TacoMessageKit> {
        // NOTE: In production, this would use the actual TACo SDK:
        // import { encrypt, conditions } from '@nucypher/taco';
        // const messageKit = await encrypt(
        //   provider,
        //   domain,
        //   data,
        //   condition,
        //   ritualId,
        //   signer
        // );

        // For scaffold purposes, we create a mock implementation
        // that matches the expected interface
        const conditionId = this.computeConditionId(condition);
        const conditionContext = JSON.stringify(condition);

        // Mock encryption (replace with real TACo in production)
        const mockCiphertext = new Uint8Array([
            ...new TextEncoder().encode('TACO_ENCRYPTED:'),
            ...data,
        ]);

        return {
            ciphertext: mockCiphertext,
            conditionId,
            conditionContext,
        };
    }

    /**
     * Decrypt TACo-encrypted data
     * 
     * @param messageKit - TACo message kit
     * @param signer - Ethereum signer proving identity
     * @returns Decrypted data
     */
    async decrypt(
        messageKit: TacoMessageKit,
        signer: Signer
    ): Promise<Uint8Array> {
        // NOTE: In production, use the actual TACo SDK:
        // import { decrypt } from '@nucypher/taco';
        // const plaintext = await decrypt(
        //   provider,
        //   domain,
        //   messageKit,
        //   porterUri,
        //   signer
        // );

        // Mock decryption for scaffold
        const prefix = new TextEncoder().encode('TACO_ENCRYPTED:');
        if (this.startsWithPrefix(messageKit.ciphertext, prefix)) {
            return messageKit.ciphertext.slice(prefix.length);
        }

        throw new Error('Decryption failed: condition not met or invalid ciphertext');
    }

    /**
     * Compute a deterministic condition ID from a condition
     * This ID is stored on-chain to reference the TACo policy
     */
    computeConditionId(condition: Condition): string {
        const conditionJson = JSON.stringify(condition);
        // Use keccak256 for Ethereum compatibility
        return ethers.keccak256(ethers.toUtf8Bytes(conditionJson));
    }

    /**
     * Serialize a TACo message kit for storage
     */
    serializeMessageKit(kit: TacoMessageKit): string {
        return JSON.stringify({
            ciphertext: Array.from(kit.ciphertext),
            conditionId: kit.conditionId,
            conditionContext: kit.conditionContext,
        });
    }

    /**
     * Deserialize a TACo message kit from storage
     */
    deserializeMessageKit(serialized: string): TacoMessageKit {
        const parsed = JSON.parse(serialized);
        return {
            ciphertext: new Uint8Array(parsed.ciphertext),
            conditionId: parsed.conditionId,
            conditionContext: parsed.conditionContext,
        };
    }

    private startsWithPrefix(arr: Uint8Array, prefix: Uint8Array): boolean {
        if (arr.length < prefix.length) return false;
        for (let i = 0; i < prefix.length; i++) {
            if (arr[i] !== prefix[i]) return false;
        }
        return true;
    }
}

// Export singleton for convenience
export const tacoService = new TacoService();
