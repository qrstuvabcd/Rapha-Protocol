import { useState } from 'react'
import { createAccessGrant, type AccessGrant } from '../services/access.service'

interface AccessGrantModalProps {
    patientAddress: string
    onClose: () => void
    onGrantCreated: (grant: AccessGrant) => void
}

export function AccessGrantModal({ patientAddress, onClose, onGrantCreated }: AccessGrantModalProps) {
    const [providerAddress, setProviderAddress] = useState('')
    const [providerName, setProviderName] = useState('')
    const [expirationDays, setExpirationDays] = useState<number>(30)
    const [recordTypes, setRecordTypes] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    const allRecordTypes = ['MRI', 'Blood', 'X-Ray', 'Genomics', 'Lab', 'Prescription', 'Clinical Notes']

    const toggleRecordType = (type: string) => {
        if (recordTypes.includes(type)) {
            setRecordTypes(recordTypes.filter(t => t !== type))
        } else {
            setRecordTypes([...recordTypes, type])
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!providerAddress.startsWith('0x') || providerAddress.length !== 42) {
            setError('Please enter a valid wallet address (0x...)')
            return
        }

        if (!providerName.trim()) {
            setError('Please enter the provider name')
            return
        }

        try {
            const grant = createAccessGrant({
                patientAddress,
                providerAddress,
                providerName: providerName.trim(),
                recordTypes: recordTypes.length > 0 ? recordTypes : [], // Empty = all types
                expirationDays,
            })

            onGrantCreated(grant)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create grant')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Grant Access</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-6 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                    <p className="text-sm text-slate-300">
                        <strong>🔐 Share your records securely.</strong> The provider will only be able to decrypt
                        records you authorize. You can revoke access at any time.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Provider Name <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={providerName}
                                onChange={(e) => setProviderName(e.target.value)}
                                placeholder="e.g., Dr. Smith, City Hospital"
                                className="input-glass"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Provider Wallet Address <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={providerAddress}
                                onChange={(e) => setProviderAddress(e.target.value)}
                                placeholder="0x..."
                                className="input-glass font-mono text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Record Types
                                <span className="text-slate-500 text-xs ml-2">(leave empty for all)</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {allRecordTypes.map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => toggleRecordType(type)}
                                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${recordTypes.includes(type)
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Access Duration
                            </label>
                            <select
                                value={expirationDays}
                                onChange={(e) => setExpirationDays(Number(e.target.value))}
                                className="input-glass"
                            >
                                <option value={7}>7 days</option>
                                <option value={30}>30 days</option>
                                <option value={90}>90 days</option>
                                <option value={365}>1 year</option>
                                <option value={0}>Never expires</option>
                            </select>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="flex-1 btn-gradient py-3">
                                Grant Access
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
