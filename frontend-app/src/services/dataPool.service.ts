/**
 * DataPool Service — Patient Staking for Global Data Pool
 *
 * Wraps the RaphaDataPool and RaphaToken contracts.
 * Handles token approval, staking, status checks, and balance queries.
 *
 * Flow:
 *   1. Patient checks stake status via checkStakeStatus()
 *   2. If not staked, calls approveAndStake()
 *      - Step 1: raphaToken.approve(dataPoolAddress, MIN_STAKE)
 *      - Step 2: dataPool.joinDataPool()
 *   3. Patient is now an Active Earner
 */

import { ethers } from 'ethers'

// ============================================================
// Types
// ============================================================

export interface StakeStatus {
    /** Whether the patient has staked enough to be a pool member */
    isStaked: boolean
    /** Current staked amount in wei */
    stakedAmount: bigint
    /** Token balance in wallet (in wei) */
    tokenBalance: bigint
    /** Minimum required stake in wei */
    minStake: bigint
}

export interface PoolStats {
    totalStaked: bigint
    memberCount: number
    minStake: bigint
}

// ============================================================
// Contract Config
// ============================================================

const RAPHA_TOKEN_ADDRESS = import.meta.env.VITE_RAPHA_TOKEN_ADDRESS
    || '0x0000000000000000000000000000000000000000'

const DATA_POOL_ADDRESS = import.meta.env.VITE_DATA_POOL_ADDRESS
    || '0x0000000000000000000000000000000000000000'

const MIN_PATIENT_STAKE = BigInt(50) * BigInt(10 ** 18) // 50 RAPHA

const TOKEN_ABI = [
    'function balanceOf(address owner) view returns (uint256)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
]

const POOL_ABI = [
    'function joinDataPool() external',
    'function leaveDataPool() external',
    'function isPoolMember(address patient) view returns (bool)',
    'function getStake(address patient) view returns (uint256)',
    'function getPoolStats() view returns (uint256 totalStaked, uint256 memberCount, uint256 minStake)',
    'function patientStakes(address) view returns (uint256)',
    'function MIN_PATIENT_STAKE() view returns (uint256)',
    'event PoolJoined(address indexed patient, uint256 amount)',
    'event PoolLeft(address indexed patient, uint256 amount)',
]

// ============================================================
// DataPoolService
// ============================================================

class DataPoolService {
    private provider: ethers.BrowserProvider | null = null
    private signer: ethers.Signer | null = null
    private tokenContract: ethers.Contract | null = null
    private poolContract: ethers.Contract | null = null

    /**
     * Connect to the blockchain via MetaMask / injected provider.
     */
    async connect(): Promise<void> {
        const eth = (window as any).ethereum
        if (!eth) throw new DataPoolError('NO_WALLET', 'No Ethereum wallet detected')

        this.provider = new ethers.BrowserProvider(eth)
        this.signer = await this.provider.getSigner()

        this.tokenContract = new ethers.Contract(RAPHA_TOKEN_ADDRESS, TOKEN_ABI, this.signer)
        this.poolContract = new ethers.Contract(DATA_POOL_ADDRESS, POOL_ABI, this.signer)
    }

    private ensureConnected() {
        if (!this.tokenContract || !this.poolContract) {
            throw new DataPoolError('NOT_CONNECTED', 'DataPoolService not connected. Call connect() first.')
        }
        return { token: this.tokenContract, pool: this.poolContract }
    }

    // ============================================================
    // Read Methods
    // ============================================================

    /**
     * Check the patient's stake status and token balance.
     */
    async checkStakeStatus(address: string): Promise<StakeStatus> {
        const { token, pool } = this.ensureConnected()

        const [isStaked, stakedAmount, tokenBalance] = await Promise.all([
            pool.isPoolMember(address) as Promise<boolean>,
            pool.getStake(address) as Promise<bigint>,
            token.balanceOf(address) as Promise<bigint>,
        ])

        return {
            isStaked,
            stakedAmount,
            tokenBalance,
            minStake: MIN_PATIENT_STAKE,
        }
    }

    /**
     * Get global pool statistics.
     */
    async getPoolStats(): Promise<PoolStats> {
        const { pool } = this.ensureConnected()
        const [totalStaked, memberCount, minStake] = await pool.getPoolStats()
        return {
            totalStaked,
            memberCount: Number(memberCount),
            minStake,
        }
    }

    // ============================================================
    // Write Methods
    // ============================================================

    /**
     * Approve RAPHA spending and then stake into the Data Pool.
     *
     * Two-step process:
     *   1. ERC-20 approve (token → pool contract)
     *   2. joinDataPool() call
     *
     * @param onStep Callback for UI progress updates
     */
    async approveAndStake(
        onStep?: (step: 'approving' | 'approved' | 'staking' | 'staked') => void
    ): Promise<ethers.TransactionReceipt> {
        const { token, pool } = this.ensureConnected()

        // Step 1: Approve
        onStep?.('approving')
        const approveTx = await token.approve(DATA_POOL_ADDRESS, MIN_PATIENT_STAKE)
        await approveTx.wait()
        onStep?.('approved')

        // Step 2: Stake
        onStep?.('staking')
        const stakeTx = await pool.joinDataPool()
        const receipt = await stakeTx.wait()
        onStep?.('staked')

        return receipt
    }

    /**
     * Leave the data pool and unstake RAPHA.
     */
    async leavePool(): Promise<ethers.TransactionReceipt> {
        const { pool } = this.ensureConnected()
        const tx = await pool.leaveDataPool()
        return tx.wait()
    }
}

// ============================================================
// Error
// ============================================================

type DataPoolErrorCode = 'NO_WALLET' | 'NOT_CONNECTED' | 'TX_FAILED'

class DataPoolError extends Error {
    code: DataPoolErrorCode
    constructor(code: DataPoolErrorCode, message: string) {
        super(message)
        this.code = code
        this.name = 'DataPoolError'
    }
}

// ============================================================
// Singleton
// ============================================================

export const dataPoolService = new DataPoolService()
