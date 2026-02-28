import { useState } from 'react'
import { DataPortal } from './DataPortal'

// ============ Types ============

interface PurchaseFormState {
    condition: string
    dataType: string
    budget: string
}

// ============ Constants ============

const CONDITIONS = [
    'Alzheimer\'s Disease',
    'Parkinson\'s Disease',
    'Multiple Sclerosis',
    'Type 2 Diabetes',
    'Cardiovascular Disease',
    'Breast Cancer',
    'Lung Cancer',
    'COVID-19',
    'Depression',
    'Other'
]

const DATA_TYPES = [
    'MRI',
    'Blood',
    'X-Ray',
    'Genomics',
    'Lab',
    'Prescription',
    'Clinical Notes',
    'Other',
    'All Types'
]

// ============ Component ============

export function CreateComputeJob() {
    const [form, setForm] = useState<PurchaseFormState>({
        condition: '',
        dataType: '',
        budget: ''
    })

    const [isPurchasing, setIsPurchasing] = useState(false)
    const [purchaseComplete, setPurchaseComplete] = useState(false)
    const [portalId, setPortalId] = useState<string | null>(null)
    const [showPortal, setShowPortal] = useState(false)

    const handleInputChange = (field: keyof PurchaseFormState, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handlePurchase = async () => {
        if (!form.condition || !form.dataType || !form.budget) return

        setIsPurchasing(true)

        // Simulate payment processing
        await new Promise(r => setTimeout(r, 2000))

        // Generate portal ID
        const id = `PORTAL-${Date.now().toString(36).toUpperCase()}`
        setPortalId(id)
        setPurchaseComplete(true)
        setIsPurchasing(false)
    }

    const resetForm = () => {
        setForm({
            condition: '',
            dataType: '',
            budget: ''
        })
        setPurchaseComplete(false)
        setPortalId(null)
    }

    // Purchase Complete View
    if (purchaseComplete && portalId) {
        return (
            <div className="glass-card p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Access Granted!</h2>
                <p className="text-slate-400 mb-6">Your data portal is ready</p>

                <div className="glass-card p-6 mb-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                    <p className="text-xs text-slate-500 mb-1">Your Portal ID</p>
                    <p className="text-2xl font-mono font-bold text-white">{portalId}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-slate-800/50">
                        <p className="text-xs text-slate-500 mb-1">Condition</p>
                        <p className="text-white font-medium">{form.condition}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/50">
                        <p className="text-xs text-slate-500 mb-1">Data Type</p>
                        <p className="text-white font-medium">{form.dataType}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/50">
                        <p className="text-xs text-slate-500 mb-1">Amount Paid</p>
                        <p className="text-white font-medium">${form.budget} USDC</p>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-6">
                    <h4 className="text-emerald-400 font-medium mb-2">🎉 What's Included</h4>
                    <ul className="text-sm text-slate-400 space-y-1 text-left">
                        <li>✓ Access to anonymized {form.dataType} for {form.condition}</li>
                        <li>✓ Secure data portal with download capabilities</li>
                        <li>✓ API access for programmatic data retrieval</li>
                        <li>✓ Research-compliant data format (FHIR/HL7)</li>
                        <li>✓ Patient consent verification on-chain</li>
                    </ul>
                </div>

                <div className="flex gap-4">
                    <button
                        onClick={resetForm}
                        className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    >
                        Purchase More Access
                    </button>
                    <button
                        className="flex-1 btn-gradient py-3"
                        onClick={() => setShowPortal(true)}
                    >
                        Open Data Portal →
                    </button>
                </div>

                {/* Data Portal Modal */}
                {showPortal && (
                    <DataPortal
                        portalId={portalId!}
                        condition={form.condition}
                        dataType={form.dataType}
                        amountPaid={form.budget}
                        onClose={() => setShowPortal(false)}
                    />
                )}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Step 1: Select Data Criteria */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm font-bold">1</span>
                    Select Data Criteria
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Condition */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Medical Condition <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={form.condition}
                            onChange={(e) => handleInputChange('condition', e.target.value)}
                            className="input-glass w-full"
                        >
                            <option value="">Select condition...</option>
                            {CONDITIONS.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Data Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Data Type <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={form.dataType}
                            onChange={(e) => handleInputChange('dataType', e.target.value)}
                            className="input-glass w-full"
                        >
                            <option value="">Select data type...</option>
                            {DATA_TYPES.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Info about selected data */}
                {form.condition && form.dataType && (
                    <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">📊</span>
                            <div>
                                <p className="text-slate-400 text-sm">Selected Dataset</p>
                                <p className="text-white font-medium">{form.condition} - {form.dataType}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Data availability depends on patient consent and on-chain records.
                        </p>
                    </div>
                )}
            </div>

            {/* Step 2: Set Your Budget */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-bold">2</span>
                    Set Your Budget
                </h3>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                        Payment Amount (USDC) <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 text-xl">$</span>
                        <input
                            type="number"
                            value={form.budget}
                            onChange={(e) => handleInputChange('budget', e.target.value)}
                            placeholder="Enter your budget"
                            min={1}
                            className="input-glass flex-1 text-xl font-bold"
                        />
                        <span className="text-slate-400">USDC</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Your contribution is distributed to participating patients who consented to share their data.
                    </p>
                </div>

                {/* Quick budget options */}
                <div className="flex gap-2 flex-wrap">
                    {[1000, 5000, 10000, 25000, 50000].map(amount => (
                        <button
                            key={amount}
                            onClick={() => handleInputChange('budget', amount.toString())}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${form.budget === amount.toString()
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-700/50 text-slate-400 hover:text-white'
                                }`}
                        >
                            ${amount >= 1000 ? `${amount / 1000}k` : amount}
                        </button>
                    ))}
                </div>
            </div>

            {/* Purchase Button */}
            <button
                onClick={handlePurchase}
                disabled={!form.condition || !form.dataType || !form.budget || isPurchasing}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${form.condition && form.dataType && form.budget && !isPurchasing
                    ? 'btn-gradient'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    }`}
            >
                {isPurchasing ? (
                    <span className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing Payment...
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        🔓 Purchase Data Access
                        {form.budget && ` • $${parseInt(form.budget).toLocaleString()} USDC`}
                    </span>
                )}
            </button>

            <p className="text-center text-xs text-slate-500">
                By purchasing, you agree to the data usage terms. All transactions are recorded on-chain.
            </p>
        </div>
    )
}
