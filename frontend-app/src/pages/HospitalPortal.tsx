import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DoctorPage } from '../components/DoctorPage'
import { AuthModal } from '../components/AuthModal'
import { hasStoredWallet } from '../services/wallet.service'
import { type UserProfile } from '../services/profile.service'
import { PageFooter } from '../components/PageFooter'
import { isDemoMode, DEMO_HOSPITAL_WALLET, DEMO_PROVIDER_PROFILE, seedDemoData } from '../services/demoMode'

export function HospitalPortal() {
    const [isConnected, setIsConnected] = useState(false)
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [showAuthModal, setShowAuthModal] = useState(false)

    useEffect(() => {
        if (isDemoMode()) {
            seedDemoData()
            setWalletAddress(DEMO_HOSPITAL_WALLET)
            setUserProfile(DEMO_PROVIDER_PROFILE)
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
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                                <span className="text-sm text-emerald-400 font-medium">Hospital Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {isConnected ? (
                                <>
                                    <div className="hidden md:block text-right">
                                        <p className="text-sm text-white font-medium">{userProfile?.fullName || 'Healthcare Provider'}</p>
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
                    <DoctorPage
                        walletAddress={walletAddress!}
                        userProfile={userProfile}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="glass-card p-12 text-center max-w-lg">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-4xl">
                                🏥
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Hospital Portal</h2>
                            <p className="text-slate-400 mb-8">
                                Connect your institutional wallet to upload patient records, request access, and manage your registry.
                            </p>
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="btn-gradient text-lg px-8 py-4 w-full"
                            >
                                {hasStoredWallet() ? 'Sign In' : 'Connect Institution Wallet'}
                            </button>
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

export default HospitalPortal
