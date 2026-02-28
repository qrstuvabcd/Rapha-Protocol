import { useState, useEffect } from 'react'
import { BountyCard } from './BountyCard'
import { JoinPoolModal, type JoinSettings } from './JoinPoolModal'

// ============ Types ============

export interface BountyPool {
    address: string
    metadataCid: string
    condition: string
    dataType: string
    companyName: string
    bountyPerUser: number
    maxUsers: number
    currentParticipants: number
    deadline: number
    totalBudget: number
    state: 'OPEN' | 'FILLED' | 'EXECUTED' | 'EXPIRED'
}

interface BountyOpportunitiesProps {
    patientTags?: string[] // Patient's medical conditions for filtering
}

// ============ Component ============

export function BountyOpportunities({ patientTags = [] }: BountyOpportunitiesProps) {
    const [pools, setPools] = useState<BountyPool[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'matching'>('all')
    const [joinedPools, setJoinedPools] = useState<Set<string>>(new Set())
    const [selectedPool, setSelectedPool] = useState<BountyPool | null>(null)

    // Load pools from contract (mocked for now)
    useEffect(() => {
        loadPools()
    }, [])

    const loadPools = async () => {
        setIsLoading(true)

        // TODO: Call factory.getActivePools() from blockchain
        // const factoryContract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider)
        // const poolAddresses = await factoryContract.getActivePools()
        // const pools = await Promise.all(poolAddresses.map(addr => fetchPoolInfo(addr)))

        await new Promise(r => setTimeout(r, 300))

        // Empty until connected to blockchain
        setPools([])
        setIsLoading(false)
    }

    // Filter pools based on patient's medical tags (browser-side for privacy)
    const filteredPools = filter === 'matching' && patientTags.length > 0
        ? pools.filter(pool => patientTags.some(tag =>
            pool.condition.toLowerCase().includes(tag.toLowerCase()) ||
            pool.dataType.toLowerCase().includes(tag.toLowerCase())
        ))
        : pools

    const openPools = filteredPools.filter(p => p.state === 'OPEN')

    const handleJoinClick = (pool: BountyPool) => {
        setSelectedPool(pool)
    }

    const handleJoinConfirm = async (settings: JoinSettings) => {
        if (!selectedPool) return

        // In production, this would:
        // 1. Call joinPool() on the contract
        // 2. Trigger Lit Protocol signature
        console.log('Joining pool:', selectedPool.address, 'with settings:', settings)

        // Update local state
        setJoinedPools(prev => new Set(prev).add(selectedPool.address))
        setSelectedPool(null)

        // Refresh pool data
        await loadPools()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-white">Data Bounty Opportunities</h2>
                    <p className="text-slate-400 text-sm">
                        Contribute your data to research and earn rewards
                    </p>
                </div>

                {patientTags.length > 0 && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === 'all'
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:text-white'
                                }`}
                        >
                            All Campaigns
                        </button>
                        <button
                            onClick={() => setFilter('matching')}
                            className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === 'matching'
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:text-white'
                                }`}
                        >
                            Matching Your Profile
                        </button>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="glass-card p-12 text-center">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading opportunities...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && openPools.length === 0 && (
                <div className="glass-card p-12 text-center">
                    <div className="text-6xl mb-4 opacity-50">🔬</div>
                    <h4 className="text-xl font-medium text-slate-400 mb-2">
                        No Active Campaigns
                    </h4>
                    <p className="text-slate-500 max-w-md mx-auto">
                        There are no data bounty campaigns available right now.
                        Check back later for new opportunities to contribute your data to research.
                    </p>
                </div>
            )}

            {/* Pool Cards */}
            {!isLoading && openPools.length > 0 && (
                <div className="grid gap-4">
                    {openPools.map(pool => (
                        <BountyCard
                            key={pool.address}
                            pool={pool}
                            hasJoined={joinedPools.has(pool.address)}
                            onJoin={() => handleJoinClick(pool)}
                        />
                    ))}
                </div>
            )}

            {/* Info Box */}
            <div className="glass-card p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
                <div className="flex items-start gap-3">
                    <span className="text-xl">💡</span>
                    <div>
                        <p className="text-emerald-400 font-medium text-sm">How It Works</p>
                        <p className="text-slate-400 text-sm mt-1">
                            When you join a campaign, your encrypted data is used for research.
                            Once the campaign reaches its participant goal, you'll receive your reward automatically.
                            Your data remains encrypted and only the compute node can process it securely.
                        </p>
                    </div>
                </div>
            </div>

            {/* Join Pool Modal */}
            {selectedPool && (
                <JoinPoolModal
                    pool={selectedPool}
                    onConfirm={handleJoinConfirm}
                    onClose={() => setSelectedPool(null)}
                />
            )}
        </div>
    )
}
