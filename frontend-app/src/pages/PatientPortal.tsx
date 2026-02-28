import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PatientPage } from '../components/PatientPage'
import { AuthModal } from '../components/AuthModal'
import { UploadModal } from '../components/UploadModal'
import { ZkTlsImportModal } from '../components/ZkTlsImportModal'
import { ShareQRModal } from '../components/QRCode'
import { hasStoredWallet } from '../services/wallet.service'
import { type UserProfile } from '../services/profile.service'
import { PageFooter } from '../components/PageFooter'
import { isDemoMode, DEMO_WALLET, DEMO_PATIENT_PROFILE, seedDemoData } from '../services/demoMode'

type NavItem = 'dashboard' | 'records' | 'access' | 'opportunities'

export function PatientPortal() {
    const [isConnected, setIsConnected] = useState(false)
    const [walletAddress, setWalletAddress] = useState<string | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
    const [activeNav, setActiveNav] = useState<NavItem>('dashboard')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [showQRModal, setShowQRModal] = useState(false)
    const [showZkTlsModal, setShowZkTlsModal] = useState(false)

    useEffect(() => {
        if (isDemoMode()) {
            seedDemoData()
            setWalletAddress(DEMO_WALLET)
            setUserProfile(DEMO_PATIENT_PROFILE)
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
        setActiveNav('dashboard')
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
                            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30">
                                <span className="w-2 h-2 bg-sky-400 rounded-full" />
                                <span className="text-sm text-sky-400 font-medium">Patient Portal</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {isConnected ? (
                                <>
                                    <button
                                        onClick={() => setShowQRModal(true)}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                                        title="Share QR Code"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                    </button>
                                    <div className="hidden md:block text-right">
                                        <p className="text-sm text-white font-medium">{userProfile?.fullName || 'User'}</p>
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
                    <PatientPage
                        walletAddress={walletAddress!}
                        userProfile={userProfile}
                        activeNav={activeNav}
                        onNavChange={(nav) => setActiveNav(nav)}
                        onUploadClick={() => setShowUploadModal(true)}
                        onShowQR={() => setShowQRModal(true)}
                        onZkTlsImport={() => setShowZkTlsModal(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <div className="glass-card p-12 text-center max-w-lg">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-4xl">
                                🏥
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">Patient Portal</h2>
                            <p className="text-slate-400 mb-8">
                                Connect your wallet to access your encrypted health records, manage permissions, and track your data.
                            </p>
                            <button
                                onClick={() => setShowAuthModal(true)}
                                className="btn-gradient text-lg px-8 py-4 w-full"
                            >
                                {hasStoredWallet() ? 'Sign In' : 'Create Health Wallet'}
                            </button>
                            <Link to="/" className="block mt-6 text-slate-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                                <span>←</span> Back to Home
                            </Link>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            {showUploadModal && walletAddress && (
                <UploadModal
                    walletAddress={walletAddress}
                    onClose={() => setShowUploadModal(false)}
                />
            )}

            {showAuthModal && (
                <AuthModal
                    onSuccess={handleAuthSuccess}
                    onClose={() => setShowAuthModal(false)}
                />
            )}

            {showQRModal && walletAddress && (
                <ShareQRModal
                    walletAddress={walletAddress}
                    userName={userProfile?.fullName || 'User'}
                    onClose={() => setShowQRModal(false)}
                />
            )}

            {showZkTlsModal && walletAddress && (
                <ZkTlsImportModal
                    walletAddress={walletAddress}
                    onClose={() => setShowZkTlsModal(false)}
                />
            )}

            <PageFooter />
        </div>
    )
}

export default PatientPortal
