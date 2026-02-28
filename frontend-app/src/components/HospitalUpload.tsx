import { useState, useRef } from 'react'
import { QRScannerModal } from './QRCode'
import { saveRecord, generateMockIpfsHash } from '../services/recordStorage.service'
import { mintRecordNFT } from '../services/nft.service'
import { ethers } from 'ethers'

interface HospitalUploadProps {
    hospitalAddress: string
}

type RecordType = 'MRI' | 'Blood' | 'X-Ray' | 'Genomics' | 'Lab' | 'Prescription' | 'Clinical Notes' | 'Other'

export function HospitalUpload({ hospitalAddress }: HospitalUploadProps) {
    const [patientAddress, setPatientAddress] = useState('')
    const [patientNationalId, setPatientNationalId] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [recordType, setRecordType] = useState<RecordType>('Lab')
    const [notes, setNotes] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [uploadStep, setUploadStep] = useState(0)
    const [result, setResult] = useState<{ success: boolean; message: string; tokenId?: string } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showQRScanner, setShowQRScanner] = useState(false)
    const [mintAsNFT, setMintAsNFT] = useState(true)
    const [agreedToPolicy, setAgreedToPolicy] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const recordTypes: RecordType[] = [
        'MRI', 'Blood', 'X-Ray', 'Genomics', 'Lab', 'Prescription', 'Clinical Notes', 'Other'
    ]

    const uploadSteps = mintAsNFT ? [
        'Verifying patient...',
        'Encrypting for patient...',
        'Uploading to IPFS...',
        'Minting NFT on blockchain...',
        'Registering on chain...',
        'Notifying patient...',
    ] : [
        'Verifying patient...',
        'Encrypting for patient...',
        'Uploading to IPFS...',
        'Registering on blockchain...',
        'Notifying patient...',
    ]

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setError(null)
        }
    }

    const lookupPatient = async () => {
        // In production, this would query the blockchain or a registry
        // to find the patient's wallet address from their National ID
        if (!patientNationalId) {
            setError('Please enter patient National ID')
            return
        }

        // Simulate lookup
        setError(null)
        // For demo, we'll just show that lookup would happen
        alert('In production, this would look up the patient wallet from their National ID in the registry.')
    }

    const handleUpload = async () => {
        setError(null)

        if (!patientAddress.startsWith('0x') || patientAddress.length !== 42) {
            setError('Please enter a valid patient wallet address')
            return
        }

        if (!file) {
            setError('Please select a file to upload')
            return
        }

        setIsUploading(true)

        try {
            // Convert file to base64 for storage/preview
            const fileData = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.onerror = reject
                reader.readAsDataURL(file)
            })

            const ipfsHash = generateMockIpfsHash()
            let tokenId: string | undefined

            // Process upload steps
            for (let i = 0; i < uploadSteps.length; i++) {
                setUploadStep(i)

                // NFT minting step
                if (mintAsNFT && uploadSteps[i] === 'Minting NFT on blockchain...') {
                    // Create a demo signer (in production, use actual wallet)
                    const provider = new ethers.JsonRpcProvider()
                    const signer = new ethers.Wallet(ethers.hexlify(ethers.randomBytes(32)), provider)

                    const mintResult = await mintRecordNFT(
                        signer,
                        patientAddress,
                        recordType,
                        ipfsHash
                    )

                    if (mintResult.success) {
                        tokenId = mintResult.tokenId
                        console.log('NFT minted with token ID:', tokenId)
                    }
                } else {
                    await new Promise(r => setTimeout(r, 800))
                }
            }

            // Save the record to localStorage with file data
            const savedRecord = saveRecord({
                patientAddress: patientAddress.toLowerCase(),
                providerAddress: hospitalAddress.toLowerCase(),
                providerName: 'Healthcare Provider',
                recordType,
                fileName: file.name,
                fileSize: file.size,
                notes,
                ipfsHash,
                fileData,                    // Base64 data for preview
                mimeType: file.type,         // e.g., 'image/png'
                tokenId,                     // NFT token ID if minted
                isMinted: mintAsNFT && !!tokenId,
            })

            console.log('Record saved:', savedRecord)

            setResult({
                success: true,
                message: mintAsNFT
                    ? `Record minted as NFT #${tokenId} for patient ${patientAddress.slice(0, 10)}...`
                    : `Record uploaded successfully for patient ${patientAddress.slice(0, 10)}...`,
                tokenId
            })
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    const resetForm = () => {
        setPatientAddress('')
        setPatientNationalId('')
        setFile(null)
        setRecordType('Lab')
        setNotes('')
        setResult(null)
        setError(null)
        setUploadStep(0)
    }

    if (result?.success) {
        return (
            <div className="glass-card p-8 text-center max-w-xl mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Record Uploaded!</h3>
                <p className="text-slate-400 mb-6">{result.message}</p>
                <p className="text-sm text-slate-500 mb-6">
                    The patient will see this record in their dashboard and can grant access to other providers.
                </p>
                <button onClick={resetForm} className="btn-gradient px-8 py-3">
                    Upload Another Record
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass-card p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl">
                        📤
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Hospital Record Upload</h2>
                        <p className="text-slate-400">Upload medical records directly to patient's blockchain wallet</p>
                    </div>
                </div>
            </div>

            {isUploading ? (
                <div className="glass-card p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center animate-pulse-glow">
                        <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                    </div>
                    <p className="text-xl font-medium text-white mb-2">{uploadSteps[uploadStep]}</p>
                    <div className="flex justify-center gap-2 mt-6">
                        {uploadSteps.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full ${i <= uploadStep ? 'bg-blue-500' : 'bg-slate-600'}`} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold text-white mb-6">Patient Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Patient Lookup by National ID */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Patient National ID
                                <span className="text-slate-500 text-xs ml-2">(lookup wallet)</span>
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={patientNationalId}
                                    onChange={(e) => setPatientNationalId(e.target.value)}
                                    placeholder="Enter patient's National ID"
                                    className="input-glass flex-1"
                                />
                                <button onClick={lookupPatient} className="btn-accent px-4">
                                    Lookup
                                </button>
                            </div>
                        </div>

                        {/* Direct Wallet Address */}
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
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowQRScanner(true)}
                                    className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors flex items-center gap-2"
                                >
                                    📷 Scan QR
                                </button>
                            </div>
                        </div>
                    </div>

                    <hr className="border-white/10 my-6" />

                    <h3 className="text-lg font-bold text-white mb-6">Record Details</h3>

                    {/* File Upload */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-6 ${file ? 'border-green-500/50 bg-green-500/10' : 'border-slate-600 hover:border-blue-500/50'
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
                                <div className="text-4xl mb-2">📄</div>
                                <p className="text-white font-medium">Select medical record file</p>
                                <p className="text-slate-400 text-sm">PDF, DICOM, JPG, PNG</p>
                            </>
                        )}
                    </div>

                    {/* Record Type */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">Record Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {recordTypes.map(type => (
                                <button
                                    key={type}
                                    onClick={() => setRecordType(type)}
                                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${recordType === type ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Clinical Notes <span className="text-slate-500 text-xs">(optional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any relevant notes for the patient..."
                            className="input-glass min-h-[100px] resize-none"
                        />
                    </div>

                    {/* Mint as NFT Toggle */}
                    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">⛓️</div>
                                <div>
                                    <h4 className="font-medium text-white">Mint as NFT</h4>
                                    <p className="text-sm text-slate-400">Create an on-chain NFT for this record</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setMintAsNFT(!mintAsNFT)}
                                className={`relative w-14 h-7 rounded-full transition-colors ${mintAsNFT
                                    ? 'bg-gradient-to-r from-violet-500 to-purple-500'
                                    : 'bg-slate-600'
                                    }`}
                            >
                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${mintAsNFT ? 'right-1' : 'left-1'
                                    }`} />
                            </button>
                        </div>
                        {mintAsNFT && (
                            <div className="mt-3 text-xs text-slate-400 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                Patient will own this NFT • Immutable proof of record • Full audit trail
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-sm mb-6">
                            {error}
                        </div>
                    )}

                    {/* Info Box */}
                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-6">
                        <p className="text-sm text-slate-300">
                            <strong>🔐 End-to-End Encryption:</strong> This record will be encrypted with the patient's
                            public key. Only the patient can decrypt it. They can then grant access to other providers.
                        </p>
                    </div>

                    {/* ⚠️ Policy Agreement */}
                    <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-6">
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

                    <button
                        onClick={handleUpload}
                        disabled={!patientAddress || !file || !agreedToPolicy}
                        className={`w-full py-4 rounded-xl font-medium text-lg transition-all ${patientAddress && file && agreedToPolicy
                            ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        Encrypt & Upload to Patient
                    </button>
                </div>
            )}

            {showQRScanner && (
                <QRScannerModal
                    onScan={(address) => {
                        setPatientAddress(address)
                        setShowQRScanner(false)
                    }}
                    onClose={() => setShowQRScanner(false)}
                />
            )}
        </div>
    )
}
