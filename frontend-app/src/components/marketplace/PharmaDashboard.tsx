import { useState, useEffect } from 'react'
import { CreatePoolWithBot } from './CreatePoolWithBot'
import { ResearchDisclaimer, TestingDisclaimer } from '../LegalDisclaimer'
import { isDemoMode, DEMO_CAMPAIGNS } from '../../services/demoMode'

// ============ Types ============

type Tab = 'create' | 'campaigns'

interface Campaign {
    address: string
    title: string
    condition: string
    dataType: string
    bountyPerUser: number
    maxUsers: number
    currentParticipants: number
    totalBudget: number
    deadline: number
    state: 'OPEN' | 'FILLED' | 'EXECUTED' | 'EXPIRED'
}

// ============ Component ============

export function PharmaDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>('campaigns')

    // In production, this would come from the factory contract
    const [campaigns, setCampaigns] = useState<Campaign[]>([])

    useEffect(() => {
        if (isDemoMode()) {
            setCampaigns(DEMO_CAMPAIGNS)
        }
    }, [])


    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'create', label: 'Create Pool', icon: '🚀' },
        { id: 'campaigns', label: 'My Campaigns', icon: '📋' }
    ]

    const activeCampaigns = campaigns.filter(c => c.state === 'OPEN')

    return (
        <div className="space-y-6">
            {/* Testing Stage Warning */}
            <TestingDisclaimer />

            {/* Header */}
            <div className="glass-card p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl">
                            🔬
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">AI Research Studio</h1>
                            <p className="text-slate-400">Create bounty pools with your AI bot for patient-contributed data</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-xs text-slate-500">Active Campaigns</p>
                            <p className="text-lg font-bold text-white">{activeCampaigns.length}</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-xl">
                            ⚡
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-800/50 text-slate-400 hover:text-white'
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                        {tab.id === 'campaigns' && campaigns.length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-xs text-black font-bold flex items-center justify-center">
                                {campaigns.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'create' && (
                <CreatePoolWithBot />
            )}

            {activeTab === 'campaigns' && (
                <div className="space-y-4">
                    {campaigns.length === 0 ? (
                        <div className="glass-card p-12 text-center">
                            <div className="text-6xl mb-4 opacity-50">📋</div>
                            <h4 className="text-xl font-medium text-slate-400 mb-2">No Campaigns Yet</h4>
                            <p className="text-slate-500 mb-6">
                                Create your first bounty pool to start collecting data
                            </p>
                            <button
                                onClick={() => setActiveTab('create')}
                                className="btn-gradient px-6 py-2"
                            >
                                Create Pool
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {campaigns.map(campaign => (
                                <div key={campaign.address} className="glass-card p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{campaign.title}</h3>
                                            <p className="text-slate-400 text-sm">
                                                {campaign.condition} • {campaign.dataType}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${campaign.state === 'OPEN' ? 'bg-emerald-500/20 text-emerald-400' :
                                            campaign.state === 'FILLED' ? 'bg-amber-500/20 text-amber-400' :
                                                campaign.state === 'EXECUTED' ? 'bg-sky-500/20 text-sky-400' :
                                                    'bg-red-500/20 text-red-400'
                                            }`}>
                                            {campaign.state}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500">Participants</p>
                                            <p className="text-white font-medium">
                                                {campaign.currentParticipants} / {campaign.maxUsers}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Reward</p>
                                            <p className="text-white font-medium">${campaign.bountyPerUser} USDC</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Total Budget</p>
                                            <p className="text-white font-medium">${campaign.totalBudget.toLocaleString()} USDC</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Deadline</p>
                                            <p className="text-white font-medium">
                                                {new Date(campaign.deadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                                                style={{ width: `${(campaign.currentParticipants / campaign.maxUsers) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Legal Disclaimer */}
            <ResearchDisclaimer />
        </div>
    )
}
