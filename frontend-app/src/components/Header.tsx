import { useState } from 'react'
import { type UserProfile, getDisplayName } from '../services/profile.service'

interface HeaderProps {
    isConnected: boolean
    walletAddress: string | null
    userProfile: UserProfile | null
    authMethod: 'none' | 'internal' | 'external'
    onConnect: () => void
    onDisconnect: () => void
    onShowQR: () => void
}

export function Header({
    isConnected,
    walletAddress,
    userProfile,
    authMethod,
    onConnect,
    onDisconnect,
    onShowQR
}: HeaderProps) {
    const [showWalletModal, setShowWalletModal] = useState(false)
    const [copied, setCopied] = useState(false)

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    const copyAddress = () => {
        if (walletAddress) {
            navigator.clipboard.writeText(walletAddress)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <>
            <header className="border-b border-white/5 backdrop-blur-xl bg-slate-900/30 sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <img
                            src="/rapha-logo.png"
                            alt="Rapha Protocol"
                            className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover"
                        />
                        <div>
                            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight">
                                <span className="text-gradient">Rapha Protocol</span>
                            </h1>
                            <p className="hidden sm:block text-xs text-slate-500 font-medium tracking-wide">Web3 Health Records</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {isConnected ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                                {/* QR Share Button */}
                                <button
                                    onClick={onShowQR}
                                    className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
                                    title="Share QR Code"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                </button>

                                {/* User Profile Trigger */}
                                <button
                                    onClick={() => setShowWalletModal(true)}
                                    className="flex items-center gap-2 sm:gap-3 p-1.5 pr-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                                >
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-sky-500/20">
                                        {getDisplayName(userProfile, true).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <p className="text-sm font-semibold text-white leading-tight">
                                            {getDisplayName(userProfile, true)}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs">
                                                {authMethod === 'internal' ? '🔐' : '🦊'}
                                            </span>
                                            <span className="text-[10px] sm:text-xs font-mono text-slate-500">
                                                {formatAddress(walletAddress!)}
                                            </span>
                                        </div>
                                    </div>
                                    {/* Mobile Chevron */}
                                    <svg className="w-4 h-4 text-slate-500 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <button onClick={onConnect} className="btn-gradient text-sm px-5 py-3 sm:px-6 sm:py-3 font-bold active:scale-95 transition-transform">
                                Get Started
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Wallet Modal */}
            {showWalletModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowWalletModal(false)}>
                    <div className="glass-card p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">Account</h3>
                            <button
                                onClick={() => setShowWalletModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-6 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-sky-500/20 mb-4">
                                {getDisplayName(userProfile, true).charAt(0).toUpperCase()}
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">
                                {getDisplayName(userProfile, true)}
                            </h4>

                            {/* Address Display & Copy */}
                            <div className="w-full space-y-3">
                                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700">
                                    <span className="text-sm text-slate-400 font-mono">
                                        {formatAddress(walletAddress!)}
                                    </span>
                                    <button
                                        onClick={copyAddress}
                                        className="flex items-center gap-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        {copied ? (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Copied</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <a
                                href={`https://polygonscan.com/address/${walletAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors group"
                            >
                                <span className="text-slate-300 group-hover:text-white transition-colors">View on Explorer</span>
                                <svg className="w-4 h-4 text-slate-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>

                            <button
                                onClick={() => {
                                    setShowWalletModal(false)
                                    onDisconnect()
                                }}
                                className="w-full py-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors font-medium"
                            >
                                Disconnect Wallet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
