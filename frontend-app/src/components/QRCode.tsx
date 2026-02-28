import { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'

interface ShareQRModalProps {
    walletAddress: string
    userName: string
    onClose: () => void
}

export function ShareQRModal({ walletAddress, userName, onClose }: ShareQRModalProps) {
    const [copied, setCopied] = useState(false)

    // Create a shareable data object
    const shareData = JSON.stringify({
        type: 'rapha_protocol_patient',
        address: walletAddress,
        name: userName,
    })

    const copyAddress = async () => {
        await navigator.clipboard.writeText(walletAddress)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6 text-center">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Share Your Address</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-slate-400 mb-6">
                    Show this QR code to your doctor or hospital so they can send you records or request access.
                </p>

                {/* QR Code */}
                <div className="bg-white p-6 rounded-2xl inline-block mb-6">
                    <QRCodeSVG
                        value={shareData}
                        size={200}
                        level="H"
                        includeMargin={false}
                    />
                </div>

                {/* User Info */}
                <div className="glass-card p-4 mb-6 text-left">
                    <p className="text-sm text-slate-400 mb-1">Name</p>
                    <p className="text-white font-medium mb-3">{userName}</p>

                    <p className="text-sm text-slate-400 mb-1">Wallet Address</p>
                    <div className="flex items-center gap-2">
                        <p className="text-white font-mono text-sm flex-1 break-all">{walletAddress}</p>
                        <button
                            onClick={copyAddress}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${copied ? 'bg-green-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            {copied ? '✅ Copied' : 'Copy'}
                        </button>
                    </div>
                </div>

                <button onClick={onClose} className="btn-gradient px-8 py-3 w-full">
                    Done
                </button>
            </div>
        </div>
    )
}

// QR Scanner Component for providers to scan patient QR
interface QRScannerModalProps {
    onScan: (address: string) => void
    onClose: () => void
}

export function QRScannerModal({ onScan, onClose }: QRScannerModalProps) {
    const [manualAddress, setManualAddress] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isScanning, setIsScanning] = useState(false)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const scannerContainerId = 'qr-scanner-container'

    useEffect(() => {
        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { })
            }
        }
    }, [])

    const startScanner = async () => {
        setError(null)
        setCameraError(null)
        setIsScanning(true)

        try {
            scannerRef.current = new Html5Qrcode(scannerContainerId)

            await scannerRef.current.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    // Successfully scanned
                    handleQRData(decodedText)
                },
                () => {
                    // QR code not found in frame - ignore
                }
            )
        } catch (err) {
            setIsScanning(false)
            setCameraError(err instanceof Error ? err.message : 'Failed to access camera')
        }
    }

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop()
            } catch {
                // Ignore stop errors
            }
        }
        setIsScanning(false)
    }

    const handleQRData = async (data: string) => {
        await stopScanner()

        try {
            // Try to parse as JSON (Rapha Protocol QR format)
            const parsed = JSON.parse(data)
            if ((parsed.type === 'rapha_protocol_patient' || parsed.type === 'aura_health_patient') && parsed.address) {
                onScan(parsed.address)
                onClose()
                return
            }
        } catch {
            // Not JSON, check if it's a raw address
        }

        // Check if it's a raw Ethereum address
        if (data.startsWith('0x') && data.length === 42) {
            onScan(data)
            onClose()
            return
        }

        setError('Invalid QR code. Please scan a patient\'s Rapha Protocol QR code.')
    }

    const handleManualSubmit = () => {
        if (!manualAddress.startsWith('0x') || manualAddress.length !== 42) {
            setError('Please enter a valid wallet address')
            return
        }
        onScan(manualAddress)
        onClose()
    }

    const handleClose = async () => {
        await stopScanner()
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Scan Patient QR</h3>
                    <button onClick={handleClose} className="text-slate-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Camera Scanner */}
                <div className="mb-6">
                    {!isScanning ? (
                        <div
                            onClick={startScanner}
                            className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-green-500/50 transition-colors"
                        >
                            <div className="text-5xl mb-4">?��</div>
                            <p className="text-white font-medium">Click to Start Camera</p>
                            <p className="text-slate-400 text-sm mt-2">
                                Point camera at patient's QR code
                            </p>
                        </div>
                    ) : (
                        <div className="relative">
                            <div
                                id={scannerContainerId}
                                className="rounded-xl overflow-hidden bg-black"
                                style={{ minHeight: '280px' }}
                            />
                            <button
                                onClick={stopScanner}
                                className="absolute top-2 right-2 px-3 py-1 rounded-lg bg-red-500/80 text-white text-sm hover:bg-red-500 transition-colors"
                            >
                                Stop
                            </button>
                        </div>
                    )}

                    {cameraError && (
                        <div className="mt-4 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm">
                            ?�� Camera access issue: {cameraError}
                            <p className="text-slate-400 mt-1">Try entering the address manually below.</p>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-slate-700"></div>
                    <span className="text-slate-500 text-sm">or enter manually</span>
                    <div className="flex-1 h-px bg-slate-700"></div>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="0x..."
                        className="input-glass font-mono text-sm"
                    />

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <div className="flex gap-4">
                        <button onClick={handleClose} className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700">
                            Cancel
                        </button>
                        <button onClick={handleManualSubmit} className="flex-1 btn-gradient py-3">
                            Use Address
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
