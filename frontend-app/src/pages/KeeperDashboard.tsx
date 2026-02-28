import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AuthModal } from '../components/AuthModal'
import { hasStoredWallet } from '../services/wallet.service'
import { type UserProfile } from '../services/profile.service'
import { PageFooter } from '../components/PageFooter'
import { isDemoMode, DEMO_WALLET, DEMO_PATIENT_PROFILE, DEMO_SUBMISSIONS, seedDemoData } from '../services/demoMode'

// Mock data for layout (contract isn't deployed yet)
interface Submission {
    id: number
    patient: string
    dataCid: string
    isVerified: boolean
    isPaid: boolean
    recordType?: string
    submittedAt?: number
}

export function KeeperDashboard() {
    const [isConnected, setIsConnected] = useState(false)
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const [_userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [verifyingId, setVerifyingId] = useState<number | null>(null)

    useEffect(() => {
        if (isDemoMode()) {
            seedDemoData()
            setWalletAddress(DEMO_WALLET)
            setUserProfile({ ...DEMO_PATIENT_PROFILE, fullName: 'Dr. Marcus Webb', role: 'provider' })
            setIsConnected(true)
        }
    }, [])

    const handleAuthSuccess = (address: string, profile: UserProfile) => {
        setWalletAddress(address)
        setUserProfile(profile)
        setIsConnected(true)
        setShowAuthModal(false)
    }

    const handleDisconnect = () => {
        setIsConnected(false)
        setWalletAddress(null)
        setUserProfile(null)
    }

    // Load submissions once connected
    useEffect(() => {
        if (isConnected) {
            if (isDemoMode()) {
                setSubmissions(DEMO_SUBMISSIONS)
            } else {
                setSubmissions([
                    { id: 0, patient: '0x123...abc', dataCid: 'bafy...data1', isVerified: false, isPaid: false },
                    { id: 1, patient: '0x456...def', dataCid: 'bafy...data2', isVerified: true, isPaid: true },
                    { id: 2, patient: '0x789...ghi', dataCid: 'bafy...data3', isVerified: false, isPaid: false },
                ])
            }
        }
    }, [isConnected])


    const handleVerify = async (id: number, isValid: boolean) => {
        setVerifyingId(id)
        // Simulate on-chain verification (will be replaced with real contract call)
        await new Promise(resolve => setTimeout(resolve, 1500))
        setSubmissions(prev => prev.map(s =>
            s.id === id ? { ...s, isVerified: isValid, isPaid: isValid } : s
        ))
        setVerifyingId(null)
    }

    // ============ Not Connected State ============
    if (!isConnected) {
        return (
            <div className="min-h-screen bg-slate-950">
                <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <img src="/rapha-logo.png" alt="Rapha Protocol" className="w-10 h-10 rounded-xl" />
                                <span className="text-xl font-bold text-white">Rapha Protocol</span>
                            </Link>
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                                <span className="text-sm text-emerald-400 font-medium">Keeper Network</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-6 py-8">
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="glass-card p-12 text-center max-w-lg">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-4xl">
                                🛡️
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Keeper Dashboard</h2>
                            <p className="text-slate-400 mb-8">
                                Connect your wallet to access the Keeper verification interface.
                                Review and validate patient data submissions to earn rewards.
                            </p>
                            <div className="space-y-4">
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="btn-gradient text-lg px-8 py-4 w-full"
                                >
                                    {hasStoredWallet() ? 'Sign In' : 'Connect Wallet'}
                                </button>
                                <Link to="/keeper-apply" className="block w-full">
                                    <button className="w-full px-8 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all flex items-center justify-center gap-2 group">
                                        <span>📋</span> Apply to Become a Keeper <span className="text-slate-500 group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </Link>
                                <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                    <p className="text-sm text-slate-400">
                                        <span className="text-emerald-400 font-medium">💰 Earn Rewards:</span> Keepers receive 10% of every validated data transaction as professional fees.
                                    </p>
                                </div>
                            </div>
                            <Link to="/" className="block mt-6 text-slate-500 hover:text-white transition-colors">
                                ← Back to Home
                            </Link>
                        </div>
                    </div>
                </main>

                {showAuthModal && (
                    <AuthModal
                        onSuccess={handleAuthSuccess}
                        onClose={() => setShowAuthModal(false)}
                    />
                )}

                <PageFooter />
            </div>
        )
    }

    // ============ Connected — Dashboard ============
    const pendingCount = submissions.filter(s => !s.isVerified).length

    return (
        <div className="min-h-screen bg-slate-950">
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <img src="/rapha-logo.png" alt="Rapha Protocol" className="w-10 h-10 rounded-xl" />
                            <span className="text-xl font-bold text-white">Rapha Protocol</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-sm text-emerald-400 font-medium">Keeper Active</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm text-slate-400">Total Earned</p>
                            <p className="text-emerald-400 font-mono font-bold">1,250 USDC</p>
                        </div>
                        <div className="hidden md:block text-right">
                            <p className="text-xs text-slate-500">Connected</p>
                            <p className="text-xs text-slate-400 font-mono">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
                        </div>
                        <button
                            onClick={handleDisconnect}
                            className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-card p-6">
                        <p className="text-slate-400 text-sm mb-1">Pending Reviews</p>
                        <p className="text-3xl font-bold text-white">{pendingCount}</p>
                    </div>
                    <div className="glass-card p-6">
                        <p className="text-slate-400 text-sm mb-1">Verified Total</p>
                        <p className="text-3xl font-bold text-emerald-400">142</p>
                    </div>
                    <div className="glass-card p-6">
                        <p className="text-slate-400 text-sm mb-1">Accuracy Score</p>
                        <p className="text-3xl font-bold text-purple-400">98.5%</p>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white mb-6">Pending Submissions</h2>

                <div className="space-y-4">
                    {submissions.map((sub) => (
                        <div key={sub.id} className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${sub.isVerified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                        {sub.isVerified ? 'VERIFIED' : 'PENDING REVIEW'}
                                    </span>
                                    <span className="text-xs text-slate-500 font-mono">ID: {sub.id}</span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Data Submission</h3>
                                <div className="text-sm text-slate-400 font-mono flex items-center gap-2">
                                    <span>Patient: {sub.patient}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                    <a href={`https://ipfs.io/ipfs/${sub.dataCid}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 hover:underline">
                                        View Data Package ↗
                                    </a>
                                </div>
                            </div>

                            {!sub.isVerified ? (
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => handleVerify(sub.id, false)}
                                        disabled={verifyingId === sub.id}
                                        className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleVerify(sub.id, true)}
                                        disabled={verifyingId === sub.id}
                                        className="flex-1 md:flex-none btn-gradient px-6 py-2 flex items-center justify-center gap-2"
                                    >
                                        {verifyingId === sub.id ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <span>✅</span> Verify & Earn
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="text-emerald-400 font-medium flex items-center gap-2">
                                    <span>✓ Verified</span>
                                    <span className="text-xs opacity-70">(Paid)</span>
                                </div>
                            )}
                        </div>
                    ))}

                    {submissions.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No submissions pending review.
                        </div>
                    )}
                </div>
            </main>
            <PageFooter />
        </div>
    )
}
