import { useState } from 'react'
import { type StoredRecord } from '../services/recordStorage.service'

interface ViewRecordConfirmModalProps {
    record: StoredRecord
    onConfirm: () => void
    onCancel: () => void
    viewerType: 'patient' | 'provider' | 'researcher'
}

/**
 * Confirmation modal before viewing any medical record
 * Requires Terms/Privacy agreement before accessing data
 */
export function ViewRecordConfirmModal({
    record,
    onConfirm,
    onCancel,
    viewerType
}: ViewRecordConfirmModalProps) {
    const [agreedToPolicy, setAgreedToPolicy] = useState(false)
    const [agreedToDataUse, setAgreedToDataUse] = useState(false)

    // Patients only need 1 checkbox, others need 2
    const canView = viewerType === 'patient'
        ? agreedToPolicy
        : agreedToPolicy && agreedToDataUse

    const viewerLabel = {
        patient: 'Your Medical Record',
        provider: 'Patient Record',
        researcher: 'Research Data'
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
            <div className="glass-card p-6 max-w-md w-full">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
                        🔒
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">View {viewerLabel[viewerType]}</h3>
                        <p className="text-sm text-slate-400">Access Protected Data</p>
                    </div>
                </div>

                {/* Record Info */}
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-xl">
                            {record.recordType === 'MRI' && '🧠'}
                            {record.recordType === 'Blood' && '🩸'}
                            {record.recordType === 'X-Ray' && '📷'}
                            {record.recordType === 'Lab' && '🧪'}
                            {!['MRI', 'Blood', 'X-Ray', 'Lab'].includes(record.recordType) && '📋'}
                        </div>
                        <div>
                            <h4 className="font-medium text-white">{record.recordType} Record</h4>
                            <p className="text-sm text-slate-400">{record.fileName}</p>
                            <p className="text-xs text-slate-500">
                                Uploaded: {new Date(record.timestamp).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Warning */}
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-4">
                    <p className="text-orange-400 font-medium text-sm">⚠️ Important:</p>
                    <ul className="text-sm text-slate-300 space-y-1 mt-2">
                        <li>• This record contains sensitive medical information</li>
                        <li>• Access is logged and auditable</li>
                        {viewerType !== 'patient' && (
                            <li>• You may only use this data for the stated purpose</li>
                        )}
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

                    {viewerType !== 'patient' && (
                        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                            <input
                                type="checkbox"
                                checked={agreedToDataUse}
                                onChange={(e) => setAgreedToDataUse(e.target.checked)}
                                className="w-5 h-5 mt-0.5 rounded"
                            />
                            <span className="text-sm text-white">
                                I will only use this data for legitimate {viewerType === 'provider' ? 'healthcare' : 'research'} purposes
                            </span>
                        </label>
                    )}
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
                        disabled={!canView}
                        className={`flex-1 py-3 rounded-xl font-medium ${canView
                            ? 'btn-gradient'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        View Record
                    </button>
                </div>
            </div>
        </div>
    )
}
