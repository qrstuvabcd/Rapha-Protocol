/**
 * Keeper Application Page
 * 
 * Public page for medical professionals to apply
 * to become authorized Keepers in the Rapha Protocol.
 * 
 * Uses direct window.ethereum wallet detection (no wagmi dependency).
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PageFooter } from '../components/PageFooter'

export function KeeperApplication() {
    // Wallet state (no wagmi)
    const [address, setAddress] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)

    const [formData, setFormData] = useState({
        fullName: '',
        credentialType: '',
        credentialId: '',
        specialty: '',
        institution: '',
        motivation: '',
    })
    const [submitted, setSubmitted] = useState(false)

    // Wallet detection
    useEffect(() => {
        const detectWallet = async () => {
            try {
                const eth = (window as any).ethereum
                if (!eth) return
                const accounts: string[] = await eth.request({ method: 'eth_accounts' })
                if (accounts.length > 0) {
                    setAddress(accounts[0])
                    setIsConnected(true)
                }
            } catch { /* no wallet */ }
        }
        detectWallet()
    }, [])

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('[KeeperApplication] Submitted:', { ...formData, walletAddress: address })
        setSubmitted(true)
    }

    const isFormValid = formData.fullName && formData.credentialType && formData.credentialId && formData.specialty

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Header */}
            <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-black border border-emerald-400">R</div>
                        <span className="text-lg font-bold text-white tracking-tight">RAPHA PROTOCOL</span>
                    </Link>
                    <Link to="/verifier" className="text-xs text-slate-400 hover:text-amber-400 transition-colors">
                        ← Back to Keeper Portal
                    </Link>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-16 max-w-4xl">
                {/* Hero */}
                <div className="text-center mb-16">
                    <div className="inline-block px-3 py-1 rounded-full bg-amber-950/30 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                        Keeper Program
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        Become a <span className="text-amber-400">Keeper</span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Join the distributed Medical Oracle network. Verify patient data, apply clinical labels, and earn professional fees for your expertise.
                    </p>
                </div>

                {/* Benefits */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {[
                        {
                            icon: '💰',
                            title: '10% Oracle Fees',
                            desc: 'Earn 10% of every data transaction your verified records contribute to.',
                        },
                        {
                            icon: '🧬',
                            title: 'Advance Medical AI',
                            desc: 'Your clinical labeling directly improves AI model accuracy for diagnostics.',
                        },
                        {
                            icon: '🌍',
                            title: 'Global Impact',
                            desc: 'Help build the world\'s first patient-owned, privacy-preserving medical dataset.',
                        },
                    ].map((benefit) => (
                        <div key={benefit.title} className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 text-center">
                            <span className="text-4xl mb-4 block">{benefit.icon}</span>
                            <h3 className="text-white font-bold mb-2">{benefit.title}</h3>
                            <p className="text-slate-400 text-sm">{benefit.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Requirements */}
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-amber-500/10 mb-16">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <span>📋</span> Requirements
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {[
                            { label: 'Medical License', desc: 'Valid GMC, USMLE, or equivalent registration' },
                            { label: 'Wallet Address', desc: 'Polygon-compatible wallet (MetaMask, WalletConnect)' },
                            { label: 'RAPHA Stake', desc: 'Minimum stake of 1,000 RAPHA tokens for participation' },
                            { label: 'Identity Proof', desc: 'ZK-credential verification via Privado ID' },
                        ].map((req) => (
                            <div key={req.label} className="flex gap-3 items-start">
                                <span className="text-amber-400 mt-0.5">✓</span>
                                <div>
                                    <p className="text-white text-sm font-medium">{req.label}</p>
                                    <p className="text-slate-500 text-xs">{req.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Application Form */}
                {submitted ? (
                    <div className="p-12 rounded-2xl bg-slate-900/50 border border-green-500/20 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-4xl">
                            ✅
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Application Submitted</h2>
                        <p className="text-slate-400 mb-2">
                            Your application to become a Keeper has been received.
                        </p>
                        <p className="text-slate-500 text-sm mb-8">
                            Our team will verify your credentials and register your wallet on-chain. You will receive a notification once your Keeper status is activated.
                        </p>
                        {address && (
                            <div className="inline-block p-3 rounded-xl bg-slate-800/50 border border-white/5 text-xs font-mono text-amber-400">
                                Wallet: {address}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 rounded-2xl bg-slate-900/50 border border-white/5">
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span>📝</span> Application Form
                        </h2>

                        {!isConnected && (
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
                                <p className="text-amber-400 text-sm font-medium">⚠️ Please connect your wallet first.</p>
                                <p className="text-slate-400 text-xs mt-1">Your wallet address will be registered as a Keeper on-chain upon approval.</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={e => handleChange('fullName', e.target.value)}
                                    placeholder="Dr. Jane Smith"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:border-amber-500/50 focus:outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Medical Credential Type *</label>
                                <select
                                    value={formData.credentialType}
                                    onChange={e => handleChange('credentialType', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm focus:border-amber-500/50 focus:outline-none transition-colors"
                                    required
                                >
                                    <option value="">Select credential type...</option>
                                    <option value="GMC">GMC (General Medical Council)</option>
                                    <option value="USMLE">USMLE (United States Medical License)</option>
                                    <option value="MBChB">MBChB / MBBS (Medical Degree)</option>
                                    <option value="MD">MD (Doctor of Medicine)</option>
                                    <option value="DO">DO (Doctor of Osteopathic Medicine)</option>
                                    <option value="RN">RN (Registered Nurse)</option>
                                    <option value="PharmD">PharmD (Doctor of Pharmacy)</option>
                                    <option value="Other">Other (specify below)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">License / Registration Number *</label>
                                <input
                                    type="text"
                                    value={formData.credentialId}
                                    onChange={e => handleChange('credentialId', e.target.value)}
                                    placeholder="e.g., GMC-7654321"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:border-amber-500/50 focus:outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Medical Specialty *</label>
                                <input
                                    type="text"
                                    value={formData.specialty}
                                    onChange={e => handleChange('specialty', e.target.value)}
                                    placeholder="e.g., Cardiology, General Practice, Radiology"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:border-amber-500/50 focus:outline-none transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Current Institution</label>
                                <input
                                    type="text"
                                    value={formData.institution}
                                    onChange={e => handleChange('institution', e.target.value)}
                                    placeholder="e.g., NHS Trust, Mayo Clinic"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:border-amber-500/50 focus:outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Why do you want to become a Keeper?</label>
                                <textarea
                                    value={formData.motivation}
                                    onChange={e => handleChange('motivation', e.target.value)}
                                    placeholder="Tell us about your interest in decentralized medical data verification..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white text-sm placeholder-slate-500 focus:border-amber-500/50 focus:outline-none transition-colors resize-none"
                                />
                            </div>

                            {isConnected && address && (
                                <div className="p-3 rounded-xl bg-slate-800/50 border border-white/5">
                                    <p className="text-xs text-slate-500 mb-1">Connected Wallet</p>
                                    <p className="text-amber-400 text-sm font-mono">{address}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!isFormValid}
                                className="w-full py-4 rounded-xl text-base font-bold bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:from-amber-400 hover:to-yellow-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                            >
                                Submit Application
                            </button>
                            <p className="text-xs text-slate-500 text-center">
                                Applications are reviewed manually. Credential verification is performed via Privado ID.
                            </p>
                        </form>
                    </div>
                )}
            </main>

            <PageFooter />
        </div>
    )
}
