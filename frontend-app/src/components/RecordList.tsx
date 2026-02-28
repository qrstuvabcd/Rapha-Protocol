import { useState, useEffect } from 'react'
import { getPatientRecords, type StoredRecord } from '../services/recordStorage.service'
import { ViewRecordConfirmModal } from './ViewRecordConfirmModal'

interface RecordListProps {
    walletAddress: string
    viewerMode?: 'patient' | 'provider' | 'researcher'
}

export function RecordList({ walletAddress, viewerMode = 'patient' }: RecordListProps) {
    const [records, setRecords] = useState<StoredRecord[]>([])
    const [filter, setFilter] = useState<string>('all')
    const [viewingRecord, setViewingRecord] = useState<StoredRecord | null>(null)
    const [pendingViewRecord, setPendingViewRecord] = useState<StoredRecord | null>(null)
    const [isTraining, setIsTraining] = useState(false)
    const [trainingComplete, setTrainingComplete] = useState(false)

    // Sandbox State
    const [modelFile, setModelFile] = useState<File | null>(null)
    const [isVerifying, setIsVerifying] = useState(false)
    const [modelVerified, setModelVerified] = useState(false)

    const recordTypes = ['all', 'MRI', 'Blood', 'X-Ray', 'Genomics', 'Lab', 'Prescription', 'Clinical Notes', 'Other']

    // Load records when component mounts or wallet changes
    useEffect(() => {
        const patientRecords = getPatientRecords(walletAddress)
        setRecords(patientRecords)
    }, [walletAddress])

    // Filter records by type
    const filteredRecords = filter === 'all'
        ? records
        : records.filter(r => r.recordType === filter)

    // Handle view click - show confirmation first
    const handleViewClick = (record: StoredRecord) => {
        setPendingViewRecord(record)
    }

    // Handle confirmed view
    const handleViewConfirm = () => {
        if (pendingViewRecord) {
            setViewingRecord(pendingViewRecord)
            setPendingViewRecord(null)
        }
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setModelFile(file)
            setIsVerifying(true)

            // Simulate verification process
            setTimeout(() => {
                setIsVerifying(false)
                setModelVerified(true)
            }, 2000)
        }
    }

    const handleRunTraining = async () => {
        setIsTraining(true)
        // Simulate sending signed message to TEE
        await new Promise(resolve => setTimeout(resolve, 2000))
        setIsTraining(false)
        setTrainingComplete(true)
    }

    const resetViewer = () => {
        setViewingRecord(null)
        setTrainingComplete(false)
        setModelFile(null)
        setModelVerified(false)
        setIsVerifying(false)
    }

    return (
        <>
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white">Your Medical Records</h3>
                        <p className="text-sm text-slate-500">{records.length} total records</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {recordTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors ${filter === type
                                    ? 'bg-sky-500 text-white'
                                    : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                    }`}
                            >
                                {type === 'all' ? 'All' : type}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredRecords.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4 opacity-50">📋</div>
                        <h4 className="text-xl font-medium text-slate-400 mb-2">
                            {records.length === 0 ? 'No Records Yet' : 'No matching records'}
                        </h4>
                        <p className="text-slate-500">
                            {records.length === 0
                                ? 'Records uploaded by healthcare providers will appear here'
                                : 'Try selecting a different filter'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredRecords.map(record => (
                            <RecordCard
                                key={record.id}
                                record={record}
                                onView={() => handleViewClick(record)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Record Viewer Modal */}
            {viewingRecord && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{viewingRecord.recordType} Record</h3>
                                <p className="text-sm text-slate-400">{viewingRecord.fileName}</p>
                            </div>
                            <button
                                onClick={resetViewer}
                                className="text-slate-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Image Preview / CoD Logic */}
                        {viewerMode === 'researcher' ? (
                            <div className="mb-6 p-6 rounded-xl bg-slate-900 text-center border border-indigo-500/30">
                                <div className="text-6xl mb-4">🔒</div>
                                <h4 className="text-xl font-bold text-white mb-2">Compute-Over-Data Only</h4>
                                <p className="text-slate-400 mb-6 text-sm">
                                    Why can't I see this? For privacy, raw data is never exposed to researchers.
                                    You can only run certified training jobs inside a Trusted Execution Environment (TEE).
                                </p>

                                {/* Sandbox Upload Section */}
                                {!modelVerified ? (
                                    <div className="mb-6 p-6 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 hover:border-indigo-500 transition-colors text-center relative">
                                        <input
                                            type="file"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept=".py,.ipynb,.dockerfile"
                                            disabled={isVerifying}
                                        />
                                        {isVerifying ? (
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                                                <h5 className="text-lg font-bold text-white mb-1">Verifying Secure Sandbox...</h5>
                                                <p className="text-xs text-slate-400">Scanning for malicious patterns...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="text-4xl mb-2">🕵️</div>
                                                <h5 className="text-lg font-bold text-white mb-1">Upload AI Model Code</h5>
                                                <p className="text-xs text-slate-400 mb-2">Drop your Python script or Docker container here for verification</p>
                                                <div className="inline-block px-4 py-2 rounded-lg bg-slate-700 text-xs text-white pointer-events-none">
                                                    Select File (.py, .ipynb)
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-left">
                                            <span className="text-2xl">📄</span>
                                            <div>
                                                <p className="font-bold text-white text-sm">{modelFile?.name || 'model.py'}</p>
                                                <p className="text-xs text-green-400">✅ Verified Safe for TEE</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setModelVerified(false)}
                                            className="text-slate-400 hover:text-white"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                {trainingComplete ? (
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-3xl mx-auto mb-2">
                                            ✨
                                        </div>
                                        <h3 className="text-xl font-bold text-white">Training Complete!</h3>
                                        <p className="text-slate-400 text-sm">Weights encrypted and sent to wallet.</p>
                                        <div className="flex gap-2 justify-center mt-2">
                                            <button className="px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 text-sm">
                                                Download Weights
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleRunTraining}
                                            disabled={isTraining || !modelVerified}
                                            className={`px-8 py-3 w-full max-w-sm flex items-center justify-center gap-3 mx-auto rounded-xl font-bold transition-all ${!modelVerified
                                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                : 'btn-gradient shadow-lg shadow-indigo-500/20'
                                                }`}
                                        >
                                            {isTraining ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Initializing Secure Enclave...
                                                </>
                                            ) : (
                                                <>
                                                    <span>🧠</span> Run Training Job (TEE)
                                                </>
                                            )}
                                        </button>
                                        <p className="text-xs text-slate-500 mt-4">
                                            Verified by Lit Protocol + Phala Network
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : viewingRecord.fileData && viewingRecord.mimeType?.startsWith('image/') ? (
                            <div className="mb-6 rounded-xl overflow-hidden bg-slate-900">
                                <img
                                    src={viewingRecord.fileData}
                                    alt={viewingRecord.fileName}
                                    className="w-full max-h-[400px] object-contain cursor-pointer"
                                    onClick={() => window.open(viewingRecord.fileData, '_blank')}
                                    title="Click to view full size"
                                />
                            </div>
                        ) : viewingRecord.fileData && viewingRecord.mimeType === 'application/pdf' ? (
                            <div className="mb-6 p-8 rounded-xl bg-slate-900 text-center">
                                <div className="text-6xl mb-4">📄</div>
                                <p className="text-slate-400 mb-4">PDF Document</p>
                                <button
                                    onClick={() => window.open(viewingRecord.fileData, '_blank')}
                                    className="btn-gradient px-6 py-2"
                                >
                                    Open PDF
                                </button>
                            </div>
                        ) : (
                            <div className="mb-6 p-6 rounded-xl bg-slate-900">
                                <div className="text-center mb-4">
                                    <div className="text-5xl mb-3">📋</div>
                                    <p className="text-white font-medium">{viewingRecord.fileName}</p>
                                    <p className="text-sm text-slate-500">
                                        {viewingRecord.mimeType || 'Unknown type'} • {(viewingRecord.fileSize / 1024).toFixed(1)} KB
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                                    <p className="text-amber-400 text-sm">
                                        ⚠️ Preview not available - file was uploaded before preview feature was added
                                    </p>
                                    <p className="text-slate-500 text-xs mt-1">
                                        The record is stored securely. Re-upload to enable preview.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Record Details */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-xl bg-slate-800/50">
                                <p className="text-xs text-slate-500 mb-1">Record Type</p>
                                <p className="text-white font-medium">{viewingRecord.recordType}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-800/50">
                                <p className="text-xs text-slate-500 mb-1">File Size</p>
                                <p className="text-white font-medium">{(viewingRecord.fileSize / 1024).toFixed(1)} KB</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-800/50">
                                <p className="text-xs text-slate-500 mb-1">Uploaded By</p>
                                <p className="text-white font-medium">{viewingRecord.providerName}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-800/50">
                                <p className="text-xs text-slate-500 mb-1">Date</p>
                                <p className="text-white font-medium">{new Date(viewingRecord.timestamp).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {/* IPFS Hash */}
                        <div className="p-4 rounded-xl bg-slate-800/50 mb-6">
                            <p className="text-xs text-slate-500 mb-1">IPFS Hash</p>
                            <p className="text-white font-mono text-sm break-all">{viewingRecord.ipfsHash}</p>
                        </div>

                        {/* NFT Badge */}
                        {viewingRecord.isMinted && (
                            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">⛓️</span>
                                    <div>
                                        <p className="text-violet-400 font-medium">NFT Token #{viewingRecord.tokenId}</p>
                                        <p className="text-sm text-slate-400">This record is minted on-chain</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {viewingRecord.notes && (
                            <div className="p-4 rounded-xl bg-slate-800/50 mb-6">
                                <p className="text-xs text-slate-500 mb-2">Clinical Notes</p>
                                <p className="text-slate-300">{viewingRecord.notes}</p>
                            </div>
                        )}

                        <button
                            onClick={resetViewer}
                            className="w-full py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {pendingViewRecord && (
                <ViewRecordConfirmModal
                    record={pendingViewRecord}
                    viewerType="patient"
                    onConfirm={handleViewConfirm}
                    onCancel={() => setPendingViewRecord(null)}
                />
            )}
        </>
    )
}

interface RecordCardProps {
    record: StoredRecord
    onView: () => void
}

function RecordCard({ record, onView }: RecordCardProps) {
    const typeIcons: Record<string, string> = {
        MRI: '🧠',
        Blood: '🩸',
        'X-Ray': '🦴',
        Genomics: '🧬',
        Lab: '🔬',
        Prescription: '💊',
        'Clinical Notes': '📝',
        Other: '📄',
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5 hover:border-sky-500/30 transition-colors">
            <div className="flex items-center gap-4">
                {/* Thumbnail or Icon */}
                {record.fileData && record.mimeType?.startsWith('image/') ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                        <img
                            src={record.fileData}
                            alt={record.fileName}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-violet-500/20 flex items-center justify-center text-2xl">
                        {typeIcons[record.recordType] || '📄'}
                    </div>
                )}
                <div>
                    <h4 className="font-semibold text-white">{record.recordType} Record</h4>
                    <p className="text-sm text-slate-400">
                        {record.fileName} • {formatFileSize(record.fileSize)}
                    </p>
                    <p className="text-xs text-slate-500">
                        {new Date(record.timestamp).toLocaleDateString()} • From: {record.providerName}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
                {record.isOriginVerified ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        🛡️ Verified by ZK-TLS
                    </span>
                ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/30 flex items-center gap-1">
                        📝 Self-Reported
                    </span>
                )}
                {record.isQualityChecked && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/30">
                        ✅ Quality Checked
                    </span>
                )}
                <span className="badge badge-success">🔐 Encrypted</span>
                {record.isMinted && (
                    <span className="badge bg-violet-500/20 text-violet-400 border-violet-500/30">⛓️ NFT</span>
                )}
                <button
                    onClick={onView}
                    className="px-4 py-2 rounded-xl bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors text-sm font-medium"
                >
                    View
                </button>
            </div>
        </div>
    )
}
