import { type UserProfile } from '../services/profile.service'
import { ProviderPortal } from './ProviderPortal'

interface DoctorPageProps {
    walletAddress: string
    userProfile: UserProfile | null
}

export function DoctorPage({ walletAddress, userProfile }: DoctorPageProps) {
    const providerName = userProfile?.fullName || 'Doctor'

    return (
        <div className="doctor-page animate-fadeIn">
            {/* Doctor Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Provider Portal</h1>
                        <p className="text-sm text-slate-500">Upload encrypted records to patients' wallets</p>
                    </div>
                </div>
                <span className="px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold tracking-wide flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                    Blockchain Encryption Enabled
                </span>
            </div>

            {/* Info Banner */}
            <div className="glass-card p-5 mb-6 border-teal-500/10">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-1">Provider-Only Features</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            As a healthcare provider, you can upload medical records encrypted directly to patients' blockchain wallets.
                            Records are encrypted with the patient's public key, ensuring only they can access them.
                        </p>
                    </div>
                </div>
            </div>

            {/* Provider Portal Content */}
            <ProviderPortal
                walletAddress={walletAddress}
                providerName={providerName}
            />
        </div>
    )
}
