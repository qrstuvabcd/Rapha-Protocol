import { useState } from 'react'
import { QRScannerModal } from '../components/QRCode'

const ACCESS_REQUESTS_KEY = 'aura_access_requests'

export interface AccessRequest {
    id: string
    providerAddress: string
    providerName: string
    patientAddress: string
    recordTypes: string[]
    message: string
    status: 'pending' | 'approved' | 'denied'
    createdAt: number
}

/**
 * Create a new access request from provider to patient
 */
export function createAccessRequest(
    providerAddress: string,
    providerName: string,
    patientAddress: string,
    recordTypes: string[],
    message: string
): AccessRequest {
    const request: AccessRequest = {
        id: `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        providerAddress: providerAddress.toLowerCase(),
        providerName,
        patientAddress: patientAddress.toLowerCase(),
        recordTypes,
        message,
        status: 'pending',
        createdAt: Date.now(),
    }

    const requests = getAllRequests()
    requests.push(request)
    localStorage.setItem(ACCESS_REQUESTS_KEY, JSON.stringify(requests))

    return request
}

/**
 * Get requests sent by a provider
 */
export function getProviderRequests(providerAddress: string): AccessRequest[] {
    return getAllRequests().filter(r => r.providerAddress === providerAddress.toLowerCase())
}

/**
 * Get requests received by a patient
 */
export function getPatientRequests(patientAddress: string): AccessRequest[] {
    return getAllRequests().filter(r => r.patientAddress === patientAddress.toLowerCase())
}

/**
 * Update request status (approve/deny)
 */
export function updateRequestStatus(requestId: string, status: 'approved' | 'denied'): boolean {
    const requests = getAllRequests()
    const index = requests.findIndex(r => r.id === requestId)

    if (index === -1) return false

    requests[index].status = status
    localStorage.setItem(ACCESS_REQUESTS_KEY, JSON.stringify(requests))

    return true
}

function getAllRequests(): AccessRequest[] {
    const stored = localStorage.getItem(ACCESS_REQUESTS_KEY)
    if (!stored) return []
    try {
        return JSON.parse(stored)
    } catch {
        return []
    }
}

// ========== React Component ==========

interface AccessRequestModalProps {
    providerAddress: string
    providerName: string
    onClose: () => void
    onRequestSent: (request: AccessRequest) => void
}

export function AccessRequestModal({ providerAddress, providerName, onClose, onRequestSent }: AccessRequestModalProps) {
    const [patientAddress, setPatientAddress] = useState('')
    const [recordTypes, setRecordTypes] = useState<string[]>([])
    const [message, setMessage] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [showQRScanner, setShowQRScanner] = useState(false)

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

        if (!patientAddress.startsWith('0x') || patientAddress.length !== 42) {
            setError('Please enter a valid patient wallet address')
            return
        }

        try {
            const request = createAccessRequest(
                providerAddress,
                providerName,
                patientAddress,
                recordTypes,
                message
            )
            onRequestSent(request)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send request')
        }
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-white">Request Access</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                        <p className="text-sm text-slate-300">
                            <strong>📨 Request patient access.</strong> The patient will receive your request and can
                            approve or deny access to their records.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Patient Wallet Address <span className="text-red-400">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={patientAddress}
                                        onChange={(e) => setPatientAddress(e.target.value)}
                                        placeholder="0x..."
                                        className="input-glass font-mono text-sm flex-1"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowQRScanner(true)}
                                        className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-2 whitespace-nowrap"
                                    >
                                        📷 Scan QR
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Record Types Needed
                                    <span className="text-slate-500 text-xs ml-2">(leave empty for all)</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {allRecordTypes.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => toggleRecordType(type)}
                                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${recordTypes.includes(type)
                                                ? 'bg-green-500 text-white'
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
                                    Message to Patient
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Explain why you need access to these records..."
                                    className="input-glass min-h-[80px] resize-none"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700">
                                    Cancel
                                </button>
                                <button type="submit" className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 py-3 rounded-xl text-white font-medium">
                                    Send Request
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            {showQRScanner && (
                <QRScannerModal
                    onScan={(address) => {
                        setPatientAddress(address)
                        setShowQRScanner(false)
                    }}
                    onClose={() => setShowQRScanner(false)}
                />
            )}
        </>
    )
}
