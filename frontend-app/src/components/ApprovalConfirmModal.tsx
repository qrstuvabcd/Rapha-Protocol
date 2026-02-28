import { useState } from 'react'
import { type AccessRequest } from '../services/accessRequest.service.tsx'

interface ApprovalConfirmModalProps {
    request: AccessRequest
    onConfirm: () => void
    onCancel: () => void
}

/**
 * Modal for approving access requests with policy agreement
 */
export function ApprovalConfirmModal({ request, onConfirm, onCancel }: ApprovalConfirmModalProps) {
    const [agreedToPolicy, setAgreedToPolicy] = useState(false)
    const [agreedToDataShare, setAgreedToDataShare] = useState(false)

    const canApprove = agreedToPolicy && agreedToDataShare

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="glass-card p-6 max-w-md w-full">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
                        ⚠️
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Approve Access Request</h3>
                        <p className="text-sm text-slate-400">Grant data access to provider</p>
                    </div>
                </div>

                {/* Request Info */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-4">
                    <h4 className="font-medium text-white">{request.providerName}</h4>
                    <p className="text-sm text-slate-400 font-mono">
                        {request.providerAddress.slice(0, 10)}...{request.providerAddress.slice(-6)}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                        Wants: {request.recordTypes.length > 0 ? request.recordTypes.join(', ') : 'All records'}
                    </p>
                </div>

                {/* Warning */}
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-4">
                    <p className="text-orange-400 font-medium text-sm">⚠️ Important:</p>
                    <ul className="text-sm text-slate-300 space-y-1 mt-2">
                        <li>• This will grant access to your encrypted records</li>
                        <li>• The provider can decrypt and view the data</li>
                        <li>• This action is recorded on the blockchain</li>
                        <li>• You can revoke access later, but data may have been viewed</li>
                    </ul>
                </div>

                {/* Policy Checkboxes */}
                <div className="space-y-3 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                        <input
                            type="checkbox"
                            checked={agreedToPolicy}
                            onChange={(e) => setAgreedToPolicy(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded"
                        />
                        <span className="text-sm text-white">
                            I agree to the{' '}
                            <a href="/terms" target="_blank" className="text-indigo-400 hover:underline">Terms of Service</a>
                            {' '}and{' '}
                            <a href="/privacy" target="_blank" className="text-indigo-400 hover:underline">Privacy Policy</a>
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                        <input
                            type="checkbox"
                            checked={agreedToDataShare}
                            onChange={(e) => setAgreedToDataShare(e.target.checked)}
                            className="w-5 h-5 mt-0.5 rounded"
                        />
                        <span className="text-sm text-white">
                            I consent to share my encrypted medical records with this provider
                        </span>
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={!canApprove}
                        className={`flex-1 py-3 rounded-xl font-medium ${canApprove
                                ? 'btn-gradient'
                                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        Approve Access
                    </button>
                </div>
            </div>
        </div>
    )
}
