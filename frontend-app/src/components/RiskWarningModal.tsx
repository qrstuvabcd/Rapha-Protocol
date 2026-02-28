import { useState } from 'react'

interface RiskWarningModalProps {
    onAccept: () => void
    onDecline: () => void
}

export function RiskWarningModal({ onAccept, onDecline }: RiskWarningModalProps) {
    const [acknowledged, setAcknowledged] = useState(false)

    const risks = [
        {
            title: 'Smart Contract Risk',
            description: 'Smart contracts may contain bugs that could result in loss of funds.',
            severity: 'high'
        },
        {
            title: 'Blockchain Immutability',
            description: 'Data stored on the blockchain cannot be deleted or modified.',
            severity: 'medium'
        },
        {
            title: 'Key Management',
            description: 'You are responsible for securing your private keys. Lost keys cannot be recovered.',
            severity: 'high'
        },
        {
            title: 'Regulatory Uncertainty',
            description: 'Cryptocurrency regulations vary by jurisdiction and may change.',
            severity: 'medium'
        },
        {
            title: 'Network Congestion',
            description: 'High network activity may result in delayed or failed transactions.',
            severity: 'low'
        }
    ]

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' }
            case 'medium': return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' }
            default: return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' }
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center text-4xl">
                        ⚠️
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Risk Disclosure</h2>
                    <p className="text-slate-400">
                        Please read and acknowledge the following risks before proceeding
                    </p>
                </div>

                {/* Risk List */}
                <div className="space-y-3 mb-6">
                    {risks.map((risk, index) => {
                        const colors = getSeverityColor(risk.severity)
                        return (
                            <div
                                key={index}
                                className={`p-4 rounded-xl ${colors.bg} border ${colors.border}`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className={`mt-1 ${colors.text}`}>•</span>
                                    <div>
                                        <h3 className="text-white font-medium">{risk.title}</h3>
                                        <p className="text-sm text-slate-400">{risk.description}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Acknowledgment */}
                <label className="flex items-start gap-3 mb-6 cursor-pointer p-4 rounded-xl bg-white/5 border border-white/10">
                    <input
                        type="checkbox"
                        checked={acknowledged}
                        onChange={(e) => setAcknowledged(e.target.checked)}
                        className="mt-1"
                    />
                    <span className="text-sm text-slate-300">
                        I have read, understand, and accept the risks associated with using Rapha Protocol.
                        I understand that I am solely responsible for my actions and that Rapha Protocol
                        is not liable for any losses.
                    </span>
                </label>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onDecline}
                        className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors"
                    >
                        Decline
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={!acknowledged}
                        className="flex-1 btn-gradient disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        I Accept
                    </button>
                </div>
            </div>
        </div>
    )
}
