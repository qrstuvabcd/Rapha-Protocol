import React from 'react';
import { Terminal, Shield, Cpu, Lock, Network, Code, Server, Building2, HeartPulse } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-cyan-900 selection:text-cyan-50 overflow-x-hidden">

            {/* NAVIGATION BAR */}
            <nav className="border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-md fixed top-0 w-full z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.6)]"></div>
                        <span className="font-bold text-white text-xl tracking-tight">Rapha Protocol</span>
                    </div>
                    <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
                        <a href="/whitepaper" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"><Code size={16} /> Docs</a>
                        <a href="https://pypi.org/project/rapha-ai" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"><Terminal size={16} /> PyPI SDK</a>
                        <a href="/legacy" className="text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 px-4 py-1.5 rounded-md hover:bg-zinc-900">
                            v1.0 (Legacy)
                        </a>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <main className="max-w-7xl mx-auto px-6 pt-40 pb-24 grid lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8 z-10">
                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping absolute"></span>
                        <span className="w-2 h-2 rounded-full bg-cyan-400 relative"></span>
                        <span>Rapha-AI v0.1.0 is Live on Polygon Mainnet</span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
                        Train AI on <br />Clinical Data.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            Without Moving It.
                        </span>
                    </h1>

                    <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
                        The decentralized Compute-to-Data API. Route AI training loops directly into secure hospital firewalls using ZK-TLS cryptography. Zero data leaves the building. Zero HIPAA liability.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                        <button className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-all flex justify-center items-center gap-2">
                            Get API Keys
                        </button>
                        <a href="/whitepaper" className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 text-white border border-zinc-700 font-semibold rounded-lg hover:bg-zinc-800 transition-all flex justify-center items-center gap-2">
                            <Code size={18} /> Read the Docs
                        </a>
                    </div>
                </div>

                {/* Hero Terminal UI */}
                <div className="relative z-10">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-20 animate-pulse"></div>
                    <div className="relative rounded-xl bg-[#0c0c0e] border border-zinc-800 shadow-2xl overflow-hidden font-mono text-sm">
                        <div className="flex items-center px-4 py-3 bg-[#18181b] border-b border-zinc-800/80">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                            </div>
                            <div className="mx-auto text-zinc-500 text-xs flex items-center gap-2">
                                <Lock size={12} /> researcher@rapha-network:~
                            </div>
                        </div>
                        <div className="p-6 space-y-5 text-zinc-300 overflow-x-auto">
                            <div>
                                <span className="text-cyan-400">$</span> pip install rapha-ai<br />
                                <span className="text-zinc-500">Successfully installed rapha-ai-0.1.0</span>
                            </div>
                            <div>
                                <span className="text-cyan-400">$</span> python train_model.py
                            </div>
                            <div className="text-zinc-400 space-y-1.5 border-l-2 border-zinc-800 pl-4 ml-1">
                                <p>&gt; Initializing RaphaClient (Mainnet)...</p>
                                <p>&gt; Packaging Llama-3 weights (8B)...</p>
                                <p className="text-blue-400">&gt; Dispatching compute payload to Node: Tokyo_Oncology_01</p>
                                <p className="text-yellow-400">&gt; [TEE] Epoch 1/5 running locally on HIPAA data...</p>
                                <p className="text-yellow-400">&gt; [TEE] Epoch 5/5 completed. Loss: 0.214</p>
                                <p>&gt; Receiving updated mathematical weights...</p>
                                <p className="text-green-400 font-semibold flex items-center gap-2">
                                    <Shield size={14} /> SUCCESS: ZK-Proof verified. Polygon Contract Settled.
                                </p>
                            </div>
                            <div className="flex items-center">
                                <span className="text-cyan-400">$</span> <span className="ml-2 w-2 h-4 bg-zinc-400 animate-pulse inline-block"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* THE RAPHA ECOSYSTEM */}
            <section className="border-t border-zinc-800/50 bg-[#0c0c0e] py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">The Rapha Ecosystem</h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto">A unified, decentralized marketplace connecting the demand for AI compute with the supply of high-fidelity clinical data.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* AI Researchers */}
                        <div className="p-8 rounded-2xl bg-[#121214] border border-zinc-800 flex flex-col justify-between hover:border-cyan-500/50 transition-colors">
                            <div>
                                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                                    <Terminal className="text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">AI Researchers</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">Stop training on synthetic garbage. Dispatch your models into the world's largest decentralized network of proprietary EHR and telemetry data.</p>
                            </div>
                            <div className="pt-4 border-t border-zinc-800/50 mt-auto">
                                <a href="https://pypi.org/project/rapha-ai" className="inline-flex items-center text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                                    View PyPI Documentation →
                                </a>
                            </div>
                        </div>

                        {/* Hospitals */}
                        <div className="p-8 rounded-2xl bg-[#121214] border border-zinc-800 flex flex-col justify-between hover:border-blue-500/50 transition-colors">
                            <div>
                                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                                    <Building2 className="text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Hospitals & Enterprise</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">Deploy the <code className="text-blue-300 bg-blue-900/30 px-1 py-0.5 rounded">rapha-node</code> container behind your firewall. Monetize siloed data without ever exposing raw patient files. Zero HIPAA liability.</p>
                            </div>
                            <div className="pt-4 border-t border-zinc-800/50 mt-auto">
                                <a href="/hospital" className="inline-flex items-center text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                                    Access Enterprise Portal →
                                </a>
                            </div>
                        </div>

                        {/* Patients */}
                        <div className="p-8 rounded-2xl bg-[#121214] border border-zinc-800 flex flex-col justify-between hover:border-purple-500/50 transition-colors">
                            <div>
                                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6">
                                    <HeartPulse className="text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Patients & Keepers</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">You own your health data. Cryptographically sign compute-consent transactions and earn token bounties when your data is utilized.</p>
                            </div>
                            <div className="pt-4 border-t border-zinc-800/50 mt-auto">
                                <a href="/legacy" className="inline-flex items-center text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors">
                                    Enter Patient Portal →
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* THE ARCHITECTURE GRID */}
            <section className="border-t border-zinc-800/50 bg-[#09090b] py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold text-white">The Data Wall is Broken.</h2>
                        <p className="text-zinc-400 max-w-2xl mx-auto">Uploading patient records to the cloud is a legal dead-end. We inverted the architecture: send the compute to the data.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <Server className="text-cyan-400 w-10 h-10" />
                            <h3 className="text-lg font-bold text-white">Local TEE Execution</h3>
                            <p className="text-zinc-400 text-sm">Models run securely inside the hospital's Trusted Execution Environment.</p>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <Shield className="text-blue-400 w-10 h-10" />
                            <h3 className="text-lg font-bold text-white">ZK-TLS Verification</h3>
                            <p className="text-zinc-400 text-sm">We generate a zero-knowledge proof guaranteeing data authenticity.</p>
                        </div>
                        <div className="flex flex-col items-center text-center space-y-4">
                            <Network className="text-purple-400 w-10 h-10" />
                            <h3 className="text-lg font-bold text-white">Polygon Settlement</h3>
                            <p className="text-zinc-400 text-sm">Escrow smart contracts release USDC bounties upon ZK verification.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* DEVELOPER QUICKSTART */}
            <section className="py-24 max-w-5xl mx-auto px-6 border-t border-zinc-800/50">
                <div className="flex items-center gap-3 mb-10">
                    <Cpu className="text-cyan-400" />
                    <h2 className="text-3xl font-bold text-white">Developer Quickstart</h2>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden">
                    <div className="flex border-b border-zinc-800 bg-[#121214] px-4 py-3 gap-6 text-sm font-medium">
                        <span className="text-cyan-400 border-b-2 border-cyan-400 pb-3 -mb-3">Python SDK</span>
                    </div>
                    <div className="p-6 font-mono text-sm text-zinc-300 space-y-6">
                        <div>
                            <p className="text-zinc-500 mb-2"># 1. Install the SDK via PyPI</p>
                            <div className="bg-black/50 p-3 rounded-lg border border-zinc-800/50">
                                <span className="text-cyan-400">$</span> pip install rapha-ai
                            </div>
                        </div>

                        <div>
                            <p className="text-zinc-500 mb-2"># 2. Initialize your Client & Dispatch Compute</p>
                            <div className="bg-black/50 p-4 rounded-lg border border-zinc-800/50 whitespace-pre-wrap overflow-x-auto">
                                <span className="text-purple-400">import</span> rapha_ai<br /><br />
                                <span className="text-zinc-500"># Connect to the Polygon Mainnet Escrow</span><br />
                                client = rapha_ai.Client(api_key=<span className="text-green-400">"sk_live_12345"</span>, network=<span className="text-green-400">"polygon-mainnet"</span>)<br /><br />
                                <span className="text-zinc-500"># Route your untrained model into the hospital firewall</span><br />
                                job = client.train(<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;model=<span className="text-green-400">"llama-3-base"</span>, <br />
                                &nbsp;&nbsp;&nbsp;&nbsp;target_node=<span className="text-green-400">"tokyo_med_01"</span>,<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;epochs=<span className="text-orange-400">5</span><br />
                                )<br /><br />
                                print(<span className="text-blue-400">f"Weights updated! ZK-Proof ID: </span><span className="text-yellow-400">{`{job.zk_receipt}`}</span><span className="text-blue-400">"</span>)
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-zinc-800/50 py-12 text-center text-sm text-zinc-500 bg-[#09090b]">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>All Network Systems Operational</span>
                </div>
                <p>© 2026 Rapha Protocol Ltd. Backed by the Antler Inception Residency.</p>
            </footer>
        </div>
    );
}