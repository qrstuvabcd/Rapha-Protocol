import { Routes, Route } from 'react-router-dom'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Rapha2Landing, LegacyLandingPage, Whitepaper } from './pages'
import { JsonLd } from './components/SEO/JsonLd'
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
  return (
    <>
      <JsonLd />
      <ErrorBoundary>
        <Routes>
          {/* Rapha 2.0 — New Root */}
          <Route path="/" element={<Rapha2Landing />} />

          {/* Legacy Archive */}
          <Route path="/legacy" element={<LegacyLandingPage />} />

          {/* Whitepaper Pivot */}
          <Route path="/whitepaper" element={<Whitepaper />} />
        </Routes>
      </ErrorBoundary>
    </>
  )
}

export default App
