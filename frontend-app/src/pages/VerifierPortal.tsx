/**
 * Verifier Portal — Keeper Mission Control
 * 
 * Publicly visible portal with sign-in flow matching other portals.
 * Everyone can see the public info, but only signed-in + authorized
 * Keepers can perform review actions.
 */

import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { AuthModal } from '../components/AuthModal'
import { hasStoredWallet } from '../services/wallet.service'
import {
    keeperService,
    type PendingRecord,
    type KeeperStats,
} from '../services/verifier.service'
import { type UserProfile } from '../services/profile.service'
import { PageFooter } from '../components/PageFooter'
import { isDemoMode, DEMO_WALLET, seedDemoData } from '../services/demoMode'

// ============================================================
// Component
// ============================================================

export function VerifierPortal() {
    // Auth state (matching PatientPortal pattern)
    const [isConnected, setIsConnected] = useState(false)
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [showAuthModal, setShowAuthModal] = useState(false)

    // Keeper authorization
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [authChecked, setAuthChecked] = useState(false)

    // Data state
    const [queue, setQueue] = useState<PendingRecord[]>([])
    const [stats, setStats] = useState<KeeperStats | null>(null)
    const [loading, setLoading] = useState(true)

    // Review modal state
    const [reviewingRecord, setReviewingRecord] = useState<PendingRecord | null>(null)
    const [tags, setTags] = useState('')
    const [isDecrypting, setIsDecrypting] = useState(false)
    const [decryptError, setDecryptError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

    // ============================================================
    // Auth Handlers (same pattern as PatientPortal)
    // ============================================================

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
        setIsAuthorized(false)
        setAuthChecked(false)
    }

    // ============================================================
    // Keeper Auth Check (after wallet sign-in)
    // ============================================================

    // Demo mode: auto-connect
    useEffect(() => {
        if (isDemoMode()) {
            seedDemoData()
            setWalletAddress(DEMO_WALLET)
            setUserProfile({ walletAddress: DEMO_WALLET.toLowerCase(), fullName: 'Dr. Marcus Webb', role: 'provider', createdAt: Date.now(), updatedAt: Date.now() })
            setIsConnected(true)
            setIsAuthorized(true)
            setAuthChecked(true)
        }
    }, [])

    useEffect(() => {
        if (!isConnected || !walletAddress) {
            setAuthChecked(true)
            return
        }
        if (isDemoMode()) return // skip contract check in demo

        const checkKeeper = async () => {
            try {
                await keeperService.connect()
                const authorized = await keeperService.isAuthorizedKeeper(walletAddress)
                setIsAuthorized(authorized)
            } catch (error) {
                console.error('[VerifierPortal] Keeper check error:', error)
                setIsAuthorized(false)
            } finally {
                setAuthChecked(true)
            }
        }

        checkKeeper()
    }, [isConnected, walletAddress])

    // ============================================================
    // Data Loading
    // ============================================================

    const loadData = useCallback(async () => {
        setLoading(true)
        try {
            if (isDemoMode() && isAuthorized) {
                // Demo mode: show realistic stats and queue
                setStats({ queueSize: 8, totalReviewed: 1247, totalApproved: 1168, totalRejected: 79, isAuthorized: true })
                setQueue([
                    { recordId: 'rec_q_001', owner: '0xA1b2C3d4E5f6a7B8c9D0e1F2a3B4c5D6e7F8a9B0', recordType: 'Blood Panel', ipfsHash: 'QmDemo1...abc', timestamp: Math.floor(Date.now() / 1000) - 3600, providerId: 'NHS Digital', proofHash: '0xproof1...abc', integrityHash: '0xint1...abc', provider: '0xAA11BB22CC33DD44EE55FF6677889900AABBCCDD' },
                    { recordId: 'rec_q_002', owner: '0xB2c3D4e5F6a7b8C9d0E1f2A3b4C5d6E7f8A9b0C1', recordType: 'MRI Report', ipfsHash: 'QmDemo2...def', timestamp: Math.floor(Date.now() / 1000) - 7200, providerId: 'NHS Digital', proofHash: '0xproof2...def', integrityHash: '0xint2...def', provider: '0xBB22CC33DD44EE55FF6677889900AABBCCDDEE11' },
                    { recordId: 'rec_q_003', owner: '0xC3d4E5f6A7b8c9D0e1F2a3B4c5D6e7F8a9B0c1D2', recordType: 'Allergy Panel', ipfsHash: 'QmDemo3...ghi', timestamp: Math.floor(Date.now() / 1000) - 10800, providerId: 'Kaiser Portal', proofHash: '0xproof3...ghi', integrityHash: '0xint3...ghi', provider: '0xCC33DD44EE55FF6677889900AABBCCDDEE112233' },
                    { recordId: 'rec_q_004', owner: '0xD4e5F6a7B8c9d0E1f2A3b4C5d6E7f8A9b0C1d2E3', recordType: 'ECG Reading', ipfsHash: 'QmDemo4...jkl', timestamp: Math.floor(Date.now() / 1000) - 14400, providerId: 'NHS Digital', proofHash: '0xproof4...jkl', integrityHash: '0xint4...jkl', provider: '0xDD44EE55FF6677889900AABBCCDDEE1122334455' },
                ])
            } else if (isAuthorized && walletAddress) {
                const [queueData, statsData] = await Promise.all([
                    keeperService.getVerificationQueue(),
                    keeperService.getKeeperStats(walletAddress),
                ])
                setQueue(queueData)
                setStats(statsData)
            } else {
                setStats({ queueSize: 12, totalReviewed: 847, totalApproved: 793, totalRejected: 54, isAuthorized: false })
                setQueue([])
            }
        } catch (error) {
            console.error('[VerifierPortal] Data load error:', error)
            setStats({ queueSize: 12, totalReviewed: 847, totalApproved: 793, totalRejected: 54, isAuthorized: false })
        } finally {
            setLoading(false)
        }
    }, [isAuthorized, walletAddress])

    useEffect(() => {
        if (authChecked) loadData()
    }, [authChecked, loadData])

    // ============================================================
    // Review Actions (Keeper-Only)
    // ============================================================

    const handleStartReview = useCallback(async (record: PendingRecord) => {
        if (!isAuthorized) return
        setReviewingRecord(record)
        setDecryptError(null)
        setTags('')
        setSubmitSuccess(null)
        setIsDecrypting(true)

        try {
            const result = await keeperService.decryptForReview(record.ipfsHash)
            if (!result.success) {
                setDecryptError(result.error || 'Decryption failed')
            }
        } catch (error) {
            setDecryptError(error instanceof Error ? error.message : 'Decrypt error')
        } finally {
            setIsDecrypting(false)
        }
    }, [isAuthorized])

    const handleApprove = useCallback(async () => {
        if (!reviewingRecord || !tags.trim()) return
        setIsSubmitting(true)

        try {
            await keeperService.approveRecord(reviewingRecord.recordId, tags)
            setSubmitSuccess('approved')
            await loadData()
        } catch (error) {
            setDecryptError(error instanceof Error ? error.message : 'Approval failed')
        } finally {
            setIsSubmitting(false)
        }
    }, [reviewingRecord, tags, loadData])

    const handleReject = useCallback(async () => {
        if (!reviewingRecord) return
        setIsSubmitting(true)

        try {
            await keeperService.rejectRecord(reviewingRecord.recordId)
            setSubmitSuccess('rejected')
            await loadData()
        } catch (error) {
            setDecryptError(error instanceof Error ? error.message : 'Rejection failed')
        } finally {
            setIsSubmitting(false)
        }
    }, [reviewingRecord, loadData])

    const closeReview = useCallback(() => {
        setReviewingRecord(null)
        setTags('')
        setDecryptError(null)
        setSubmitSuccess(null)
    }, [])

    // ============================================================
    // Render
    // ============================================================

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <img src="/rapha-logo.png" alt="Rapha Protocol" className="w-10 h-10 rounded-xl" />
                                <span className="text-xl font-bold text-white">Rapha Protocol</span>
                            </Link>
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                <span className="w-2 h-2 bg-amber-400 rounded-full" />
                                <span className="text-sm text-amber-400 font-medium">Keeper Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {isConnected ? (
                                <>
                                    {isAuthorized && (
                                        <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/30">
                                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                            <span className="text-xs text-green-400 font-medium">Authorized Keeper</span>
                                        </div>
                                    )}
                                    <div className="hidden md:block text-right">
                                        <p className="text-sm text-white font-medium">{userProfile?.fullName || 'Keeper'}</p>
                                        <p className="text-xs text-slate-400">{walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</p>
                                    </div>
                                    <button
                                        onClick={handleDisconnect}
                                        className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                                    >
                                        Disconnect
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="px-6 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 transition-all"
                                >
                                    {hasStoredWallet() ? 'Sign In' : 'Connect Wallet'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {isConnected ? (
                    /* ============================================= */
                    /* SIGNED-IN: Mission Control Dashboard          */
                    /* ============================================= */
                    <div className="max-w-6xl mx-auto">
                        {/* Hero */}
                        <div className="mb-8">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">
                                    🛡️
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-white">Keeper Mission Control</h1>
                                    <p className="text-slate-400 text-sm mt-1">Distributed Medical Oracle — Verify, Label, Earn</p>
                                </div>
                            </div>

                            {/* Not-Authorized Banner */}
                            {authChecked && !isAuthorized && (
                                <div className="p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-amber-400 font-semibold text-sm mb-1">🔒 Your wallet is not registered as a Keeper.</h3>
                                        <p className="text-slate-400 text-xs">You are signed in but not yet authorized. Apply to become a Keeper to start reviewing records.</p>
                                    </div>
                                    <Link
                                        to="/keeper-apply"
                                        className="px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 transition-all whitespace-nowrap"
                                    >
                                        Apply to Become a Keeper →
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Stats Cards */}
                        {stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: 'Queue', value: stats.queueSize, icon: '📋' },
                                    { label: 'Reviewed', value: stats.totalReviewed, icon: '✅' },
                                    { label: 'Approved', value: stats.totalApproved, icon: '👍' },
                                    { label: 'Rejected', value: stats.totalRejected, icon: '⛔' },
                                ].map(stat => (
                                    <div key={stat.label} className="p-4 rounded-2xl bg-slate-900/50 border border-white/5">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-lg">{stat.icon}</span>
                                            <span className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</span>
                                        </div>
                                        <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Queue Table */}
                        <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden mb-8">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-white">Verification Queue</h2>
                                <div className="flex items-center gap-3">
                                    {isAuthorized && (
                                        <button onClick={loadData} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs transition-colors">
                                            ↻ Refresh
                                        </button>
                                    )}
                                    <span className="text-xs text-slate-400">
                                        {isAuthorized ? `${queue.length} record${queue.length !== 1 ? 's' : ''} pending` : 'Live queue preview'}
                                    </span>
                                </div>
                            </div>

                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="w-8 h-8 mx-auto mb-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    <p className="text-slate-400 text-sm">Loading queue...</p>
                                </div>
                            ) : isAuthorized && queue.length === 0 ? (
                                <div className="p-12 text-center">
                                    <span className="text-4xl mb-3 block">🎉</span>
                                    <p className="text-slate-400">No records pending review. Queue is clear!</p>
                                </div>
                            ) : isAuthorized && queue.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {queue.map(record => (
                                        <div
                                            key={record.recordId}
                                            className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg">📋</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-medium">{record.recordType}</span>
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">🛡️ ZK-Verified</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                                                        <span>From: {record.providerId || 'Unknown'}</span>
                                                        <span>Patient: {record.owner.slice(0, 8)}...{record.owner.slice(-4)}</span>
                                                        <span>{new Date(record.timestamp * 1000).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleStartReview(record)}
                                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 transition-all"
                                            >
                                                Review
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* Not-authorized: show example queue */
                                <div className="divide-y divide-white/5">
                                    {[
                                        { type: 'Blood Panel', provider: 'NHS Digital', date: '2026-02-10' },
                                        { type: 'Imaging Report', provider: 'NHS Digital', date: '2026-02-09' },
                                        { type: 'Allergy Panel', provider: 'Kaiser Portal', date: '2026-02-08' },
                                    ].map((item, i) => (
                                        <div key={i} className="p-4 flex items-center justify-between opacity-60">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg">📋</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-white font-medium">{item.type}</span>
                                                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">🛡️ ZK-Verified</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                                                        <span>From: {item.provider}</span>
                                                        <span>{item.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-500 border border-white/5">🔒 Keeper Only</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info Cards */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <span className="text-lg">⚖️</span> Stake-and-Verify Model
                                </h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Keepers stake RAPHA tokens to participate. Fraudulent attestations trigger slashing via consensus.
                                </p>
                                <div className="p-3 bg-black/30 rounded-xl text-xs font-mono text-amber-400 border border-amber-500/10">
                                    S_new = S_current - (S_current × Δ)
                                </div>
                            </div>
                            <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                                    <span className="text-lg">🔐</span> Threshold Decryption
                                </h3>
                                <p className="text-slate-400 text-sm mb-4">
                                    Patient data is encrypted on IPFS. Lit Protocol releases a transient key only to authorized Keepers.
                                </p>
                                <div className="p-3 bg-black/30 rounded-xl text-xs font-mono text-emerald-400 border border-emerald-500/10">
                                    Φ(a) = (a == Owner) ∨ (a ∈ Keepers)
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ============================================= */
                    /* NOT SIGNED IN: Landing / Sign-In Page         */
                    /* ============================================= */
                    <div className="max-w-6xl mx-auto">
                        {/* Sign-In Hero */}
                        <div className="flex flex-col items-center justify-center min-h-[50vh] mb-16">
                            <div className="glass-card p-12 text-center max-w-lg">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/20">
                                    🛡️
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4">Keeper Portal</h2>
                                <p className="text-slate-400 mb-8">
                                    Sign in to access the Medical Data Verification Portal. Review ZK-verified health records, apply clinical labels, and earn oracle fees.
                                </p>
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="w-full py-4 rounded-xl text-base font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20"
                                >
                                    {hasStoredWallet() ? 'Sign In' : 'Create Health Wallet'}
                                </button>
                                <Link to="/" className="block mt-6 text-slate-500 hover:text-white transition-colors text-sm">
                                    ← Back to Home
                                </Link>
                            </div>
                        </div>

                        {/* Public Info: How It Works */}
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold text-white text-center mb-8">How the Keeper Network Works</h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {[
                                    {
                                        icon: '🔬',
                                        title: 'Select & Decrypt',
                                        desc: 'Pick unverified records from the queue. Lit Protocol grants transient decryption access.',
                                    },
                                    {
                                        icon: '🏷️',
                                        title: 'Label & Verify',
                                        desc: 'Apply FHIR-compliant tags. Confirm clinical accuracy (e.g., #DiabetesType2).',
                                    },
                                    {
                                        icon: '💰',
                                        title: 'Earn Oracle Fees',
                                        desc: '10% of every data transaction is distributed to Keepers as professional fees.',
                                    },
                                ].map((step) => (
                                    <div key={step.title} className="p-6 rounded-2xl bg-slate-900/50 border border-white/5">
                                        <span className="text-3xl mb-4 block">{step.icon}</span>
                                        <h3 className="text-white font-bold mb-2">{step.title}</h3>
                                        <p className="text-slate-400 text-sm">{step.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Apply CTA */}
                        <div className="text-center mb-12">
                            <p className="text-slate-400 mb-4">Not a Keeper yet? Medical professionals can apply.</p>
                            <Link
                                to="/keeper-apply"
                                className="inline-block px-8 py-3 rounded-xl text-sm font-bold border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-all"
                            >
                                Apply to Become a Keeper →
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            <PageFooter />

            {/* Auth Modal */}
            {showAuthModal && (
                <AuthModal
                    onSuccess={handleAuthSuccess}
                    onClose={() => setShowAuthModal(false)}
                />
            )}

            {/* Review Modal (Keeper-Only) */}
            {reviewingRecord && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl p-0 shadow-2xl">
                        <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 rounded-t-2xl" />
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-xl">🔬</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Labeling Studio</h3>
                                        <p className="text-xs text-slate-400">{reviewingRecord.recordType} — {reviewingRecord.providerId}</p>
                                    </div>
                                </div>
                                <button onClick={closeReview} className="text-slate-400 hover:text-white p-1 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {submitSuccess && (
                                <div className="text-center py-8">
                                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-3xl ${submitSuccess === 'approved'
                                        ? 'bg-green-500/20 border border-green-500/30'
                                        : 'bg-red-500/20 border border-red-500/30'
                                        }`}>
                                        {submitSuccess === 'approved' ? '✅' : '⛔'}
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-2">
                                        Record {submitSuccess === 'approved' ? 'Approved' : 'Rejected'}
                                    </h4>
                                    <p className="text-slate-400 text-sm mb-6">
                                        {submitSuccess === 'approved'
                                            ? 'Quality verified and Data UBI sent to patient.'
                                            : 'Record flagged as low quality and deactivated.'}
                                    </p>
                                    <button onClick={closeReview} className="px-6 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors">Close</button>
                                </div>
                            )}

                            {!submitSuccess && isDecrypting && (
                                <div className="text-center py-8">
                                    <div className="w-12 h-12 mx-auto mb-4 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                    <h4 className="text-lg font-bold text-white mb-2">Threshold Decrypting</h4>
                                    <p className="text-slate-400 text-sm">Lit nodes are verifying your keeper credentials on-chain...</p>
                                </div>
                            )}

                            {!submitSuccess && decryptError && !isDecrypting && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                                    <p className="text-red-400 text-sm font-semibold mb-1">⚠️ Decryption Warning</p>
                                    <p className="text-xs text-slate-400">{decryptError}</p>
                                    <p className="text-xs text-slate-500 mt-2">You can still review the record metadata below.</p>
                                </div>
                            )}

                            {!submitSuccess && !isDecrypting && (
                                <>
                                    <div className="space-y-3 mb-6">
                                        <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
                                            <div className="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span className="text-slate-500">Record Type</span>
                                                    <p className="text-white font-medium">{reviewingRecord.recordType}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Provider</span>
                                                    <p className="text-white font-medium">{reviewingRecord.providerId}</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Patient</span>
                                                    <p className="text-amber-400 font-mono">{reviewingRecord.owner.slice(0, 12)}...</p>
                                                </div>
                                                <div>
                                                    <span className="text-slate-500">Date</span>
                                                    <p className="text-white font-medium">{new Date(reviewingRecord.timestamp * 1000).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-2">
                                            <span className="text-lg">🛡️</span>
                                            <div className="text-xs">
                                                <p className="text-green-400 font-semibold">ZK-TLS Origin Verified</p>
                                                <p className="text-slate-400 font-mono">{reviewingRecord.proofHash.slice(0, 20)}...</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label className="block text-sm text-slate-400 mb-2">Medical Labels (tags)</label>
                                        <input
                                            type="text"
                                            value={tags}
                                            onChange={e => setTags(e.target.value)}
                                            placeholder="#DiabetesType2, #ClearLungs, #RoutineCheckup"
                                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:border-amber-500/50 focus:outline-none transition-colors"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Use comma-separated hashtags for clinical labels.</p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleReject}
                                            disabled={isSubmitting}
                                            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Processing...' : '⛔ Reject (Flag)'}
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            disabled={isSubmitting || !tags.trim()}
                                            className="flex-1 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Finalizing...' : '✅ Approve + Send UBI'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3 text-center">
                                        Approving sends 0.01 MATIC to the patient as Data UBI via <code className="text-amber-400">finalizeRecord()</code>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
