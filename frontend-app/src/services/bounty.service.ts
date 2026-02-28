/**
 * Bounty Service
 * Interacts with RaphaBountyFactory and RaphaBountyPool contracts
 */

// Contract addresses - will be set after deployment
const BOUNTY_FACTORY_ADDRESS = import.meta.env.VITE_BOUNTY_FACTORY_ADDRESS || ''
export const USDC_ADDRESS = import.meta.env.VITE_USDC_ADDRESS || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'

// Pool metadata structure stored on IPFS
export interface PoolMetadata {
    title: string
    description: string
    condition: string
    dataType: string
    organization: string
    contactEmail: string
    botName?: string
    repositoryUrl?: string
}

// Pool info from contract
export interface PoolInfo {
    address: string
    startup: string
    metadataCid: string
    metadata?: PoolMetadata
    bountyPerUser: bigint
    maxUsers: number
    deadline: number
    totalBudget: bigint
    state: 'OPEN' | 'FILLED' | 'EXECUTED' | 'EXPIRED'
    participantCount: number
}

// Check if factory is deployed
export function isFactoryDeployed(): boolean {
    return BOUNTY_FACTORY_ADDRESS.length > 0
}

// Factory ABI (subset for reading)
export const FACTORY_ABI = [
    'function getAllPools() external view returns (address[])',
    'function getActivePools() external view returns (address[])',
    'function getPoolsByStartup(address startup) external view returns (address[])',
    'function getPoolCount() external view returns (uint256)',
    'function getActivePoolCount() external view returns (uint256)',
    'function createPool(string memory metadataCid, uint256 bountyPerUser, uint256 maxUsers, uint256 duration) external returns (address)',
    'function usdc() external view returns (address)',
    'function treasury() external view returns (address)',
] as const

// Pool ABI
export const POOL_ABI = [
    'function getPoolInfo() external view returns (address startup, string metadataCid, uint256 bountyPerUser, uint256 maxUsers, uint256 deadline, uint256 totalBudget, uint8 state, uint256 participantCount)',
    'function joinPool() external',
    'function hasJoined(address user) external view returns (bool)',
    'function getParticipants() external view returns (address[])',
    'function getState() external view returns (uint8)',
    'function getTimeRemaining() external view returns (uint256)',
    'function getProgress() external view returns (uint256 current, uint256 max)',
] as const

// State mapping
const StateMap: Record<number, PoolInfo['state']> = {
    0: 'OPEN',
    1: 'FILLED',
    2: 'EXECUTED',
    3: 'EXPIRED'
}

/**
 * Mock pools for demo mode when factory is not deployed
 */
export function getMockPools(): PoolInfo[] {
    return [
        {
            address: '0x1234...demo',
            startup: '0xAI_Startup_1',
            metadataCid: 'QmDemo1',
            metadata: {
                title: 'Diabetes Prediction Model Training',
                description: 'Training AI model to predict diabetes risk from anonymized health data',
                condition: 'Diabetes Type 2',
                dataType: 'Blood glucose, BMI, lifestyle',
                organization: 'HealthAI Labs',
                contactEmail: 'research@healthai.demo'
            },
            bountyPerUser: BigInt(25 * 1e6), // 25 USDC
            maxUsers: 500,
            deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
            totalBudget: BigInt(12500 * 1e6),
            state: 'OPEN',
            participantCount: 127
        },
        {
            address: '0x5678...demo',
            startup: '0xAI_Startup_2',
            metadataCid: 'QmDemo2',
            metadata: {
                title: 'Heart Disease Risk Assessment',
                description: 'Training cardiovascular risk prediction models',
                condition: 'Cardiovascular',
                dataType: 'ECG, blood pressure, cholesterol',
                organization: 'CardioML Research',
                contactEmail: 'data@cardioml.demo'
            },
            bountyPerUser: BigInt(50 * 1e6), // 50 USDC
            maxUsers: 200,
            deadline: Date.now() + 14 * 24 * 60 * 60 * 1000,
            totalBudget: BigInt(10000 * 1e6),
            state: 'OPEN',
            participantCount: 45
        }
    ]
}

/**
 * Parse pool state number to string
 */
export function parseState(stateNum: number): PoolInfo['state'] {
    return StateMap[stateNum] || 'EXPIRED'
}

/**
 * Format USDC amount (6 decimals)
 */
export function formatUSDC(amount: bigint): string {
    const value = Number(amount) / 1e6
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

/**
 * Calculate time remaining string
 */
export function formatTimeRemaining(deadline: number): string {
    const now = Date.now()
    const remaining = deadline - now

    if (remaining <= 0) return 'Expired'

    const days = Math.floor(remaining / (24 * 60 * 60 * 1000))
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))

    if (days > 0) return `${days}d ${hours}h left`
    if (hours > 0) return `${hours}h left`
    return 'Less than 1h'
}
