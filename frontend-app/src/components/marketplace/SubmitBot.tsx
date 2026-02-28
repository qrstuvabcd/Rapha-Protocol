import { useState } from 'react'
import { TestingDisclaimer } from '../LegalDisclaimer'
import { isFactoryDeployed } from '../../services/bounty.service'

interface BotSubmissionForm {
    botName: string
    organization: string
    description: string
    trainingPurpose: string
    dataNeeded: string
    bountyPerUser: string
    maxParticipants: string
    durationDays: string
    contactEmail: string
    repositoryUrl: string
    acceptTerms: boolean
}

const initialForm: BotSubmissionForm = {
    botName: '',
    organization: '',
    description: '',
    trainingPurpose: '',
    dataNeeded: '',
    bountyPerUser: '',
    maxParticipants: '',
    durationDays: '7',
    contactEmail: '',
    repositoryUrl: '',
    acceptTerms: false
}

export function SubmitBot() {
    const [form, setForm] = useState<BotSubmissionForm>(initialForm)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Sandbox State
    const [botFile, setBotFile] = useState<File | null>(null)
    const [isVerifying, setIsVerifying] = useState(false)
    const [isVerified, setIsVerified] = useState(false)

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

            // Simulate verification process
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!form.acceptTerms) {
            setError('You must accept the terms and disclaimer to proceed')
            return
        }

        if (!form.botName || !form.organization || !form.description || !form.contactEmail) {
            setError('Please fill in all required fields')
            return
        }

        if (!botFile || !isVerified) {
            setError('You must upload your AI Bot code to the Sandbox and wait for verification.')
            return
        }

        setIsSubmitting(true)

        try {
            // In demo mode, just simulate success
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

    if (submitted) {
        return (
            <div className="glass-card p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-4xl">
                    ✓
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Submission Received!</h3>
                <p className="text-slate-400 mb-6">
                    {isContractDeployed
                        ? 'Your data pool has been created on-chain. Users can now join and contribute data.'
                        : 'Your submission has been recorded. We will contact you when the on-chain system is ready.'
                    }
                </p>
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-6">
                    <p className="text-sm text-amber-400">
                        ⚠️ Remember: This system is in <strong>BETA TESTING</strong>.
                        Results are not guaranteed and Rapha Protocol takes no responsibility.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSubmitted(false)
                        setForm(initialForm)
                        setBotFile(null)
                        setIsVerified(false)
                    }}
                    className="btn-gradient px-6 py-2"
                >
                    Submit Another Bot
                </button>
            </div>
        )
    }

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
                        The on-chain data pool contract is not yet deployed. Your submission will be recorded
                        and you'll be notified when the system goes live.
                    </p>
                </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl">
                        🤖
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Submit Your AI Bot</h3>
                        <p className="text-sm text-slate-400">Create a data pool for your AI training needs</p>
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Bot Information */}
                <div className="space-y-4">
                    <h4 className="text-white font-medium border-b border-white/10 pb-2">Bot Information</h4>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Bot Name *</label>
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
                            <label className="block text-sm text-slate-400 mb-1">Organization *</label>
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
                        <label className="block text-sm text-slate-400 mb-1">Description *</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe your AI bot and what it does..."
                            rows={3}
                            className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none resize-none"
                            required
                        />
                    </div>

                    {/* Sandbox Dropzone */}
                    <div className="p-5 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 hover:border-purple-500 transition-colors">
                        <label className="block text-sm text-slate-400 mb-2">Upload Bot Code (Sandbox Verification) *</label>

                        {!botFile ? (
                            <div className="relative text-center py-6">
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept=".py,.ipynb,.dockerfile,.zip"
                                />
                                <div className="text-4xl mb-2">📦</div>
                                <p className="text-purple-400 font-bold mb-1">Drop your AI Bot here</p>
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
                                🔒 Your code has been verified and will be encrypted before deployment.
                            </div>
                        )}
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

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Data Needed</label>
                        <input
                            type="text"
                            name="dataNeeded"
                            value={form.dataNeeded}
                            onChange={handleChange}
                            placeholder="e.g., Blood glucose readings, BMI, lifestyle data"
                            className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Pool Configuration */}
                <div className="space-y-4">
                    <h4 className="text-white font-medium border-b border-white/10 pb-2">Data Pool Configuration</h4>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Bounty per User (USDC)</label>
                            <input
                                type="number"
                                name="bountyPerUser"
                                value={form.bountyPerUser}
                                onChange={handleChange}
                                placeholder="e.g., 25"
                                min="1"
                                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Max Participants</label>
                            <input
                                type="number"
                                name="maxParticipants"
                                value={form.maxParticipants}
                                onChange={handleChange}
                                placeholder="e.g., 500"
                                min="1"
                                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Duration (Days)</label>
                            <select
                                name="durationDays"
                                value={form.durationDays}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-slate-800/50 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
                            >
                                <option value="1">1 day</option>
                                <option value="3">3 days</option>
                                <option value="7">7 days</option>
                                <option value="14">14 days</option>
                                <option value="30">30 days</option>
                            </select>
                        </div>
                    </div>

                    {form.bountyPerUser && form.maxParticipants && (
                        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <p className="text-sm text-slate-400">
                                Total Budget: <span className="text-purple-400 font-bold">
                                    ${calculateTotalBudget().toLocaleString()} USDC
                                </span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                    <h4 className="text-white font-medium border-b border-white/10 pb-2">Contact Information</h4>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Contact Email *</label>
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

                {/* Terms Acceptance */}
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="acceptTerms"
                            checked={form.acceptTerms}
                            onChange={handleChange}
                            className="mt-1 w-5 h-5 rounded border-red-500 text-red-500 focus:ring-red-500"
                        />
                        <span className="text-sm text-slate-300">
                            I understand that this system is in <strong className="text-amber-400">BETA TESTING</strong> and
                            may not work as expected. I accept that <strong className="text-red-400">Rapha Protocol takes
                                NO responsibility</strong> for any issues, losses, or damages. I agree to the{' '}
                            <a href="/terms" className="text-indigo-400 hover:underline">Terms of Service</a>.
                        </span>
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting || !form.acceptTerms || !isVerified}
                    className="w-full btn-gradient py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                        </span>
                    ) : (
                        <>🚀 Submit Bot & Create Data Pool</>
                    )}
                </button>
            </form>
        </div>
    )
}

export default SubmitBot
