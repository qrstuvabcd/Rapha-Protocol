import { useState, useEffect } from 'react'
import { getProviderGrants, type AccessGrant } from '../services/access.service'
import { AccessRequestModal, getProviderRequests, type AccessRequest } from '../services/accessRequest.service.tsx'
import { HospitalUpload } from './HospitalUpload'
import { getPatientRecords, type StoredRecord } from '../services/recordStorage.service'

interface ProviderPortalProps {
    walletAddress: string
    providerName: string
}

type ProviderTab = 'patients' | 'requests' | 'upload'

export function ProviderPortal({ walletAddress, providerName }: ProviderPortalProps) {
    const [grants, setGrants] = useState<AccessGrant[]>([])
    const [requests, setRequests] = useState<AccessRequest[]>([])
    const [activeTab, setActiveTab] = useState<ProviderTab>('patients')
    const [showRequestModal, setShowRequestModal] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [viewingPatient, setViewingPatient] = useState<{ address: string; records: StoredRecord[] } | null>(null)
    const [fullscreenImage, setFullscreenImage] = useState<{ src: string; name: string } | null>(null)
    const [pendingViewPatient, setPendingViewPatient] = useState<string | null>(null)
    const [agreedToPolicy, setAgreedToPolicy] = useState(false)
    const [agreedToDataUse, setAgreedToDataUse] = useState(false)

    useEffect(() => {
        const providerGrants = getProviderGrants(walletAddress)
        const providerRequests = getProviderRequests(walletAddress)
        setGrants(providerGrants)
        setRequests(providerRequests)
        setIsLoading(false)
    }, [walletAddress])

    const handleRequestSent = (request: AccessRequest) => {
        setRequests([...requests, request])
    }

    const handleViewClick = (patientAddress: string) => {
        setPendingViewPatient(patientAddress)
        setAgreedToPolicy(false)
        setAgreedToDataUse(false)
    }

    const handleViewConfirm = () => {
        if (pendingViewPatient && agreedToPolicy && agreedToDataUse) {
            const records = getPatientRecords(pendingViewPatient)
            setViewingPatient({ address: pendingViewPatient, records })
            setPendingViewPatient(null)
        }
    }

    const uniquePatients = [...new Set(grants.map(g => g.patientAddress))]
    const pendingRequests = requests.filter(r => r.status === 'pending')


    if (isLoading) {
        return (
            <div className="glass-card p-12 text-center">
                <div className="w-12 h-12 mx-auto border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400">Loading provider data...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-2xl">
                            🏥
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-white">Doctor Portal</h2>
                                <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium flex items-center gap-1">
                                    🔐 Blockchain Encryption Enabled
                                </span>
                            </div>
                            <p className="text-slate-400">Upload encrypted records to patients & manage access requests</p>
                        </div>
                    </div>
                    <button onClick={() => setShowRequestModal(true)} className="btn-gradient flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Request Access
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                    <p className="text-3xl font-bold text-white">{grants.length}</p>
                    <p className="text-sm text-slate-400">Active Grants</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-3xl font-bold text-white">{uniquePatients.length}</p>
                    <p className="text-sm text-slate-400">Patients</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-3xl font-bold text-yellow-400">{pendingRequests.length}</p>
                    <p className="text-sm text-slate-400">Pending Requests</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-3xl font-bold text-white">0</p>
                    <p className="text-sm text-slate-400">Records Uploaded</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('patients')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'patients'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    👥 Patients ({uniquePatients.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'requests'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    📨 My Requests ({requests.length})
                </button>
                <button
                    onClick={() => setActiveTab('upload')}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${activeTab === 'upload'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    📤 Upload to Patient
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'patients' && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Patients With Access Grants</h3>

                    {grants.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4 opacity-50">📋</div>
                            <h4 className="text-lg font-medium text-slate-400 mb-2">No Patient Grants Yet</h4>
                            <p className="text-slate-500 text-sm mb-4">
                                Request access from patients to view their medical records.
                            </p>
                            <button onClick={() => setShowRequestModal(true)} className="btn-gradient">
                                Request Access
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {grants.map(grant => (
                                <div
                                    key={grant.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-green-500/30 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                            P
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-white">Patient</h4>
                                            <p className="text-sm text-slate-400 font-mono">
                                                {grant.patientAddress.slice(0, 10)}...{grant.patientAddress.slice(-6)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="badge badge-success">Access Granted</span>
                                        <button
                                            onClick={() => handleViewClick(grant.patientAddress)}
                                            className="btn-accent text-sm px-4 py-2"
                                        >
                                            View Records
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'requests' && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Access Requests Sent</h3>

                    {requests.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4 opacity-50">📨</div>
                            <h4 className="text-lg font-medium text-slate-400 mb-2">No Requests Sent</h4>
                            <p className="text-slate-500 text-sm">
                                Send access requests to patients using their wallet address.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map(request => (
                                <div
                                    key={request.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5"
                                >
                                    <div>
                                        <p className="font-medium text-white">Patient: {request.patientAddress.slice(0, 10)}...</p>
                                        <p className="text-sm text-slate-400">
                                            {request.recordTypes.length > 0 ? request.recordTypes.join(', ') : 'All records'}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Sent: {new Date(request.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`badge ${request.status === 'pending' ? 'badge-warning' :
                                        request.status === 'approved' ? 'badge-success' : 'badge-error'
                                        }`}>
                                        {request.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'upload' && (
                <HospitalUpload hospitalAddress={walletAddress} />
            )}

            {showRequestModal && (
                <AccessRequestModal
                    providerAddress={walletAddress}
                    providerName={providerName}
                    onClose={() => setShowRequestModal(false)}
                    onRequestSent={handleRequestSent}
                />
            )}

            {/* Patient Records Viewer Modal */}
            {viewingPatient && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white">Patient Records</h3>
                                <p className="text-sm text-slate-400 font-mono mt-1">
                                    {viewingPatient.address.slice(0, 10)}...{viewingPatient.address.slice(-6)}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingPatient(null)}
                                className="text-slate-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {viewingPatient.records.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4 opacity-50">📋</div>
                                <h4 className="text-lg font-medium text-slate-400 mb-2">No Records Found</h4>
                                <p className="text-slate-500 text-sm">
                                    This patient doesn't have any records uploaded yet.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {viewingPatient.records.map(record => (
                                    <div
                                        key={record.id}
                                        className="p-4 rounded-xl bg-slate-800/50 border border-white/5"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Image Preview or Icon */}
                                            {record.fileData && record.mimeType?.startsWith('image/') ? (
                                                <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
                                                    <img
                                                        src={record.fileData}
                                                        alt={record.fileName}
                                                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => window.open(record.fileData, '_blank')}
                                                        title="Click to view full size"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-sky-500/20 to-violet-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                                                    {record.recordType === 'MRI' ? '🧠' :
                                                        record.recordType === 'Blood' ? '🩸' :
                                                            record.recordType === 'X-Ray' ? '📷' :
                                                                record.recordType === 'Genomics' ? '🧬' :
                                                                    record.recordType === 'Lab' ? '🧪' :
                                                                        record.recordType === 'Prescription' ? '💊' : '📄'}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h4 className="font-medium text-white">{record.fileName}</h4>
                                                        <p className="text-sm text-slate-400">
                                                            {record.recordType} • {(record.fileSize / 1024).toFixed(1)} KB
                                                        </p>
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {new Date(record.timestamp).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-lg">
                                                            🔐 Encrypted
                                                        </span>
                                                        {record.isMinted && (
                                                            <span className="text-xs text-violet-400 bg-violet-500/20 px-2 py-1 rounded-lg">
                                                                ⛓️ NFT #{record.tokenId}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {record.notes && (
                                            <p className="mt-3 text-sm text-slate-400 bg-slate-900/50 p-3 rounded-lg">
                                                {record.notes}
                                            </p>
                                        )}

                                        {/* Download/View Actions */}
                                        <div className="mt-3 flex gap-2">
                                            {record.fileData ? (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            const link = document.createElement('a')
                                                            link.href = record.fileData!
                                                            link.download = record.fileName
                                                            link.click()
                                                        }}
                                                        className="flex-1 px-3 py-2 rounded-lg bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 text-sm font-medium flex items-center justify-center gap-2"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                        Download
                                                    </button>
                                                    {record.mimeType?.startsWith('image/') && record.fileData && (
                                                        <button
                                                            onClick={() => setFullscreenImage({ src: record.fileData!, name: record.fileName })}
                                                            className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-sm font-medium flex items-center justify-center gap-2"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            View Full
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-xs text-amber-400/70">
                                                    ⚠️ Download not available - uploaded before this feature
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={() => setViewingPatient(null)}
                                className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fullscreen Image Viewer */}
            {fullscreenImage && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
                    onClick={() => setFullscreenImage(null)}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <img
                            src={fullscreenImage.src}
                            alt={fullscreenImage.name}
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button
                                onClick={() => {
                                    const link = document.createElement('a')
                                    link.href = fullscreenImage.src
                                    link.download = fullscreenImage.name
                                    link.click()
                                }}
                                className="px-4 py-2 rounded-lg bg-sky-500 text-white hover:bg-sky-600 text-sm font-medium flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </button>
                            <button
                                onClick={() => setFullscreenImage(null)}
                                className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 text-sm font-medium"
                            >
                                ✕ Close
                            </button>
                        </div>
                        <p className="text-center text-white mt-3 text-sm">{fullscreenImage.name}</p>
                    </div>
                </div>
            )}
            {/* Doctor View Confirmation Modal */}
            {pendingViewPatient && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
                    <div className="glass-card p-6 max-w-md w-full">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-2xl">
                                🔒
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">View Patient Records</h3>
                                <p className="text-sm text-slate-400">Access Protected Data</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-4">
                            <p className="text-sm text-white">Patient: {pendingViewPatient.slice(0, 10)}...{pendingViewPatient.slice(-6)}</p>
                        </div>

                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-4">
                            <p className="text-orange-400 font-medium text-sm">⚠️ Important:</p>
                            <ul className="text-sm text-slate-300 space-y-1 mt-2">
                                <li>• This access is logged and auditable</li>
                                <li>• Use data only for authorized healthcare purposes</li>
                                <li>• Patient has consented to share with you</li>
                            </ul>
                        </div>

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
                                    checked={agreedToDataUse}
                                    onChange={(e) => setAgreedToDataUse(e.target.checked)}
                                    className="w-5 h-5 mt-0.5 rounded"
                                />
                                <span className="text-sm text-white">
                                    I will only use this data for legitimate healthcare purposes
                                </span>
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setPendingViewPatient(null)}
                                className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleViewConfirm}
                                disabled={!agreedToPolicy || !agreedToDataUse}
                                className={`flex-1 py-3 rounded-xl font-medium ${agreedToPolicy && agreedToDataUse
                                        ? 'btn-gradient'
                                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                View Records
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
