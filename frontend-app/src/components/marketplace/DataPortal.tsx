import { useState } from 'react'

interface DataPortalProps {
    portalId: string
    condition: string
    dataType: string
    amountPaid: string
    onClose: () => void
}

export function DataPortal({ portalId, condition, dataType, amountPaid, onClose }: DataPortalProps) {
    const [activeSection, setActiveSection] = useState<'overview' | 'records' | 'api' | 'downloads'>('overview')

    const sections = [
        { id: 'overview' as const, label: 'Overview', icon: '📊' },
        { id: 'records' as const, label: 'Records', icon: '📋' },
        { id: 'api' as const, label: 'API Access', icon: '🔌' },
        { id: 'downloads' as const, label: 'Downloads', icon: '📥' },
    ]

    return (
        <div className="fixed inset-0 bg-slate-950 z-50 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xl">
                                📊
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">Research Data Portal</h1>
                                <p className="text-sm text-slate-400 font-mono">{portalId}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Portal Info Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="glass-card p-4">
                        <p className="text-xs text-slate-500 mb-1">Condition</p>
                        <p className="text-white font-medium">{condition}</p>
                    </div>
                    <div className="glass-card p-4">
                        <p className="text-xs text-slate-500 mb-1">Data Type</p>
                        <p className="text-white font-medium">{dataType}</p>
                    </div>
                    <div className="glass-card p-4">
                        <p className="text-xs text-slate-500 mb-1">Amount Paid</p>
                        <p className="text-emerald-400 font-medium">${amountPaid} USDC</p>
                    </div>
                </div>

                {/* Section Navigation */}
                <div className="flex gap-2 mb-6">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeSection === section.id
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:text-white'
                                }`}
                        >
                            <span>{section.icon}</span>
                            <span>{section.label}</span>
                        </button>
                    ))}
                </div>

                {/* Overview Section */}
                {activeSection === 'overview' && (
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-bold text-white mb-4">Portal Status</h2>
                            <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/30">
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl">⏳</span>
                                    <div>
                                        <p className="text-white font-medium">Waiting for Data</p>
                                        <p className="text-slate-400 text-sm">
                                            Your portal is active. Records will appear here as patients consent to share their data matching your criteria.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h2 className="text-lg font-bold text-white mb-4">Data Usage Guidelines</h2>
                            <ul className="space-y-3 text-slate-300">
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400">✓</span>
                                    <span>All data will be fully anonymized with no PII</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400">✓</span>
                                    <span>Patient consent is verified on-chain for research purposes</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-emerald-400">✓</span>
                                    <span>Data will be formatted according to FHIR/HL7 standards</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-amber-400">⚠</span>
                                    <span>Do not attempt to re-identify patients from data</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Records Section */}
                {activeSection === 'records' && (
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold text-white mb-6">Anonymized Records</h2>
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4 opacity-50">📋</div>
                            <h4 className="text-xl font-medium text-slate-400 mb-2">No Records Yet</h4>
                            <p className="text-slate-500">
                                Records will appear here as patients consent to share their data.
                            </p>
                        </div>
                    </div>
                )}

                {/* API Section */}
                {activeSection === 'api' && (
                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h2 className="text-lg font-bold text-white mb-4">API Credentials</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">API Endpoint</label>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm">
                                            https://api.rapha.health/v1/portal/{portalId}
                                        </code>
                                        <button className="px-4 py-3 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">
                                            Copy
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">API Key</label>
                                    <div className="flex items-center gap-2">
                                        <code className="flex-1 p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm">
                                            rph_live_●●●●●●●●●●●●●●●●●●●●●●●●
                                        </code>
                                        <button className="px-4 py-3 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700">
                                            Reveal
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6">
                            <h2 className="text-lg font-bold text-white mb-4">Example Request</h2>
                            <pre className="p-4 rounded-lg bg-slate-900 text-sm overflow-x-auto">
                                <code className="text-slate-300">{`curl -X GET "https://api.rapha.health/v1/portal/${portalId}/records" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
                            </pre>
                        </div>
                    </div>
                )}

                {/* Downloads Section */}
                {activeSection === 'downloads' && (
                    <div className="glass-card p-6">
                        <h2 className="text-lg font-bold text-white mb-6">Available Downloads</h2>
                        <div className="text-center py-12">
                            <div className="text-6xl mb-4 opacity-50">📥</div>
                            <h4 className="text-xl font-medium text-slate-400 mb-2">No Downloads Available</h4>
                            <p className="text-slate-500">
                                Downloads will be available once records are added to your portal.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
