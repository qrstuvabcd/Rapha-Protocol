interface RoleSwitcherProps {
    viewMode: 'patient' | 'provider' | 'marketplace'
    onSwitch: (mode: 'patient' | 'provider' | 'marketplace') => void
}

export function RoleSwitcher({ viewMode, onSwitch }: RoleSwitcherProps) {
    const isPatient = viewMode === 'patient'
    const isDoctor = viewMode === 'provider'
    const isMarketplace = viewMode === 'marketplace'

    return (
        <div className="glass-card p-4 mb-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3 p-1 rounded-xl bg-white/5">
                <button
                    onClick={() => onSwitch('patient')}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${isPatient
                        ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/30'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Patient
                </button>
                <button
                    onClick={() => onSwitch('provider')}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${isDoctor
                        ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/30'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Provider
                </button>
                <button
                    onClick={() => onSwitch('marketplace')}
                    className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${isMarketplace
                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    <span className="text-lg">🧠</span>
                    DeSci Market
                </button>
            </div>

            {/* Role Description */}
            <div className={`text-center p-3 rounded-xl transition-all ${isPatient
                ? 'bg-sky-500/5 border border-sky-500/10'
                : isDoctor
                    ? 'bg-teal-500/5 border border-teal-500/10'
                    : 'bg-violet-500/5 border border-violet-500/10'
                }`}>
                {isPatient && (
                    <p className="text-sm text-slate-400">
                        <span className="font-semibold text-sky-400">Patient Mode:</span> View your records, manage access permissions, share with providers
                    </p>
                )}
                {isDoctor && (
                    <p className="text-sm text-slate-400">
                        <span className="font-semibold text-teal-400">Provider Mode:</span> Upload records to patients, request access, <span className="text-teal-400">🔐 Blockchain Encryption</span>
                    </p>
                )}
                {isMarketplace && (
                    <p className="text-sm text-slate-400">
                        <span className="font-semibold text-violet-400">AI Research Studio:</span> Run federated learning on privacy-preserved medical datasets
                    </p>
                )}
            </div>
        </div>
    )
}
