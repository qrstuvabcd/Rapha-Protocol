import { useState } from 'react'
import { type BountyPool } from './BountyOpportunities'

interface BountyCardProps {
    pool: BountyPool
    hasJoined: boolean
    onJoin: () => void
}

export function BountyCard({ pool, hasJoined, onJoin }: BountyCardProps) {
    const [isJoining, setIsJoining] = useState(false)

    const progress = (pool.currentParticipants / pool.maxUsers) * 100
    const timeRemaining = Math.max(0, pool.deadline - Date.now())
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60))
    const daysRemaining = Math.floor(hoursRemaining / 24)

    const handleJoin = async () => {
        setIsJoining(true)
        try {
            await onJoin()
        } finally {
            setIsJoining(false)
        }
    }

    const getTimeDisplay = () => {
        if (daysRemaining > 0) return `${daysRemaining} days left`
        if (hoursRemaining > 0) return `${hoursRemaining} hours left`
        return 'Ending soon'
    }

    return (
        <div className="glass-card p-6 hover:border-indigo-500/30 transition-colors">
            <div className="flex items-start justify-between gap-6">
                {/* Left: Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                            {pool.dataType === 'MRI' && '🧠'}
                            {pool.dataType === 'Blood' && '🩸'}
                            {pool.dataType === 'X-Ray' && '📷'}
                            {pool.dataType === 'Genomics' && '🧬'}
                            {pool.dataType === 'Lab' && '🧪'}
                            {!['MRI', 'Blood', 'X-Ray', 'Genomics', 'Lab'].includes(pool.dataType) && '📊'}
                        </div>
                        <div>
                            <h3 className="font-bold text-white">{pool.condition} Research</h3>
                            <p className="text-sm text-slate-400">{pool.companyName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                        <span className="flex items-center gap-1">
                            📋 {pool.dataType}
                        </span>
                        <span className="flex items-center gap-1">
                            ⏱️ {getTimeDisplay()}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Participants</span>
                            <span className="text-white font-medium">
                                {pool.currentParticipants} / {pool.maxUsers}
                            </span>
                        </div>
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Reward + Action */}
                <div className="text-right flex flex-col items-end gap-3">
                    <div>
                        <p className="text-xs text-slate-500">Your Reward</p>
                        <p className="text-2xl font-bold text-emerald-400">
                            ${pool.bountyPerUser}
                            <span className="text-sm text-slate-500 ml-1">USDC</span>
                        </p>
                    </div>

                    {hasJoined ? (
                        <div className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-medium">
                            ✓ Joined
                        </div>
                    ) : (
                        <button
                            onClick={handleJoin}
                            disabled={isJoining || pool.state !== 'OPEN'}
                            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${isJoining || pool.state !== 'OPEN'
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : 'btn-gradient hover:scale-105'
                                }`}
                        >
                            {isJoining ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Joining...
                                </span>
                            ) : (
                                'Join Pool'
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
