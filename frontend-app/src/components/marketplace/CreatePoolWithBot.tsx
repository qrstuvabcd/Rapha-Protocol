import { useState } from 'react'
import { TestingDisclaimer } from '../LegalDisclaimer'
import { isFactoryDeployed } from '../../services/bounty.service'

// ============ Types ============

interface PoolForm {
    // Bot Information
    botName: string
    organization: string
    description: string
    trainingPurpose: string
    // Data Requirements
    dataType: string
    dataNeeded: string
    // Pool Economics
    bountyPerUser: string
    maxParticipants: string
    durationDays: string
    // Contact
    contactEmail: string
    repositoryUrl: string
    // Legal
    acceptTerms: boolean
}

const initialForm: PoolForm = {
    botName: '',
    organization: '',
    description: '',
    trainingPurpose: '',
    dataType: 'mri_brain_scan',
    dataNeeded: '',
    bountyPerUser: '',
    maxParticipants: '',
    durationDays: '7',
    contactEmail: '',
    repositoryUrl: '',
    acceptTerms: false
}

const DATA_TYPES = [
    { value: 'mri_brain_scan', label: 'MRI Brain Scan' },
    { value: 'ct_chest_scan', label: 'CT Chest Scan' },
    { value: 'xray_bone', label: 'X-Ray (Bone)' },
    { value: 'blood_test_pdf', label: 'Blood Test (PDF)' },
    { value: 'genomic_raw', label: 'Genomic Data (Raw)' },
    { value: 'ecg_data', label: 'ECG / Heart Monitor' },
    { value: 'clinical_notes', label: 'Clinical Notes' },
    { value: 'other', label: 'Other' }
]

// ============ Component ============

export function CreatePoolWithBot() {
    const [form, setForm] = useState<PoolForm>(initialForm)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Sandbox State
    const [botFile, setBotFile] = useState<File | null>(null)
    const [isVerifying, setIsVerifying] = useState(false)
    const [isVerified, setIsVerified] = useState(false)

    // Step tracker
    const [activeStep, setActiveStep] = useState(0)

    const isContractDeployed = isFactoryDeployed()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        const checked = (e.target as HTMLInputElement).checked
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setBotFile(file)
            setIsVerifying(true)
            setTimeout(() => {
                setIsVerifying(false)
                setIsVerified(true)
            }, 2500)
        }
    }

    const calculateTotalBudget = () => {
        const bounty = parseFloat(form.bountyPerUser) || 0
        const participants = parseInt(form.maxParticipants) || 0
        return bounty * participants
    }

    const totalBudget = calculateTotalBudget()
    const protocolFee = totalBudget * 0.15 // 15% (10% keeper + 5% treasury)
    const totalRequired = totalBudget + protocolFee

    const isStep1Valid = form.botName && form.organization && form.description
    const isStep2Valid = form.bountyPerUser && form.maxParticipants && totalBudget > 0
    const isStep3Valid = form.contactEmail && form.acceptTerms && isVerified

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!form.acceptTerms) {
            setError('You must accept the terms and disclaimer to proceed')
            return
        }

        if (!isStep1Valid || !isStep2Valid) {
            setError('Please fill in all required fields')
            return
        }

        if (!botFile || !isVerified) {
            setError('You must upload your AI Bot code and pass sandbox verification.')
            return
        }

        setIsSubmitting(true)

        try {
            if (!isContractDeployed) {
                await new Promise(resolve => setTimeout(resolve, 2000))
                setSubmitted(true)
                return
            }

            // TODO: Integrate with actual contract when deployed
            // 1. Upload metadata to IPFS
            // 2. Approve USDC spending
            // 3. Call factory.createPool()
            await new Promise(resolve => setTimeout(resolve, 2000))
            setSubmitted(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    // ============ Success State ============

    if (submitted) {
        return (
            <div className="glass-card p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-4xl">
                    ✓
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Pool Created Successfully!</h3>
                <p className="text-slate-400 mb-2">
                    {isContractDeployed
                        ? 'Your bounty pool has been deployed on-chain. Patients can now contribute data.'
                        : 'Your submission has been recorded. We\'ll notify you when the on-chain system goes live.'
                    }
                </p>
                <div className="mt-4 p-4 rounded-xl bg-slate-800/50 border border-white/10 text-left inline-block">
                    <p className="text-sm text-slate-400"><span className="text-white font-medium">Bot:</span> {form.botName}</p>
                    <p className="text-sm text-slate-400"><span className="text-white font-medium">Budget:</span> ${totalRequired.toLocaleString()} USDC</p>
                    <p className="text-sm text-slate-400"><span className="text-white font-medium">Participants:</span> {form.maxParticipants}</p>
                </div>
                <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-400">
                        ⚠️ This system is in <strong>BETA TESTING</strong>. Results are not guaranteed.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSubmitted(false)
                        setForm(initialForm)
                        setBotFile(null)
                        setIsVerified(false)
                        setActiveStep(0)
                    }}
                    className="btn-gradient px-6 py-2 mt-6"
                >
                    Create Another Pool
                </button>
            </div>
        )
    }

    // ============ Steps ============

    const steps = [
        { label: 'AI Bot', icon: '🤖', valid: isStep1Valid },
        { label: 'Data Pool', icon: '💰', valid: isStep2Valid },
        { label: 'Review & Deploy', icon: '🚀', valid: isStep3Valid }
    ]

    return (
        <div className="space-y-6">
            {/* Testing Warning */}
            <TestingDisclaimer />

            {/* Demo Mode Notice */}
            {!isContractDeployed && (
                <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🔧</span>
                        <h4 className="text-sky-400 font-medium">Demo Mode</h4>
                    </div>
                    <p className="text-sm text-slate-400">
                        The on-chain bounty pool contract is not yet deployed. Your submission will be recorded
                        and you'll be notified when the system goes live.
                    </p>
                </div>
            )}

            {/* Step Progress */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between">
                    {steps.map((step, i) => (
                        <button
                            key={step.label}
                            onClick={() => setActiveStep(i)}
                            className="flex items-center gap-3 flex-1 group"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${activeStep === i
                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/30'
                                    : step.valid
                                        ? 'bg-emerald-500/20 border border-emerald-500/30'
                                        : 'bg-slate-800 border border-white/10'
                                }`}>
                                {step.valid && activeStep !== i ? '✓' : step.icon}
                            </div>
                            <div className="text-left hidden md:block">
                                <p className={`text-sm font-medium ${activeStep === i ? 'text-white' : 'text-slate-400'}`}>
                                    Step {i + 1}
                                </p>
                                <p className={`text-xs ${activeStep === i ? 'text-indigo-400' : 'text-slate-500'}`}>
                                    {step.label}
                                </p>
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`flex-1 h-px mx-2 ${step.valid ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* ============ STEP 1: AI Bot Info ============ */}
                {activeStep === 0 && (
                    <div className="glass-card p-6 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                                🤖
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">AI Bot Information</h3>
                                <p className="text-sm text-slate-400">Tell us about your AI model and what data it needs</p>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Bot / Model Name <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    name="botName"
                                    value={form.botName}
                                    onChange={handleChange}
                                    placeholder="e.g., DiabetesPredictor-v1"
                                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Organization <span className="text-red-400">*</span></label>
                                <input
                                    type="text"
                                    name="organization"
                                    value={form.organization}
                                    onChange={handleChange}
                                    placeholder="e.g., HealthAI Labs"
                                    className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Description <span className="text-red-400">*</span></label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Describe your AI model and the research objective..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Training Purpose</label>
                            <textarea
                                name="trainingPurpose"
                                value={form.trainingPurpose}
                                onChange={handleChange}
                                placeholder="What will the trained model be used for?"
                                rows={2}
                                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none"
                            />
                        </div>

                        {/* Bot Code Upload — Sandbox */}
                        <div className="p-5 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 hover:border-purple-500 transition-colors">
                            <label className="block text-sm text-slate-400 mb-2">Upload Bot Code (Sandbox Verification) <span className="text-red-400">*</span></label>

                            {!botFile ? (
                                <div className="relative text-center py-6">
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".py,.ipynb,.dockerfile,.zip"
                                    />
                                    <div className="text-4xl mb-2">📦</div>
                                    <p className="text-purple-400 font-bold mb-1">Drop your AI Bot code here</p>
                                    <p className="text-xs text-slate-400">Python script, Notebook, or Dockerfile (required for TEE)</p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-slate-900 p-4 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl">📄</div>
                                        <div>
                                            <p className="text-white font-medium text-sm">{botFile.name}</p>
                                            <p className="text-xs text-slate-500">{(botFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>

                                    {isVerifying ? (
                                        <div className="flex items-center gap-2 text-indigo-400 text-sm">
                                            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                            Scanning...
                                        </div>
                                    ) : isVerified ? (
                                        <div className="text-green-400 text-sm font-bold flex items-center gap-1">
                                            ✅ Verified Safe
                                        </div>
                                    ) : (
                                        <span className="text-red-400 text-sm">Verification Failed</span>
                                    )}
                                </div>
                            )}

                            {isVerified && (
                                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-xs text-green-300">
                                    🔒 Your code has been verified and will be encrypted before deployment to the TEE.
                                </div>
                            )}
                        </div>

                        {/* Next Button */}
                        <button
                            type="button"
                            onClick={() => setActiveStep(1)}
                            disabled={!isStep1Valid}
                            className="w-full py-3 rounded-xl font-semibold transition-all btn-gradient disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Next: Configure Data Pool →
                        </button>
                    </div>
                )}

                {/* ============ STEP 2: Data Pool Config ============ */}
                {activeStep === 1 && (
                    <div className="space-y-6">
                        <div className="glass-card p-6 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-2xl">
                                    💰
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Data Pool Configuration</h3>
                                    <p className="text-sm text-slate-400">Set bounty rewards and data requirements for your pool</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Data Type <span className="text-red-400">*</span></label>
                                    <select
                                        name="dataType"
                                        value={form.dataType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-emerald-500 focus:outline-none"
                                    >
                                        {DATA_TYPES.map(dt => (
                                            <option key={dt.value} value={dt.value}>{dt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Specific Data Needed</label>
                                    <input
                                        type="text"
                                        name="dataNeeded"
                                        value={form.dataNeeded}
                                        onChange={handleChange}
                                        placeholder="e.g., Blood glucose, BMI, lifestyle data"
                                        className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Bounty per User (USDC) <span className="text-red-400">*</span></label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400">$</span>
                                        <input
                                            type="number"
                                            name="bountyPerUser"
                                            value={form.bountyPerUser}
                                            onChange={handleChange}
                                            placeholder="25"
                                            min="1"
                                            className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Max Participants <span className="text-red-400">*</span></label>
                                    <input
                                        type="number"
                                        name="maxParticipants"
                                        value={form.maxParticipants}
                                        onChange={handleChange}
                                        placeholder="500"
                                        min="1"
                                        className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Duration</label>
                                    <select
                                        name="durationDays"
                                        value={form.durationDays}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-emerald-500 focus:outline-none"
                                    >
                                        <option value="1">1 day</option>
                                        <option value="3">3 days</option>
                                        <option value="7">7 days</option>
                                        <option value="14">14 days</option>
                                        <option value="30">30 days</option>
                                        <option value="90">3 months</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Budget Summary */}
                        {totalBudget > 0 && (
                            <div className="glass-card p-6 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Budget Summary
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500">Patient Rewards (85%)</p>
                                        <p className="text-lg font-bold text-emerald-400">${totalBudget.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Protocol Fee (15%)</p>
                                        <p className="text-lg font-bold text-amber-400">${protocolFee.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Total Escrow</p>
                                        <p className="text-lg font-bold text-white">${totalRequired.toLocaleString()} USDC</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mt-3">
                                    85% → Patients • 10% → Keepers (Validators) • 5% → Treasury
                                </p>
                            </div>
                        )}

                        {/* Next / Back Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveStep(0)}
                                className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium"
                            >
                                ← Back
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveStep(2)}
                                disabled={!isStep2Valid}
                                className="flex-1 py-3 rounded-xl font-semibold transition-all btn-gradient disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next: Review & Deploy →
                            </button>
                        </div>
                    </div>
                )}

                {/* ============ STEP 3: Review & Deploy ============ */}
                {activeStep === 2 && (
                    <div className="space-y-6">
                        {/* Review Summary */}
                        <div className="glass-card p-6">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg">📋</span>
                                Review Your Pool
                            </h3>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Bot Details */}
                                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                                    <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3">AI Bot</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Name</span>
                                            <span className="text-white font-medium">{form.botName || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Organization</span>
                                            <span className="text-white font-medium">{form.organization || '—'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Bot Code</span>
                                            <span className={isVerified ? 'text-emerald-400 font-medium' : 'text-red-400'}>
                                                {isVerified ? '✅ Verified' : '❌ Not verified'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pool Details */}
                                <div className="p-4 rounded-xl bg-slate-800/50 border border-white/5">
                                    <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">Data Pool</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Data Type</span>
                                            <span className="text-white font-medium">
                                                {DATA_TYPES.find(d => d.value === form.dataType)?.label}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Bounty/User</span>
                                            <span className="text-white font-medium">${form.bountyPerUser || '0'} USDC</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Participants</span>
                                            <span className="text-white font-medium">{form.maxParticipants || '0'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Total Escrow</span>
                                            <span className="text-emerald-400 font-bold">${totalRequired.toLocaleString()} USDC</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="glass-card p-6 space-y-4">
                            <h4 className="text-white font-medium border-b border-white/10 pb-2">Contact Information</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Contact Email <span className="text-red-400">*</span></label>
                                    <input
                                        type="email"
                                        name="contactEmail"
                                        value={form.contactEmail}
                                        onChange={handleChange}
                                        placeholder="your@email.com"
                                        className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Repository URL (optional)</label>
                                    <input
                                        type="url"
                                        name="repositoryUrl"
                                        value={form.repositoryUrl}
                                        onChange={handleChange}
                                        placeholder="https://github.com/..."
                                        className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Legal Warnings */}
                        <div className="glass-card p-6 bg-red-500/5 border-red-500/30">
                            <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                                ⚠️ Important Warnings
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                    <p className="text-white font-medium">🔒 Fund Locking</p>
                                    <p className="text-slate-300">
                                        Your ${totalRequired.toLocaleString() || '0'} USDC will be <strong>locked in a smart contract</strong> until
                                        the pool fills or expires. Automatic refund if minimum target is not met.
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                    <p className="text-white font-medium">⚠️ Data Quality</p>
                                    <p className="text-slate-300">
                                        Rapha Protocol <strong>does NOT guarantee</strong> data accuracy. Data is validated by the Keeper Network
                                        but provided "AS-IS" without warranty.
                                    </p>
                                </div>
                                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-white font-medium">⚠️ AI Model Liability</p>
                                    <p className="text-slate-300">
                                        You assume <strong>full responsibility</strong> for any AI models trained on this data.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Terms Acceptance */}
                        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="acceptTerms"
                                    checked={form.acceptTerms}
                                    onChange={handleChange}
                                    className="mt-1 w-5 h-5 rounded border-red-500 text-red-500 focus:ring-red-500"
                                />
                                <span className="text-sm text-slate-300">
                                    I understand this system is in <strong className="text-amber-400">BETA TESTING</strong> and
                                    accept that <strong className="text-red-400">Rapha Protocol takes NO responsibility</strong> for
                                    any issues, losses, or damages. I agree to the{' '}
                                    <a href="/terms" className="text-indigo-400 hover:underline">Terms of Service</a> and{' '}
                                    <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a>.
                                </span>
                            </label>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit / Back Buttons */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setActiveStep(1)}
                                className="px-6 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium"
                            >
                                ← Back
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !form.acceptTerms || !isVerified}
                                className="flex-1 py-4 rounded-xl font-bold text-lg transition-all btn-gradient disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Deploying Pool...
                                    </span>
                                ) : (
                                    <>🚀 Deploy Pool & Submit Bot{totalRequired > 0 ? ` • $${totalRequired.toLocaleString()} USDC` : ''}</>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </form>
        </div>
    )
}

export default CreatePoolWithBot
