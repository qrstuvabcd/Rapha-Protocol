import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react'
import { LandingPage, PatientPortal, HospitalPortal, AIResearchPortal, Whitepaper, LegacyLandingPage } from './pages'
import { VerifierPortal } from './pages/VerifierPortal'
import { KeeperApplication } from './pages/KeeperApplication'
import { KeeperDashboard } from './pages/KeeperDashboard'
import { PrivacyPolicy } from './pages/PrivacyPolicy'
import { TermsPage } from './pages/TermsPage'
import { DataPoolDemo } from './components/marketplace/DataPoolDemo'
import { JsonLd } from './components/SEO/JsonLd'
import { checkJurisdiction, GeoBlockedMessage } from './services/geo.service'
import { isDemoMode } from './services/demoMode'
import './App.css'

// Error Boundary to catch and display runtime errors
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="glass-card p-8 max-w-lg text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-slate-400 mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <pre className="text-xs text-red-400 bg-red-500/10 p-3 rounded-lg text-left overflow-auto max-h-40 mb-6">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
              className="btn-gradient px-6 py-3"
            >
              Go Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [geoBlocked, setGeoBlocked] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isDemoMode()) {
      setIsChecking(false)
      return
    }
    checkJurisdiction().then(result => {
      setGeoBlocked(!result.allowed)
      setIsChecking(false)
    })
  }, [])

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (geoBlocked) {
    return <GeoBlockedMessage />
  }

  return (
    <BrowserRouter>
      <JsonLd />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/legacy" element={<LegacyLandingPage />} />
          <Route path="/v1" element={<LegacyLandingPage />} />
          <Route path="/patient" element={<PatientPortal />} />
          <Route path="/hospital" element={<HospitalPortal />} />
          <Route path="/ai-research" element={<AIResearchPortal />} />
          <Route path="/research" element={<AIResearchPortal />} />
          <Route path="/pharma" element={<AIResearchPortal />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/whitepaper" element={<Whitepaper />} />
          <Route path="/verifier" element={<VerifierPortal />} />
          <Route path="/keeper-apply" element={<KeeperApplication />} />
          <Route path="/keeper" element={<KeeperDashboard />} />
          <Route path="/demo" element={<DataPoolDemo />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
