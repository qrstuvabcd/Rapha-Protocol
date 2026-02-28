import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PharmaDashboard } from '../components/marketplace'
import { AuthModal } from '../components/AuthModal'
import { hasStoredWallet } from '../services/wallet.service'
import { type UserProfile } from '../services/profile.service'
// import { ResearchDisclaimer, LegalDisclaimer } from '../components/LegalDisclaimer'
import { PageFooter } from '../components/PageFooter'
import { isDemoMode, DEMO_RESEARCHER_WALLET, DEMO_RESEARCHER_PROFILE, seedDemoData } from '../services/demoMode'

export function AIResearchPortal() {
    const [isConnected, setIsConnected] = useState(false)
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [showAuthModal, setShowAuthModal] = useState(false)

    useEffect(() => {
        if (isDemoMode()) {
            seedDemoData()
            setWalletAddress(DEMO_RESEARCHER_WALLET)
            setUserProfile(DEMO_RESEARCHER_PROFILE)
            setIsConnected(true)
        } else if (hasStoredWallet()) {
            // Auto-show auth modal if wallet exists
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

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <img src="/rapha-logo.png" alt="Rapha Protocol" className="w-10 h-10 rounded-xl" />
                                <span className="text-xl font-bold text-white">Rapha Protocol</span>
                            </Link>
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30">
                                <span className="w-2 h-2 bg-violet-400 rounded-full" />
                                <span className="text-sm text-violet-400 font-medium">AI Research Studio</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {isConnected ? (
                                <>
                                    <div className="hidden md:block text-right">
                                        <p className="text-sm text-white font-medium">{userProfile?.fullName || 'Researcher'}</p>
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
                                    className="btn-gradient px-6 py-2"
                                >
                                    {hasStoredWallet() ? 'Sign In' : 'Connect Wallet'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-8">
                {isConnected ? (
                    <PharmaDashboard />
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="glass-card p-12 text-center max-w-lg">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-4xl">
                                🧬
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">AI Research Studio</h2>
                            <p className="text-slate-400 mb-8">
                                Connect your wallet to run federated learning jobs on privacy-preserved medical datasets.
                            </p>
                            <div className="space-y-4">
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="btn-gradient text-lg px-8 py-4 w-full"
                                >
                                    {hasStoredWallet() ? 'Sign In' : 'Connect Research Wallet'}
                                </button>
                                <Link to="/demo" className="block w-full">
                                    <button className="w-full px-8 py-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all flex items-center justify-center gap-2 group">
                                        <span>🎮</span> View Interactive Demo <span className="text-slate-500 group-hover:translate-x-1 transition-transform">→</span>
                                    </button>
                                </Link>
                                <div className="p-4 rounded-lg bg-violet-500/10 border border-violet-500/20">
                                    <p className="text-sm text-slate-400">
                                        <span className="text-violet-400 font-medium">🔐 Privacy-First Design:</span> Your models train on encrypted data inside secure compute nodes. Raw data never leaves the node.
                                    </p>
                                </div>
                            </div>
                            <Link to="/" className="block mt-6 text-slate-500 hover:text-white transition-colors">
                                ← Back to Home
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
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

export default AIResearchPortal

