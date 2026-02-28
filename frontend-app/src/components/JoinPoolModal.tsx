import { useState } from 'react'
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits } from 'viem'
import { RAPHA_BOUNTY_POOL_ABI, ERC20_ABI, USDC_ADDRESS } from '../config/contracts'

export interface JoinSettings {
    recordIds: string[]
    termsAccepted: boolean
}

interface BountyPool {
    address: string
    metadataCid: string
    condition: string
    dataType: string
    companyName: string
    bountyPerUser: number
    maxUsers: number
    currentParticipants: number
    deadline: number
    totalBudget: number
    state: 'OPEN' | 'FILLED' | 'EXECUTED' | 'EXPIRED'
}

interface JoinPoolModalProps {
    pool: BountyPool
    onConfirm: (settings: JoinSettings) => Promise<void>
    onClose: () => void
}

export function JoinPoolModal({ pool, onConfirm, onClose }: JoinPoolModalProps) {
    const { address: userAddress } = useAccount()

    // Local State
    const [agreed, setAgreed] = useState(false)
    const [stakeAmount, setStakeAmount] = useState('50') // Default 50 USDC

    // Wagmi Hooks
    const { writeContract: writeApprove, data: approveTxHash, isPending: isApproving } = useWriteContract()
    const { writeContract: writeJoin, data: joinTxHash, isPending: isJoiningContract } = useWriteContract()

    const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
        hash: approveTxHash,
    })

    const { isLoading: isJoinConfirming, isSuccess: isJoinSuccess } = useWaitForTransactionReceipt({
        hash: joinTxHash,
    })

    // Read Allowance
    const { data: allowance } = useReadContract({
        address: USDC_ADDRESS as `0x${string}`, // Check USDC Allowance
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [userAddress as `0x${string}`, pool.address as `0x${string}`],
        query: {
            enabled: !!userAddress && !!pool.address,
        }
    })

    const parsedStakeAmount = stakeAmount ? parseUnits(stakeAmount, 6) : 0n // USDC has 6 decimals
    const hasAllowance = allowance ? allowance >= parsedStakeAmount : false

    // State Logic
    const isProcessing = isApproving || isApproveConfirming || isJoiningContract || isJoinConfirming
    const needsApproval = !hasAllowance && !isApproveSuccess

    // Handlers
    const handleApprove = () => {
        if (!parsedStakeAmount) return
        writeApprove({
            address: USDC_ADDRESS as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [pool.address as `0x${string}`, parsedStakeAmount],
        })
    }

    const handleJoin = () => {
        if (!parsedStakeAmount) return
        writeJoin({
            address: pool.address as `0x${string}`,
            abi: RAPHA_BOUNTY_POOL_ABI,
            functionName: 'joinPool',
            args: [parsedStakeAmount],
        })
    }

    // Effect: Auto-trigger join or close on success could be added, but manual is better for now.
    // If join success, call onConfirm to update backend/UI if needed
    if (isJoinSuccess) {
        // Delay slightly to show success state
        setTimeout(() => {
            onConfirm({ recordIds: [], termsAccepted: true }).then(onClose)
        }, 2000)
    }

    const daysRemaining = Math.ceil((pool.deadline - Date.now() / 1000) / 86400)

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Join Research Pool</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Pool Info */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                    <h3 className="font-bold text-white mb-2">{pool.condition} Research</h3>
                    <p className="text-sm text-slate-400 mb-3">Sponsored by {pool.companyName}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-slate-500">Reward:</span>
                            <span className="text-emerald-400 font-bold ml-2">${pool.bountyPerUser} USDC</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Stake Required:</span>
                            <span className="text-amber-400 font-bold ml-2">USDC</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Participants:</span>
                            <span className="text-white ml-2">{pool.currentParticipants}/{pool.maxUsers}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Days Left:</span>
                            <span className="text-amber-400 ml-2">{daysRemaining}</span>
                        </div>
                    </div>
                </div>

                {/* Stake Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Stake Amount (USDC)</label>
                    <div className="relative">
                        <input
                            type="number"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                            placeholder="50"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">USDC</div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Standard stake is 50 USDC. This ensures data quality and commitment.
                    </p>
                </div>

                {/* Privacy Info */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-6">
                    <h4 className="text-sm font-medium text-emerald-400 mb-2">Privacy Protected</h4>
                    <p className="text-xs text-slate-400">
                        Your data will be processed using federated learning. Raw data never leaves your control -
                        only encrypted model updates are shared.
                    </p>
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 mb-6 cursor-pointer p-4 rounded-xl bg-white/5 border border-white/10">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-1"
                    />
                    <span className="text-sm text-slate-400">
                        I agree to stake {stakeAmount || '0'} USDC. I understand this stake protects the integrity of the pool.
                        I will receive {pool.bountyPerUser} USDC upon successful completion.
                    </span>
                </label>

                {/* Wallet Info */}
                <div className="text-xs text-slate-500 mb-4 text-center">
                    Joining as: <span className="font-mono">{userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}</span>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                    {/* Error Display */}
                    {/* Steps UI */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>

                        {!userAddress ? (
                            <button className="flex-1 btn-gradient">Connect Wallet</button>
                            // Ideally handled by RainbowKit ConnectButton, assuming parent handles connection or valid user
                        ) : isJoinSuccess ? (
                            <button className="flex-1 bg-emerald-500 text-white rounded-xl py-3 cursor-default">
                                ✅ Active in Pool
                            </button>
                        ) : needsApproval ? (
                            <button
                                onClick={handleApprove}
                                disabled={!agreed || isProcessing || !stakeAmount}
                                className="flex-1 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isApproving || isApproveConfirming ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Approving...
                                    </>
                                ) : (
                                    `Approve ${stakeAmount || '0'} USDC`
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleJoin}
                                disabled={!agreed || isProcessing || !stakeAmount}
                                className="flex-1 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isJoiningContract || isJoinConfirming ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Joining Pool...
                                    </>
                                ) : (
                                    'Join Pool'
                                )}
                            </button>
                        )}
                    </div>

                    {/* Transaction Hashes */}
                    {approveTxHash && <div className="text-xs text-slate-500 text-center truncate">Approve Tx: {approveTxHash}</div>}
                    {joinTxHash && <div className="text-xs text-slate-500 text-center truncate">Join Tx: {joinTxHash}</div>}
                </div>
            </div>
        </div>
    )

}
