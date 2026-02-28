import { useState, useRef } from 'react'
import { uploadMedicalRecord, type UploadResult } from '../services/record.service'
import { unlockWallet } from '../services/wallet.service'
import { ethers } from 'ethers'

interface UploadModalProps {
    walletAddress: string
    onClose: () => void
    onUploadComplete?: (result: UploadResult) => void
}

type RecordType = 'MRI' | 'Blood' | 'X-Ray' | 'Genomics' | 'Lab' | 'Prescription' | 'Clinical Notes' | 'Other'

export function UploadModal({ walletAddress, onClose, onUploadComplete }: UploadModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [recordType, setRecordType] = useState<RecordType>('MRI')
    const [providerAddress, setProviderAddress] = useState('')
    const [password, setPassword] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [uploadStep, setUploadStep] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<UploadResult | null>(null)
    const [agreedToPolicy, setAgreedToPolicy] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const recordTypes: RecordType[] = [
        'MRI', 'Blood', 'X-Ray', 'Genomics', 'Lab', 'Prescription', 'Clinical Notes', 'Other'
    ]

    const uploadSteps = [
        'Unlocking wallet...',
        'Encrypting file...',
        'Uploading to IPFS...',
        'Registering on blockchain...',
        'Complete!',
    ]

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setError(null)
        }
    }

    const handleUpload = async () => {
        if (!file || !providerAddress || !password) {
            setError('Please fill in all fields')
            return
        }

        if (!providerAddress.startsWith('0x') || providerAddress.length !== 42) {
            setError('Please enter a valid provider address')
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            // Step 1: Unlock wallet
            setUploadStep(0)
            const session = await unlockWallet(password)

            // Connect to local network
            const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
            const signer = new ethers.Wallet(session.privateKey, provider)

            // Step 2-4: Upload flow
            setUploadStep(1)
            await new Promise(r => setTimeout(r, 500)) // Show step

            const uploadResult = await uploadMedicalRecord({
                file,
                recordType,
                providerAddress,
                patientAddress: walletAddress,
                signer,
            })

            if (uploadResult.success) {
                setUploadStep(4)
                setResult(uploadResult)
                onUploadComplete?.(uploadResult)
            } else {
                throw new Error(uploadResult.error || 'Upload failed')
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
            setIsUploading(false)
        }
    }

    if (result) {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">Record Uploaded!</h3>
                    <p className="text-slate-400 mb-6">Your file has been encrypted and stored securely.</p>

                    <div className="glass-card p-4 mb-6 text-left">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">IPFS Hash:</span>
                                <span className="font-mono text-green-400">{result.ipfsCid?.slice(0, 20)}...</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Integrity Hash:</span>
                                <span className="font-mono text-slate-300">{result.integrityHash?.slice(0, 16)}...</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Record ID:</span>
                                <span className="font-mono text-slate-300">{String(result.recordId).slice(0, 16)}...</span>
                            </div>
                        </div>
                    </div>

                    <button onClick={onClose} className="btn-gradient px-8 py-3">
                        Done
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Upload Medical Record</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {isUploading ? (
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center animate-pulse-glow">
                            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <p className="text-xl font-medium text-white mb-2">{uploadSteps[uploadStep]}</p>
                        <div className="flex justify-center gap-2 mt-6">
                            {uploadSteps.map((_, i) => (
                                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= uploadStep ? 'bg-indigo-500' : 'bg-slate-600'}`} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* File Drop Zone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${file ? 'border-green-500/50 bg-green-500/10' : 'border-slate-600 hover:border-indigo-500/50'
                                }`}
                        >
                            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
                            {file ? (
                                <>
                                    <div className="text-4xl mb-2">✅</div>
                                    <p className="text-white font-medium">{file.name}</p>
                                    <p className="text-slate-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </>
                            ) : (
                                <>
                                    <div className="text-4xl mb-2">📤</div>
                                    <p className="text-white font-medium">Drop your file here</p>
                                    <p className="text-slate-400 text-sm">or click to browse</p>
                                </>
                            )}
                        </div>

                        {/* Record Type */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Record Type</label>
                            <div className="grid grid-cols-4 gap-2">
                                {recordTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setRecordType(type)}
                                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${recordType === type ? 'bg-indigo-500 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Provider Address */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Provider Address (Hospital/Clinic)
                            </label>
                            <input
                                type="text"
                                value={providerAddress}
                                onChange={(e) => setProviderAddress(e.target.value)}
                                placeholder="0x..."
                                className="input-glass font-mono text-sm"
                            />
                        </div>

                        {/* Password to unlock wallet */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Your Password (to sign transaction)
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your wallet password"
                                className="input-glass"
                            />
                        </div>

                        {error && (
                            <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* ⚠️ Policy Agreement */}
                        <div className="mt-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agreedToPolicy}
                                    onChange={(e) => setAgreedToPolicy(e.target.checked)}
                                    className="w-5 h-5 mt-0.5 rounded"
                                />
                                <div>
                                    <p className="text-white text-sm">
                                        I agree to the{' '}
                                        <a href="/terms" target="_blank" className="text-indigo-400 hover:underline">Terms of Service</a>
                                        {' '}and{' '}
                                        <a href="/privacy" target="_blank" className="text-indigo-400 hover:underline">Privacy Policy</a>
                                    </p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        ⚠️ This action will be recorded on the blockchain and cannot be undone.
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 mt-8">
                            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700">
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={!file || !providerAddress || !password || !agreedToPolicy}
                                className={`flex-1 py-3 rounded-xl font-medium transition-all ${file && providerAddress && password && agreedToPolicy ? 'btn-gradient' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                    }`}
                            >
                                Encrypt & Upload
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
