/**
 * Aura Health Backend Oracle - Main Exports
 * 
 * SDK for interacting with the Aura Health medical blockchain.
 */

// Crypto services
export {
    generateAESKey,
    importAESKey,
    encryptFile,
    decryptFile,
    computeIntegrityHash,
    type AESKey,
    type EncryptedPayload,
} from './crypto/aes.service.js';

export {
    TacoService,
    tacoService,
    type Condition,
    type EvmCondition,
    type TimeCondition,
    type CompoundCondition,
    type TacoMessageKit,
    type TacoDomain,
} from './crypto/taco.service.js';

export {
    generateWallet,
    walletFromMnemonic,
    walletFromPrivateKey,
    generateMnemonic,
    signMessage,
    verifyMessage,
    deriveAccounts,
    type KeyPair,
} from './crypto/keys.service.js';

// Storage services
export {
    IPFSService,
    createIPFSServiceFromEnv,
    type IPFSUploadResult,
    type IPFSServiceConfig,
} from './storage/ipfs.service.js';

// Chain services
export {
    createProvider,
    createWallet,
    getDevnetProvider,
    getDevnetSigner,
    waitForTransaction,
    getBlockNumber,
    getBalance,
    NETWORKS,
    type NetworkConfig,
} from './chain/provider.js';

export {
    RegistryService,
    createDevnetRegistryService,
    type MedicalRecord,
    type RegisterRecordParams,
} from './chain/registry.service.js';

// Types
export type {
    RecordType,
    OnChainRecord,
    EncryptedPackage,
    UserRole,
    PatientProfile,
    ProviderProfile,
    AccessGrant,
    UploadRequest,
    UploadResult,
} from './types/index.js';
