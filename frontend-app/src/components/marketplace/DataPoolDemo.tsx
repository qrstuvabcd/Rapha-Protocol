import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

/**
 * Scrollytelling Demo
 * Visuals stick to the screen while users scroll through text steps
 */
export function DataPoolDemo() {
    const [currentStep, setCurrentStep] = useState(0)
    const stepRefs = useRef<(HTMLDivElement | null)[]>([])

    const steps = [
        {
            title: 'Campaign Created',
            desc: 'AI startup deploys bounty pool contract',
            icon: '🚀',
            detail: 'Researcher posts 5000 USDC bounty for "Alzheimer\'s Early Detection" model. Funds are locked in smart contract escrow.'
        },
        {
            title: 'Patients Join',
            desc: 'Patients contribute encrypted data',
            icon: '👥',
            detail: '100 patients join via "One-Click Join". Data remains encrypted on IPFS nodes worldwide. No raw data is ever exposed.'
        },
        {
            title: 'Pool Filled',
            desc: 'Target reached, funds locked',
            icon: '✅',
            detail: 'Smart contract verifies participation target. Bounty funds are locked. Data access is now restricted to TEE authorization only.'
        },
        {
            title: 'Sandbox Upload',
            desc: 'Model code verified for safety',
            icon: '🕵️',
            detail: 'Researcher uploads "model.py" to the Sandbox. Protocol scans code for malicious network calls to prevent data exfiltration.'
        },
        {
            title: 'TEE Training',
            desc: 'Secure Enclave Execution',
            icon: '🧠',
            detail: 'Verified model enters the Trusted Execution Environment (TEE). Data is temporarily decrypted ONLY inside the hardware enclave for training.'
        },
        {
            title: 'Payments Sent',
            desc: 'Atomic Settlement',
            icon: '💰',
            detail: 'Smart contract receives execution proof. 80% of bounty is automatically sent to patient wallets. 20% to protocol treasury.'
        },
    ]

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = Number(entry.target.getAttribute('data-index'))
                        setCurrentStep(index)
                    }
                })
            },
            {
                root: null,
                rootMargin: '-40% 0px -40% 0px', // Active when element is in the middle 20% of screen
                threshold: 0
            }
        )

        stepRefs.current.forEach((el) => {
            if (el) observer.observe(el)
        })

        return () => observer.disconnect()
    }, [])

    return (
        <div className="max-w-7xl mx-auto py-12">

            {/* Intro Header */}
            <div className="text-center mb-16 px-6">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-6">
                    <div className="text-4xl">🧬</div>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-4">Compute-Over-Data Workflow</h2>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    Scroll down to explore how Rapha protects patient privacy while enabling AI breakthroughs.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-8 relative px-6">

                {/* STICKY LEFT COLUMN: Visuals */}
                <div className="hidden md:block w-1/2 sticky top-24 h-[600px] flex items-center justify-center">
                    <div className="w-full h-full relative p-1 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl overflow-hidden">

                        {/* Background Grid */}
                        <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                        {/* Animated Stage Content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                            <div className="mb-8 transform scale-150 transition-all duration-500">
                                {currentStep === 0 && <div className="text-8xl animate-bounce">📝</div>}
                                {currentStep === 1 && (
                                    <div className="flex gap-4">
                                        <span className="text-6xl animate-[pulse_1s_infinite]">👤</span>
                                        <span className="text-6xl animate-[pulse_1.2s_infinite]">👤</span>
                                        <span className="text-6xl animate-[pulse_1.4s_infinite]">👤</span>
                                    </div>
                                )}
                                {currentStep === 2 && <div className="text-8xl text-green-400">🔒</div>}
                                {currentStep === 3 && (
                                    <div className="relative">
                                        <div className="text-8xl">📄</div>
                                        <div className="absolute -bottom-2 -right-2 text-5xl animate-spin">⚙️</div>
                                    </div>
                                )}
                                {currentStep === 4 && (
                                    <div className="p-6 rounded-2xl bg-indigo-500/20 border border-indigo-500/50 backdrop-blur-sm">
                                        <div className="text-sm font-mono text-indigo-300 mb-4 text-center">TEE Enclave</div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl">🧬</span>
                                            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 animate-[progress_1s_infinite]" />
                                            </div>
                                            <span className="text-4xl">🧠</span>
                                        </div>
                                    </div>
                                )}
                                {currentStep === 5 && (
                                    <div className="flex gap-6">
                                        <div className="text-center">
                                            <div className="text-6xl mb-2">🏥</div>
                                            <div className="text-sm text-green-400 font-bold">+$40 USDC</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-6xl mb-2">🏥</div>
                                            <div className="text-sm text-green-400 font-bold">+$40 USDC</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <h3 className="text-3xl font-bold text-white mb-2 transition-all duration-300 transform translate-y-0 opacity-100">
                                {steps[currentStep].title}
                            </h3>
                            <p className="text-lg text-slate-400 font-medium">{steps[currentStep].desc}</p>

                            {/* Progress Dots */}
                            <div className="absolute bottom-8 flex gap-2">
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-3 h-3 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-white scale-125' : 'bg-slate-700'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SCROLLABLE RIGHT COLUMN: Text Steps */}
                <div className="w-full md:w-1/2 flex flex-col gap-[50vh] pb-[20vh] pt-[10vh]">
                    {steps.map((s, i) => (
                        <div
                            key={i}
                            ref={el => { stepRefs.current[i] = el }}
                            data-index={i}
                            className={`transition-all duration-500 p-8 rounded-2xl border ${i === currentStep
                                ? 'bg-slate-800/80 border-indigo-500/50 shadow-2xl shadow-indigo-500/10 scale-100 opacity-100'
                                : 'bg-slate-900/40 border-slate-800 scale-95 opacity-50'
                                }`}
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${i === currentStep ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'
                                    }`}>
                                    {s.icon}
                                </div>
                                <span className={`text-sm font-bold tracking-wider uppercase ${i === currentStep ? 'text-indigo-400' : 'text-slate-600'
                                    }`}>
                                    Step {i + 1}
                                </span>
                            </div>

                            <h3 className={`text-2xl font-bold mb-4 ${i === currentStep ? 'text-white' : 'text-slate-400'
                                }`}>
                                {s.title}
                            </h3>

                            <p className="text-slate-300 leading-relaxed text-lg mb-6">
                                {s.detail}
                            </p>

                            {/* Mobile Visual Fallback (only visible on small screens) */}
                            <div className="md:hidden mt-4 p-4 rounded-xl bg-slate-950/50 border border-slate-900 flex justify-center text-4xl">
                                {s.icon}
                            </div>
                        </div>
                    ))}

                    <div className="h-screen flex items-center justify-center">
                        <div className="text-center space-y-6 p-8 rounded-3xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10">
                            <h3 className="text-3xl font-bold text-white">Ready to join the network?</h3>
                            <p className="text-slate-300">Start contributing data or training models today.</p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <Link to="/patient" className="btn-gradient px-8 py-3 rounded-xl">
                                    Patient Portal
                                </Link>
                                <Link to="/startups" className="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors">
                                    Research Studio
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
