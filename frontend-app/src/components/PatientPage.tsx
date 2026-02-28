import { useState } from 'react'
import { type UserProfile } from '../services/profile.service'
import { Dashboard } from './Dashboard'
import { RecordList } from './RecordList'
import { AccessManager } from './AccessManager'
import { BountyOpportunities } from './BountyOpportunities'

type NavItem = 'dashboard' | 'records' | 'access' | 'opportunities'

interface PatientPageProps {
    walletAddress: string
    userProfile: UserProfile | null
    activeNav: NavItem
    onNavChange: (nav: NavItem) => void
    onUploadClick: () => void
    onShowQR: () => void
    onZkTlsImport: () => void
}

export function PatientPage({
    walletAddress,
    userProfile,
    activeNav,
    onNavChange,
    onUploadClick,
    onShowQR,
    onZkTlsImport
}: PatientPageProps) {
    // This key is used to force Dashboard to refetch data when switching tabs
    const [refreshKey, setRefreshKey] = useState(0)

    const handleNavChange = (nav: NavItem) => {
        // If switching to dashboard, increment refreshKey to trigger data refetch
        if (nav === 'dashboard') {
            setRefreshKey(prev => prev + 1)
        }
        onNavChange(nav)
    }

    return (
        <div className="patient-page animate-fadeIn">
            {/* Patient Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center shadow-lg shadow-sky-500/20">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white">Patient Dashboard</h1>
                        <p className="text-sm text-slate-500">Manage your medical records securely</p>
                    </div>
                </div>
                <span className="px-4 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold tracking-wide">
                    🔒 Your Data, Your Control
                </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6 p-1 rounded-xl bg-white/5 border border-white/5 w-fit">
                <button
                    onClick={() => handleNavChange('dashboard')}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activeNav === 'dashboard'
                        ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/20'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    📊 Dashboard
                </button>
                <button
                    onClick={() => handleNavChange('records')}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activeNav === 'records'
                        ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/20'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    📁 Records
                </button>
                <button
                    onClick={() => handleNavChange('access')}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activeNav === 'access'
                        ? 'bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-lg shadow-sky-500/20'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    🔐 Access
                </button>
                <button
                    onClick={() => handleNavChange('opportunities')}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activeNav === 'opportunities'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'text-slate-400 hover:text-white'
                        }`}
                >
                    💰 Opportunities
                </button>
            </div>

            {/* Content Area */}
            <div className="patient-content">
                {activeNav === 'dashboard' && (
                    <Dashboard
                        walletAddress={walletAddress}
                        userProfile={userProfile}
                        onUploadClick={onUploadClick}
                        onShowQR={onShowQR}
                        onZkTlsImport={onZkTlsImport}
                        refreshKey={refreshKey}
                    />
                )}

                {activeNav === 'records' && (
                    <RecordList walletAddress={walletAddress} />
                )}

                {activeNav === 'access' && (
                    <AccessManager walletAddress={walletAddress} />
                )}

                {activeNav === 'opportunities' && (
                    <BountyOpportunities />
                )}
            </div>
        </div>
    )
}
