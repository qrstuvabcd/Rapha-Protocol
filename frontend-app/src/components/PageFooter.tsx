import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Universal page footer with legal links and disclaimer
 * Add this to EVERY page
 */
export function PageFooter() {
    return (
        <footer className="mt-auto pt-8 pb-6 border-t border-white/5">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Legal Links */}
                    <div className="flex items-center gap-6 text-sm">
                        <Link to="/terms" className="text-rapha-muted hover:text-white transition-colors">
                            Terms of Service
                        </Link>
                        <Link to="/privacy" className="text-rapha-muted hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                        <Link to="/whitepaper" className="text-rapha-muted hover:text-white transition-colors">
                            Whitepaper
                        </Link>
                        <a href="https://github.com/qrstuvabcd/Rapha-Protocol" target="_blank" rel="noopener noreferrer" className="text-rapha-muted hover:text-white transition-colors">
                            GitHub
                        </a>
                    </div>

                    {/* Copyright */}
                    <p className="text-xs text-rapha-muted">
                        © 2026 Rapha Protocol. All rights reserved. Governed by ROC (Taiwan) law.
                    </p>
                </div>

                {/* Testing Warning */}
                <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                    <p className="text-xs text-white text-center font-medium">
                        ⚠️ <strong>TESTING PRODUCT IN DEVELOPMENT</strong> ⚠️
                    </p>
                    <p className="text-xs text-rapha-muted text-center mt-1">
                        This is an experimental product under active development. By using this service, you acknowledge and agree that:
                        <strong className="text-white/80"> you may lose everything</strong> including all assets, data, and funds.
                        Rapha Protocol and its developers <strong className="text-white/80">take NO legal responsibility</strong> for any losses, damages, or issues.
                        Use entirely at your own risk.
                    </p>
                </div>

                {/* Disclaimer */}
                <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/5">
                    <p className="text-xs text-rapha-muted/80 text-center">
                        <strong className="text-rapha-muted">Disclaimer:</strong> Rapha Protocol is provided "as is" without warranty.
                        Medical data is user-contributed and not verified. Not medical advice.
                        Blockchain transactions are irreversible. Use at your own risk.
                    </p>
                </div>
            </div>
        </footer>
    )
}

/**
 * Blockchain Action Confirmation Modal
 * Shows before ANY action that affects the blockchain
 */
interface BlockchainConfirmProps {
    title: string
    description: string
    actionLabel: string
    onConfirm: () => void
    onCancel: () => void
    isProcessing?: boolean
}

export function BlockchainActionConfirm({
    title,
    description,
    actionLabel,
    onConfirm,
    onCancel,
    isProcessing = false
}: BlockchainConfirmProps) {
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [agreedToRisks, setAgreedToRisks] = useState(false)

    const canProceed = agreedToTerms && agreedToRisks && !isProcessing

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="glass-card p-6 max-w-md w-full">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
                        ⚠️
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                        <p className="text-sm text-slate-400">Blockchain Action Required</p>
                    </div>
                </div>

                {/* Description */}
                <p className="text-slate-300 mb-6">{description}</p>

                {/* Warnings */}
                <div className="space-y-2 mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <p className="text-orange-400 font-medium text-sm">⚠️ Important:</p>
                    <ul className="text-sm text-slate-300 space-y-1">
                        <li>• This action will be recorded on the blockchain</li>
                        <li>• Blockchain transactions are <strong>irreversible</strong></li>
                        <li>• You may pay gas fees for this transaction</li>
                    </ul>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-indigo-500/30">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded"
                        />
                        <span className="text-sm text-white">
                            I have read and agree to the{' '}
                            <Link to="/terms" className="text-indigo-400 hover:underline" target="_blank">
                                Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link to="/privacy" className="text-indigo-400 hover:underline" target="_blank">
                                Privacy Policy
                            </Link>
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-slate-800/50 border border-slate-700 hover:border-indigo-500/30">
                        <input
                            type="checkbox"
                            checked={agreedToRisks}
                            onChange={(e) => setAgreedToRisks(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded"
                        />
                        <span className="text-sm text-white">
                            I understand this action is <strong>irreversible</strong> and I accept the risks
                        </span>
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!canProceed}
                        className={`flex-1 py-3 rounded-xl font-medium ${canProceed
                            ? 'btn-gradient'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {isProcessing ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </span>
                        ) : actionLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}

/**
 * Hook for easy blockchain confirmation
 */
export function useBlockchainConfirm() {
    const [showConfirm, setShowConfirm] = useState(false)
    const [config, setConfig] = useState<Omit<BlockchainConfirmProps, 'onConfirm' | 'onCancel'> | null>(null)
    const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)

    const confirm = (options: { title: string; description: string; actionLabel: string }): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfig(options)
            setShowConfirm(true)
            setResolver(() => resolve)
        })
    }

    const handleConfirm = () => {
        setShowConfirm(false)
        resolver?.(true)
    }

    const handleCancel = () => {
        setShowConfirm(false)
        resolver?.(false)
    }

    const ConfirmModal = () => {
        if (!showConfirm || !config) return null
        return (
            <BlockchainActionConfirm
                {...config}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        )
    }

    return { confirm, ConfirmModal }
}
