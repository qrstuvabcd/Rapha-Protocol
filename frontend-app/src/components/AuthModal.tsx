import { useState } from 'react'
import { createWallet, unlockWallet, hasStoredWallet, getStoredWalletAddress } from '../services/wallet.service'
import { saveProfile, getProfile, type UserProfile } from '../services/profile.service'
import { TermsOfServiceModal } from './TermsOfServiceModal'

interface AuthModalProps {
    onSuccess: (address: string, profile: UserProfile) => void
    onClose: () => void
}

export function AuthModal({ onSuccess, onClose }: AuthModalProps) {
    const [mode, setMode] = useState<'login' | 'signup'>(hasStoredWallet() ? 'login' : 'signup')
    const [step, setStep] = useState<'terms' | 'credentials' | 'profile'>(mode === 'login' ? 'credentials' : 'terms')
    const [, setHasAcceptedTerms] = useState(false)

    // Credentials
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Profile
    const [fullName, setFullName] = useState('')
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [hospitalPatientId, setHospitalPatientId] = useState('')
    const [nationalId, setNationalId] = useState('')

    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [walletAddress, setWalletAddress] = useState<string | null>(null)

    const storedAddress = getStoredWalletAddress()

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            if (mode === 'signup') {
                if (password !== confirmPassword) {
                    throw new Error('Passwords do not match')
                }
                if (password.length < 8) {
                    throw new Error('Password must be at least 8 characters')
                }

                const session = await createWallet(password)
                setWalletAddress(session.address)
                setStep('profile') // Move to profile creation
            } else {
                // Login - unlock and get existing profile
                const session = await unlockWallet(password)
                const existingProfile = getProfile(session.address)

                if (existingProfile) {
                    onSuccess(session.address, existingProfile)
                } else {
                    // No profile, need to create one
                    setWalletAddress(session.address)
                    setStep('profile')
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!fullName.trim()) {
            setError('Please enter your full name')
            return
        }

        if (!nationalId.trim()) {
            setError('Please enter your National ID')
            return
        }

        if (!walletAddress) {
            setError('Wallet not found. Please try again.')
            return
        }

        try {
            const profile = saveProfile(walletAddress, {
                fullName: fullName.trim(),
                dateOfBirth: dateOfBirth || undefined,
                hospitalPatientId: hospitalPatientId || undefined,
                nationalId: nationalId || undefined,
                role: 'patient',
            })

            onSuccess(walletAddress, profile)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save profile')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {/* Terms of Service Modal (for new signups) */}
            {step === 'terms' && (
                <TermsOfServiceModal
                    onAccept={() => {
                        setHasAcceptedTerms(true)
                        setStep('credentials')
                    }}
                    onDecline={onClose}
                />
            )}

            {/* Main Auth Modal */}
            {step !== 'terms' && (
                <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-white">
                            {step === 'credentials'
                                ? (mode === 'signup' ? 'Create Your Health Wallet' : 'Welcome Back')
                                : 'Complete Your Profile'
                            }
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {step === 'credentials' ? (
                        <>
                            {mode === 'signup' ? (
                                <div className="mb-6 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">🔐</span>
                                        <p className="text-sm text-slate-300">
                                            <strong>Your health wallet</strong> will be created and encrypted with your password.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6 p-4 rounded-lg bg-slate-700/50">
                                    <p className="text-sm text-slate-400 mb-1">Wallet Address</p>
                                    <p className="font-mono text-sm text-white break-all">{storedAddress}</p>
                                </div>
                            )}

                            <form onSubmit={handleCredentialsSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder={mode === 'signup' ? 'Create a strong password' : 'Enter your password'}
                                            className="input-glass"
                                            required
                                            minLength={8}
                                        />
                                    </div>

                                    {mode === 'signup' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Confirm Password
                                            </label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm your password"
                                                className="input-glass"
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                    )}

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full btn-gradient py-4 text-lg disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                {mode === 'signup' ? 'Creating...' : 'Unlocking...'}
                                            </span>
                                        ) : (
                                            mode === 'signup' ? 'Continue' : 'Unlock Wallet'
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6 text-center">
                                {mode === 'signup' ? (
                                    <p className="text-slate-400 text-sm">
                                        Already have a wallet?{' '}
                                        <button onClick={() => setMode('login')} className="text-indigo-400 hover:text-indigo-300">
                                            Sign in
                                        </button>
                                    </p>
                                ) : (
                                    <p className="text-slate-400 text-sm">
                                        Don't have a wallet?{' '}
                                        <button onClick={() => setMode('signup')} className="text-indigo-400 hover:text-indigo-300">
                                            Create one
                                        </button>
                                    </p>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Profile Step */}
                            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <p className="text-sm text-slate-300">
                                            <strong>Wallet created!</strong> Now let's set up your profile.
                                        </p>
                                        <p className="text-xs text-slate-400 font-mono mt-1">
                                            {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleProfileSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Full Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Enter your full name"
                                            className="input-glass"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Date of Birth
                                        </label>
                                        <input
                                            type="date"
                                            value={dateOfBirth}
                                            onChange={(e) => setDateOfBirth(e.target.value)}
                                            className="input-glass"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            National ID / SSN <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={nationalId}
                                            onChange={(e) => setNationalId(e.target.value)}
                                            placeholder="Enter your national ID"
                                            className="input-glass"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Hospital Patient ID
                                            <span className="text-slate-500 text-xs ml-2">(optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={hospitalPatientId}
                                            onChange={(e) => setHospitalPatientId(e.target.value)}
                                            placeholder="e.g., HN-12345678"
                                            className="input-glass"
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <button type="submit" className="w-full btn-gradient py-4 text-lg">
                                        Complete Setup
                                    </button>
                                </div>
                            </form>

                            <p className="mt-6 text-xs text-slate-500 text-center">
                                🔒 Your personal data is encrypted and stored locally on your device.
                            </p>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
