import { useState } from 'react'

// ============ Types & Constants ============

interface CampaignForm {
    title: string
    description: string
    dataType: string
    bountyPerUser: string
    maxUsers: string
    duration: string
    requirements: string[]
}

const DURATIONS = [
    { value: '1d', label: '1 Day' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '3m', label: '3 Months' }
]

const calculateBudget = (form: CampaignForm) => {
    const bounty = Number(form.bountyPerUser) || 0
    const users = Number(form.maxUsers) || 0
    const rawTotal = bounty * users
    const fee = rawTotal * 0.2 // 20% protocol fee
    return {
        totalBudget: rawTotal + fee,
        fee
    }
}

// ============ Component ============

export function CreateCampaign() {
    const [form, setForm] = useState<CampaignForm>({
        title: '',
        description: '',
        dataType: 'mri_brain_scan',
        bountyPerUser: '',
        maxUsers: '',
        duration: '7d',
        requirements: []
    })
    const [agreedToPolicy, setAgreedToPolicy] = useState(false)
    const [isCreating, setIsCreating] = useState(false)

    const handleInputChange = (field: keyof CampaignForm, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const { totalBudget } = calculateBudget(form)
    const isFormValid = form.title && form.description && form.bountyPerUser && form.maxUsers && totalBudget > 0

    const handleCreate = async () => {
        if (!isFormValid || !agreedToPolicy) return

        setIsCreating(true)
        // Simulate network request
        setTimeout(() => {
            setIsCreating(false)
            alert('Campaign created! (This is a demo action)')
            // Reset form could happen here
        }, 2000)
    }

    return (
        <div className="space-y-6">
            <div className="glass-card p-6">
                <h3 className="text-xl font-bold text-white mb-6">Create New Data Campaign</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Campaign Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder="e.g. Brain Tumor MRI Collection"
                            className="input-glass w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Describe the data you need and research goals..."
                            className="input-glass w-full h-32 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Data Type
                            </label>
                            <select
                                value={form.dataType}
                                onChange={(e) => handleInputChange('dataType', e.target.value)}
                                className="input-glass w-full"
                            >
                                <option value="mri_brain_scan">MRI Brain Scan</option>
                                <option value="ct_chest_scan">CT Chest Scan</option>
                                <option value="xray_bone">X-Ray (Bone)</option>
                                <option value="blood_test_pdf">Blood Test (PDF)</option>
                                <option value="genomic_raw">Genomic Data (Raw)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Budget & Economics */}
            <div className="glass-card p-6 bg-emerald-500/5 border-emerald-500/20">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl">
                        💰
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Budget & Rewards</h3>
                        <p className="text-slate-400 text-sm">Define bounty per user and total cap</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Bounty Amount (USDC) <span className="text-red-400">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-slate-400">$</span>
                            <input
                                type="number"
                                value={form.bountyPerUser}
                                onChange={(e) => handleInputChange('bountyPerUser', e.target.value)}
                                placeholder="50"
                                min={1}
                                className="input-glass flex-1"
                            />
                            <span className="text-slate-400">USDC</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Max Participants <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            value={form.maxUsers}
                            onChange={(e) => handleInputChange('maxUsers', e.target.value)}
                            placeholder="500"
                            min={1}
                            className="input-glass w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Campaign Duration
                        </label>
                        <select
                            value={form.duration}
                            onChange={(e) => handleInputChange('duration', e.target.value)}
                            className="input-glass w-full"
                        >
                            {DURATIONS.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Budget Summary */}
                {totalBudget > 0 && (
                    <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm">Total Budget Required</p>
                                <p className="text-2xl font-bold text-white">
                                    ${totalBudget.toLocaleString()} <span className="text-sm text-slate-400">USDC</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-sm">Breakdown</p>
                                <p className="text-white">
                                    ${form.bountyPerUser} • {form.maxUsers} users
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* CRITICAL RISK WARNING */}
            <div className="glass-card p-6 bg-red-500/5 border-red-500/30">
                <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                    ⚠️ Important Legal & Financial Warnings
                </h3>

                <div className="space-y-3 text-sm">
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-white font-medium">🔒 Fund Locking</p>
                        <p className="text-slate-300">
                            Your ${totalBudget.toLocaleString() || '0'} USDC will be <strong>locked in a smart contract</strong> until
                            the campaign fills or expires. You cannot withdraw early.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <h4 className="text-emerald-400 font-medium mb-2">⚖️ Fill or Kill</h4>
                        <p className="text-slate-300">
                            Funds are only released if the campaign requirements are met.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                        <p className="text-white font-medium">⚠️ Data Quality Disclaimer</p>
                        <p className="text-slate-300">
                            Rapha Protocol <strong>does NOT verify</strong> the accuracy, completeness, or suitability of any data.
                            All data is provided "AS-IS" without warranty.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-white font-medium">⚠️ AI Model Liability</p>
                        <p className="text-slate-300">
                            You assume <strong>full responsibility</strong> for any AI models trained on this data.
                            Rapha Protocol is not liable for any outcomes, diagnoses, or decisions made using such models.
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                        <p className="text-white font-medium">💸 Protocol Fee</p>
                        <p className="text-slate-300">
                            Rapha Protocol takes a <strong>20% protocol fee</strong> from successful campaigns.
                            80% goes to participants, 20% to the treasury.
                        </p>
                    </div>
                </div>

                <p className="text-xs text-slate-500 mt-4">
                    By deploying a campaign, you agree to our{' '}
                    <a href="/terms" className="text-indigo-400 hover:underline">Terms of Service</a> and{' '}
                    <a href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</a>.
                </p>
            </div>

            {/* Policy Agreement Checkbox */}
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
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
                            ⚠️ I confirm I have read and understood all warnings above. This action is irreversible.
                        </p>
                    </div>
                </label>
            </div>

            {/* Create Button */}
            <button
                onClick={handleCreate}
                disabled={!isFormValid || isCreating || !agreedToPolicy}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isFormValid && !isCreating && agreedToPolicy
                    ? 'btn-gradient'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
            >
                {isCreating ? (
                    <span className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating Campaign...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        🚀 Deploy Bounty Pool
                        {totalBudget > 0 && ` • $${totalBudget.toLocaleString()} USDC`}
                    </span>
                )}
            </button>

            <p className="text-center text-xs text-slate-500">
                ⚠️ By creating, you acknowledge all warnings above and agree to lock ${totalBudget.toLocaleString() || '0'} USDC.
            </p>
        </div>
    )
}
