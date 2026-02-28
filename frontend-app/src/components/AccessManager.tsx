import { useState, useEffect } from 'react'
import { getPatientGrants, revokeGrant, formatExpiration, createAccessGrant, type AccessGrant } from '../services/access.service'
import { getPatientRequests, updateRequestStatus, type AccessRequest } from '../services/accessRequest.service.tsx'
import { AccessGrantModal } from './AccessGrantModal'
import { ApprovalConfirmModal } from './ApprovalConfirmModal'

interface AccessManagerProps {
    walletAddress: string
}

type AccessTab = 'grants' | 'requests'

export function AccessManager({ walletAddress }: AccessManagerProps) {
    const [grants, setGrants] = useState<AccessGrant[]>([])
    const [requests, setRequests] = useState<AccessRequest[]>([])
    const [activeTab, setActiveTab] = useState<AccessTab>('grants')
    const [showGrantModal, setShowGrantModal] = useState(false)
    const [pendingApproval, setPendingApproval] = useState<AccessRequest | null>(null)

    useEffect(() => {
        setGrants(getPatientGrants(walletAddress))
        setRequests(getPatientRequests(walletAddress))
    }, [walletAddress])

    const handleGrantCreated = (grant: AccessGrant) => {
        setGrants([...grants, grant])
    }

    const handleRevoke = (grantId: string) => {
        if (confirm('Are you sure you want to revoke this access?')) {
            revokeGrant(grantId)
            setGrants(grants.map(g => g.id === grantId ? { ...g, status: 'revoked' as const } : g))
        }
    }

    const handleApproveClick = (request: AccessRequest) => {
        // Show confirmation modal instead of immediate approval
        setPendingApproval(request)
    }

    const handleApproveConfirm = () => {
        if (!pendingApproval) return

        // Create a grant from the request
        const grant = createAccessGrant({
            patientAddress: walletAddress,
            providerAddress: pendingApproval.providerAddress,
            providerName: pendingApproval.providerName,
            recordTypes: pendingApproval.recordTypes,
            expirationDays: 30,
        })

        updateRequestStatus(pendingApproval.id, 'approved')
        setGrants([...grants, grant])
        setRequests(requests.map(r => r.id === pendingApproval.id ? { ...r, status: 'approved' as const } : r))
        setPendingApproval(null)
    }

    const handleDenyRequest = (requestId: string) => {
        updateRequestStatus(requestId, 'denied')
        setRequests(requests.map(r => r.id === requestId ? { ...r, status: 'denied' as const } : r))
    }

    const activeGrants = grants.filter(g => g.status === 'active')
    const pendingRequests = requests.filter(r => r.status === 'pending')

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-white">Access Control</h3>
                    <p className="text-sm text-slate-400">Manage who can view your records</p>
                </div>
                <button onClick={() => setShowGrantModal(true)} className="btn-gradient flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Grant Access
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('grants')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'grants'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    🔓 Active Grants ({activeGrants.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'requests'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    📨 Incoming Requests
                    {pendingRequests.length > 0 && (
                        <span className="w-5 h-5 rounded-full bg-yellow-500 text-black text-xs flex items-center justify-center font-bold">
                            {pendingRequests.length}
                        </span>
                    )}
                </button>
            </div>

            {activeTab === 'grants' ? (
                <>
                    {activeGrants.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4 opacity-50">🔒</div>
                            <h4 className="text-lg font-medium text-slate-400 mb-2">No Active Grants</h4>
                            <p className="text-slate-500 text-sm">
                                Your records are private. Grant access to share with healthcare providers.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeGrants.map(grant => (
                                <GrantCard key={grant.id} grant={grant} onRevoke={handleRevoke} />
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {requests.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-5xl mb-4 opacity-50">📨</div>
                            <h4 className="text-lg font-medium text-slate-400 mb-2">No Access Requests</h4>
                            <p className="text-slate-500 text-sm">
                                Healthcare providers can request access to your records.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {requests.map(request => (
                                <RequestCard
                                    key={request.id}
                                    request={request}
                                    onApprove={() => handleApproveClick(request)}
                                    onDeny={() => handleDenyRequest(request.id)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {showGrantModal && (
                <AccessGrantModal
                    patientAddress={walletAddress}
                    onClose={() => setShowGrantModal(false)}
                    onGrantCreated={handleGrantCreated}
                />
            )}

            {pendingApproval && (
                <ApprovalConfirmModal
                    request={pendingApproval}
                    onConfirm={handleApproveConfirm}
                    onCancel={() => setPendingApproval(null)}
                />
            )}
        </div>
    )
}

interface GrantCardProps {
    grant: AccessGrant
    onRevoke: (id: string) => void
}

function GrantCard({ grant, onRevoke }: GrantCardProps) {
    return (
        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-white/5">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-2xl">
                    🏥
                </div>
                <div>
                    <h4 className="font-medium text-white">{grant.providerName}</h4>
                    <p className="text-sm text-slate-400 font-mono">
                        {grant.providerAddress.slice(0, 10)}...{grant.providerAddress.slice(-6)}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">
                            {grant.recordTypes.length > 0 ? grant.recordTypes.join(', ') : 'All types'}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-500">Expires: {formatExpiration(grant.expiresAt)}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <span className="badge badge-success">Active</span>
                <button
                    onClick={() => onRevoke(grant.id)}
                    className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded-lg hover:bg-red-500/10"
                >
                    Revoke
                </button>
            </div>
        </div>
    )
}

interface RequestCardProps {
    request: AccessRequest
    onApprove: () => void
    onDeny: () => void
}

function RequestCard({ request, onApprove, onDeny }: RequestCardProps) {
    const isPending = request.status === 'pending'

    return (
        <div className={`p-4 rounded-xl border ${isPending
            ? 'bg-yellow-500/5 border-yellow-500/30'
            : 'bg-slate-800/50 border-white/5'
            }`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center text-2xl">
                        🏥
                    </div>
                    <div>
                        <h4 className="font-medium text-white">{request.providerName}</h4>
                        <p className="text-sm text-slate-400 font-mono">
                            {request.providerAddress.slice(0, 10)}...{request.providerAddress.slice(-6)}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                            Wants: {request.recordTypes.length > 0 ? request.recordTypes.join(', ') : 'All records'}
                        </p>
                        {request.message && (
                            <p className="text-sm text-slate-300 mt-2 p-2 rounded bg-slate-700/50">
                                "{request.message}"
                            </p>
                        )}
                        <p className="text-xs text-slate-500 mt-2">
                            Requested: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    {isPending ? (
                        <>
                            <button onClick={onApprove} className="btn-gradient text-sm px-4 py-2">
                                ✓ Approve
                            </button>
                            <button
                                onClick={onDeny}
                                className="text-red-400 hover:text-red-300 text-sm px-4 py-1"
                            >
                                ✗ Deny
                            </button>
                        </>
                    ) : (
                        <span className={`badge ${request.status === 'approved' ? 'badge-success' : 'badge-error'
                            }`}>
                            {request.status}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
