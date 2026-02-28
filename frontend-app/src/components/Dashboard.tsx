import { useState, useEffect } from 'react'
import { type UserProfile, getDisplayName } from '../services/profile.service'
import { getPatientGrants, type AccessGrant } from '../services/access.service'
import { getPatientRecords, type StoredRecord } from '../services/recordStorage.service'
import { dataPoolService, type StakeStatus } from '../services/dataPool.service'
import { isDemoMode } from '../services/demoMode'

interface DashboardProps {
    walletAddress: string
    userProfile: UserProfile | null
    onUploadClick: () => void
    onShowQR: () => void
    onZkTlsImport: () => void
    refreshKey?: number
}

export function Dashboard({ walletAddress, userProfile, onUploadClick, onShowQR, onZkTlsImport, refreshKey = 0 }: DashboardProps) {
    const [records, setRecords] = useState<StoredRecord[]>([])
    const [grants, setGrants] = useState<AccessGrant[]>([])

    // Staking state
    const [stakeStatus, setStakeStatus] = useState<StakeStatus | null>(null)
    const [stakeStep, setStakeStep] = useState<string | null>(null)
    const [stakeError, setStakeError] = useState<string | null>(null)
    const [isStaking, setIsStaking] = useState(false)

    // Fetch records + grants
    useEffect(() => {
        if (walletAddress) {
            setRecords(getPatientRecords(walletAddress))
            setGrants(getPatientGrants(walletAddress))
        }
    }, [walletAddress, refreshKey])

    // Fetch staking status
    useEffect(() => {
        if (isDemoMode()) {
            setStakeStatus({
                isStaked: true,
                stakedAmount: BigInt(50) * BigInt(10 ** 18),
                tokenBalance: BigInt(1250) * BigInt(10 ** 18),
                minStake: BigInt(50) * BigInt(10 ** 18),
            })
            return
        }
        const fetchStakeStatus = async () => {
            try {
                await dataPoolService.connect()
                const status = await dataPoolService.checkStakeStatus(walletAddress)
                setStakeStatus(status)
            } catch (err) {
                console.warn('[Dashboard] Stake status check failed (contract may not be deployed):', err)
                // Set a default "not staked" status so the UI still works
                setStakeStatus({
                    isStaked: false,
                    stakedAmount: BigInt(0),
                    tokenBalance: BigInt(0),
                    minStake: BigInt(50) * BigInt(10 ** 18),
                })
            }
        }
        if (walletAddress) fetchStakeStatus()
    }, [walletAddress, refreshKey])

    // Calculate stats
    const totalRecords = records.length
    const activeGrants = grants.filter(g => g.status === 'active').length
    const uniqueProviders = new Set(grants.filter(g => g.status === 'active').map(g => g.providerAddress)).size

    // Staking handler
    const handleStake = async () => {
        setIsStaking(true)
        setStakeError(null)
        setStakeStep(null)

        try {
            await dataPoolService.connect()
            await dataPoolService.approveAndStake((step) => {
                setStakeStep(step)
            })

            // Refresh status
            const status = await dataPoolService.checkStakeStatus(walletAddress)
            setStakeStatus(status)
        } catch (err) {
            console.error('[Dashboard] Staking error:', err)
            setStakeError(err instanceof Error ? err.message : 'Staking failed. Please try again.')
        } finally {
            setIsStaking(false)
            setStakeStep(null)
        }
    }

    const formatTokenAmount = (wei: bigint): string => {
        const whole = wei / BigInt(10 ** 18)
        return whole.toLocaleString()
    }

    return (
        <div className="mb-8">
            {/* Welcome Banner */}
            <div className="glass-card p-6 mb-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-2xl font-bold text-white">
                                Welcome back, {getDisplayName(userProfile, true)}! 👋
                            </h2>
                            <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-medium">
                                👤 Patient Mode
                            </span>
                            {/* Staking Status Badge */}
                            {stakeStatus && (
                                stakeStatus.isStaked ? (
                                    <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium animate-pulse">
                                        🟢 Active Earner
                                    </span>
                                ) : totalRecords > 0 ? (
                                    <span className="px-3 py-1 rounded-full bg-slate-500/20 border border-slate-500/30 text-slate-400 text-xs font-medium">
                                        ⚪ Data Verified (Idle)
                                    </span>
                                ) : null
                            )}
                        </div>
                        <p className="text-slate-400">
                            Your medical records are safe and encrypted
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onUploadClick}
                            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors text-sm"
                        >
                            📤 Manual Upload
                        </button>
                        <button onClick={onZkTlsImport} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20">
                            🏥 Import Verified Records (ZK-TLS)
                        </button>
                    </div>
                </div>
            </div>

            {/* Stake to Earn Card — shown when records exist but not staked */}
            {stakeStatus && !stakeStatus.isStaked && totalRecords > 0 && (
                <div className="glass-card p-6 mb-6 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/20">
                    <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20 flex-shrink-0">
                                💰
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white mb-1">Stake to Earn</h3>
                                <p className="text-slate-400 text-sm mb-2">
                                    Stake <span className="text-amber-400 font-bold">50 RAPHA</span> to enter the AI Training Pool and start earning passive income from data usage fees (85% split).
                                </p>
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="text-slate-500">
                                        Wallet Balance: <span className="text-white font-mono">{formatTokenAmount(stakeStatus.tokenBalance)} RAPHA</span>
                                    </span>
                                    <span className="text-slate-500">
                                        Required: <span className="text-amber-400 font-mono">{formatTokenAmount(stakeStatus.minStake)} RAPHA</span>
                                    </span>
                                </div>
                                {stakeError && (
                                    <p className="text-red-400 text-xs mt-2">⚠️ {stakeError}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleStake}
                            disabled={isStaking}
                            className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {isStaking
                                ? stakeStep === 'approving' ? '⏳ Approving Token...'
                                    : stakeStep === 'approved' ? '✅ Approved'
                                        : stakeStep === 'staking' ? '⏳ Staking...'
                                            : stakeStep === 'staked' ? '✅ Staked!'
                                                : '⏳ Processing...'
                                : '🔐 Stake 50 RAPHA to Earn'
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* Active Earner Banner — shown when staked */}
            {stakeStatus?.isStaked && (
                <div className="glass-card p-4 mb-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl">
                            💎
                        </div>
                        <div className="flex-1">
                            <p className="text-green-400 text-sm font-semibold">Data Integrity Bond Active</p>
                            <p className="text-slate-400 text-xs">
                                You have staked <span className="text-white font-mono">{formatTokenAmount(stakeStatus.stakedAmount)} RAPHA</span>.
                                You are earning passive income from AI data usage fees.
                            </p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold">
                            Pool Member
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-amber-500/30 transition-colors group" onClick={onZkTlsImport}>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        🏥
                    </div>
                    <div>
                        <h4 className="font-medium text-white">Import Verified Records</h4>
                        <p className="text-sm text-amber-400/80">ZK-TLS secure import</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-indigo-500/30 transition-colors" onClick={onShowQR}>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-2xl">
                        📱
                    </div>
                    <div>
                        <h4 className="font-medium text-white">Share with Doctor</h4>
                        <p className="text-sm text-slate-400">Show QR code for easy sharing</p>
                    </div>
                </div>
                <div className="glass-card p-4 flex items-center gap-4 cursor-pointer hover:border-indigo-500/30 transition-colors" onClick={onUploadClick}>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-500/20 to-slate-600/20 flex items-center justify-center text-2xl">
                        📤
                    </div>
                    <div>
                        <h4 className="font-medium text-white">Manual Upload</h4>
                        <p className="text-sm text-slate-400">Self-report a document</p>
                    </div>
                </div>
            </div>

            {/* Profile Card */}
            {userProfile && (
                <div className="glass-card p-6 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Your Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-slate-500 mb-1">Full Name</p>
                            <p className="text-white font-medium">{userProfile.fullName}</p>
                        </div>
                        {userProfile.dateOfBirth && (
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Date of Birth</p>
                                <p className="text-white font-medium">{userProfile.dateOfBirth}</p>
                            </div>
                        )}
                        {userProfile.nationalId && (
                            <div>
                                <p className="text-xs text-slate-500 mb-1">National ID</p>
                                <p className="text-white font-medium font-mono">***{userProfile.nationalId.slice(-4)}</p>
                            </div>
                        )}
                        {userProfile.hospitalPatientId && (
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Hospital Patient ID</p>
                                <p className="text-white font-medium font-mono">{userProfile.hospitalPatientId}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    icon="📁"
                    label="Total Records"
                    value={totalRecords.toString()}
                    color="indigo"
                />
                <StatCard
                    icon="🔐"
                    label="Access Grants"
                    value={activeGrants.toString()}
                    color="purple"
                />
                <StatCard
                    icon="🏥"
                    label="Providers"
                    value={uniqueProviders.toString()}
                    color="cyan"
                />
            </div>
        </div>
    )
}

interface StatCardProps {
    icon: string
    label: string
    value: string
    color: 'indigo' | 'purple' | 'cyan'
}

function StatCard({ icon, label, value, color }: StatCardProps) {
    const colorClasses = {
        indigo: 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30',
        purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
        cyan: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
    }

    return (
        <div className={`glass-card p-6 bg-gradient-to-br ${colorClasses[color]}`}>
            <div className="flex items-center gap-4">
                <div className="text-4xl">{icon}</div>
                <div>
                    <p className="text-3xl font-bold text-white">{value}</p>
                    <p className="text-slate-400 text-sm">{label}</p>
                </div>
            </div>
        </div>
    )
}
