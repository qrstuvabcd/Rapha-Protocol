import { Terminal, Shield, Cpu, Lock, Network, Code, Server, ExternalLink, ChevronRight, Zap, CheckCircle2, Copy } from 'lucide-react';
import { useState } from 'react';

export function Rapha2Landing() {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-cyan-900 selection:text-cyan-50">

            {/* ═══════════════════════════════════════════════════ */}
            {/* SECTION 1 — FLOATING NAVBAR                        */}
            {/* ═══════════════════════════════════════════════════ */}
            <nav className="border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-xl fixed top-0 w-full z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                            <div className="w-3 h-3 rounded-full bg-cyan-500 absolute inset-0 animate-ping opacity-40"></div>
                        </div>
                        <span className="font-bold text-white text-lg tracking-tight">Rapha Protocol</span>
                        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/5 text-[10px] uppercase text-cyan-400 tracking-widest font-mono">
                            v2.0
                        </span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 text-sm font-medium">
                        <a href="/whitepaper" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-zinc-800/50 hover:text-white transition-colors">
                            <Code className="w-4 h-4" />
                            Documentation
                        </a>
                        <a href="https://github.com/qrstuvabcd/rapha-protocol-core" target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-zinc-800/50 hover:text-white transition-colors">
                            GitHub
                            <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                        <a href="https://pypi.org/project/rapha-ai" target="_blank" rel="noopener noreferrer" className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-zinc-800/50 hover:text-white transition-colors">
                            PyPI SDK
                            <ExternalLink className="w-3 h-3 opacity-50" />
                        </a>
                        <a href="/legacy" className="text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg text-xs font-mono">
                            v1.0 (Legacy)
                        </a>
                    </div>
                </div>
            </nav>

            {/* ═══════════════════════════════════════════════════ */}
            {/* SECTION 2 — HERO                                   */}
            {/* ═══════════════════════════════════════════════════ */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto px-6 pt-36 pb-28 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-mono">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Rapha-AI v0.1.0 Live on Polygon Mainnet</span>
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
                            Train AI on Clinical Data.{' '}
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                                Without Moving the Data.
                            </span>
                        </h1>

                        <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
                            The decentralized Compute-to-Data API. Route AI training directly
                            into secure hospital firewalls using ZK-TLS cryptography. Zero data
                            leaves the building. Zero HIPAA liability.
                        </p>

                        <div className="flex flex-wrap items-center gap-4">
                            <button className="group px-6 py-3 bg-white text-[#09090b] font-semibold rounded-lg hover:bg-zinc-100 transition-all flex items-center gap-2 shadow-lg shadow-white/5">
                                Get API Keys
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                            <a href="/whitepaper" className="px-6 py-3 bg-zinc-900 text-white border border-zinc-700 font-semibold rounded-lg hover:bg-zinc-800 hover:border-zinc-600 transition-all flex items-center gap-2">
                                Read the Docs
                            </a>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 text-xs text-zinc-600 font-mono uppercase tracking-widest">
                            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> HIPAA Compliant</span>
                            <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> ZK-TLS Verified</span>
                            <span className="flex items-center gap-1.5"><Network className="w-3 h-3" /> Polygon Mainnet</span>
                        </div>
                    </div>

                    {/* Terminal */}
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-2xl blur-xl"></div>
                        <div className="relative rounded-xl bg-[#0c0c0e] border border-zinc-800 shadow-2xl shadow-cyan-500/5 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 bg-[#18181b] border-b border-zinc-800">
                                <div className="flex space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <div className="text-zinc-600 text-xs font-mono flex items-center gap-1.5">
                                    <Terminal className="w-3 h-3" />
                                    researcher@rapha-ai:~
                                </div>
                                <div className="w-16"></div>
                            </div>
                            <div className="p-6 font-mono text-sm space-y-3 leading-relaxed">
                                <div><span className="text-cyan-400">$</span> <span className="text-zinc-300">pip install rapha-ai</span></div>
                                <div className="text-zinc-600">Collecting rapha-ai==0.1.0<br />Successfully installed rapha-ai-0.1.0</div>
                                <div className="pt-2"><span className="text-cyan-400">$</span> <span className="text-zinc-300">python train_model.py</span></div>
                                <div className="space-y-1 text-zinc-500">
                                    <p><span className="text-zinc-600">[</span><span className="text-cyan-400">INIT</span><span className="text-zinc-600">]</span> Connecting to Rapha Network...</p>
                                    <p><span className="text-zinc-600">[</span><span className="text-blue-400">SDK</span><span className="text-zinc-600">]</span> Packaging Llama-3-Base weights (4.2GB)...</p>
                                    <p><span className="text-zinc-600">[</span><span className="text-blue-400">SDK</span><span className="text-zinc-600">]</span> Dispatching payload → TEE: <span className="text-amber-400">tokyo_oncology_01</span></p>
                                    <p className="text-yellow-400"><span className="text-zinc-600">[</span>NODE<span className="text-zinc-600">]</span> Training epoch 1/5 on local HIPAA data... loss: 2.341</p>
                                    <p className="text-yellow-400"><span className="text-zinc-600">[</span>NODE<span className="text-zinc-600">]</span> Training epoch 5/5 completed.       loss: 0.214</p>
                                    <p><span className="text-zinc-600">[</span><span className="text-blue-400">SDK</span><span className="text-zinc-600">]</span> Receiving encrypted gradient update...</p>
                                    <p className="text-green-400 font-semibold"><span className="text-zinc-600">[</span>✓<span className="text-zinc-600">]</span> ZK-Proof verified on Polygon. Escrow settled. +250 USDC</p>
                                </div>
                                <div className="flex items-center pt-1">
                                    <span className="text-cyan-400">$</span>
                                    <span className="ml-2 w-2 h-5 bg-cyan-400/80 inline-block animate-pulse rounded-sm"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════ */}
            {/* SECTION 3 — ARCHITECTURE GRID                      */}
            {/* ═══════════════════════════════════════════════════ */}
            <section className="border-t border-zinc-800/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-zinc-950 to-[#09090b]"></div>
                <div className="max-w-7xl mx-auto px-6 py-28 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-xs font-mono uppercase tracking-widest mb-6">
                            <Shield className="w-3 h-3" />
                            <span>Architecture</span>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">The Compute-to-Data Pipeline</h2>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Traditional AI cannot touch healthcare data without massive regulatory risk.
                            Rapha reverses the paradigm — the algorithm goes to the data, not the other way around.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Card 1 */}
                        <div className="group relative p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-cyan-500/30 transition-all duration-300">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6">
                                    <Server className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Local TEE Execution</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                    We send the algorithm to the data, not the data to the algorithm. Hospitals run our
                                    Dockerized FastAPI node inside their private infrastructure. The TEE isolates the
                                    compute payload and trains on local EHR databases.
                                </p>
                                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/60">
                                    <Cpu className="w-3 h-3" /><span>FastAPI · Docker · SQLite</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="group relative p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-500/30 transition-all duration-300">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">ZK-TLS Cryptography</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                    We cryptographically prove the model was trained accurately on the raw data —
                                    without revealing the data itself. A ZK-SNARK receipt is generated for every
                                    training epoch, enabling on-chain verification.
                                </p>
                                <div className="flex items-center gap-2 text-xs font-mono text-blue-400/60">
                                    <Shield className="w-3 h-3" /><span>ZK-SNARK · TLS 1.3 · HIPAA</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="group relative p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/30 transition-all duration-300">
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Polygon Settlement</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                                    Escrow smart contracts release USDC bounties automatically upon ZK verification.
                                    Researchers lock funds before dispatch. Hospitals receive instant payment when
                                    the proof is verified on-chain. No intermediaries.
                                </p>
                                <div className="flex items-center gap-2 text-xs font-mono text-purple-400/60">
                                    <Network className="w-3 h-3" /><span>Polygon · USDC · RaphaEscrow.sol</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════ */}
            {/* SECTION 4 — DEVELOPER QUICKSTART                   */}
            {/* ═══════════════════════════════════════════════════ */}
            <section className="border-t border-zinc-800/50">
                <div className="max-w-7xl mx-auto px-6 py-28">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 text-xs font-mono uppercase tracking-widest mb-6">
                            <Terminal className="w-3 h-3" /><span>Quickstart</span>
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-6 tracking-tight">Ship in 3 Commands</h2>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            Interacting with the Rapha network requires zero blockchain infrastructure knowledge. Just Python.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-8">
                        {/* Step 1 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm flex-shrink-0">1</div>
                                <div className="w-px flex-1 bg-zinc-800 mt-3"></div>
                            </div>
                            <div className="flex-1 pb-10">
                                <h3 className="text-lg font-bold text-white mb-2">Install the SDK</h3>
                                <p className="text-zinc-500 text-sm mb-4">Available on PyPI. Works with Python 3.9+.</p>
                                <div className="relative rounded-xl bg-[#0c0c0e] border border-zinc-800 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181b] border-b border-zinc-800">
                                        <span className="text-zinc-600 text-xs font-mono">Terminal</span>
                                        <button onClick={() => copyToClipboard('pip install rapha-ai', 0)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                                            {copiedIndex === 0 ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="p-4 font-mono text-sm">
                                        <span className="text-cyan-400">$</span> <span className="text-zinc-300">pip install rapha-ai</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono font-bold text-sm flex-shrink-0">2</div>
                                <div className="w-px flex-1 bg-zinc-800 mt-3"></div>
                            </div>
                            <div className="flex-1 pb-10">
                                <h3 className="text-lg font-bold text-white mb-2">Initialize your Client</h3>
                                <p className="text-zinc-500 text-sm mb-4">Configure the ZK-TLS connection to Polygon mainnet.</p>
                                <div className="relative rounded-xl bg-[#0c0c0e] border border-zinc-800 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181b] border-b border-zinc-800">
                                        <span className="text-zinc-600 text-xs font-mono">train_model.py</span>
                                        <button onClick={() => copyToClipboard('import rapha_ai\n\nclient = rapha_ai.Client(\n    api_key="sk_live_...",\n    network="polygon-mainnet"\n)', 1)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                                            {copiedIndex === 1 ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="p-4 font-mono text-sm space-y-1">
                                        <div><span className="text-blue-400">import</span> <span className="text-zinc-300">rapha_ai</span></div>
                                        <div className="h-3"></div>
                                        <div><span className="text-zinc-300">client</span> <span className="text-cyan-400">=</span> <span className="text-green-400">rapha_ai.Client</span><span className="text-zinc-500">(</span></div>
                                        <div className="pl-6"><span className="text-cyan-400">api_key</span><span className="text-zinc-500">=</span><span className="text-amber-400">"sk_live_..."</span><span className="text-zinc-500">,</span></div>
                                        <div className="pl-6"><span className="text-cyan-400">network</span><span className="text-zinc-500">=</span><span className="text-amber-400">"polygon-mainnet"</span></div>
                                        <div><span className="text-zinc-500">)</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold text-sm flex-shrink-0">3</div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-2">Dispatch the Compute Payload</h3>
                                <p className="text-zinc-500 text-sm mb-4">The SDK encrypts your model weights, routes them into the hospital TEE, and settles on Polygon.</p>
                                <div className="relative rounded-xl bg-[#0c0c0e] border border-zinc-800 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181b] border-b border-zinc-800">
                                        <span className="text-zinc-600 text-xs font-mono">train_model.py</span>
                                        <button onClick={() => copyToClipboard('job = client.train(\n    model="llama-3-base",\n    target_node="tokyo_oncology_01",\n    epochs=5\n)\n\nprint(f"Success! ZK-Proof ID: {job.zk_receipt}")', 2)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                                            {copiedIndex === 2 ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <div className="p-4 font-mono text-sm space-y-1">
                                        <div><span className="text-zinc-300">job</span> <span className="text-cyan-400">=</span> <span className="text-green-400">client.train</span><span className="text-zinc-500">(</span></div>
                                        <div className="pl-6"><span className="text-cyan-400">model</span><span className="text-zinc-500">=</span><span className="text-amber-400">"llama-3-base"</span><span className="text-zinc-500">,</span></div>
                                        <div className="pl-6"><span className="text-cyan-400">target_node</span><span className="text-zinc-500">=</span><span className="text-amber-400">"tokyo_oncology_01"</span><span className="text-zinc-500">,</span></div>
                                        <div className="pl-6"><span className="text-cyan-400">epochs</span><span className="text-zinc-500">=</span><span className="text-purple-400">5</span></div>
                                        <div><span className="text-zinc-500">)</span></div>
                                        <div className="h-3"></div>
                                        <div><span className="text-green-400">print</span><span className="text-zinc-500">(</span><span className="text-amber-400">f"Success! ZK-Proof ID: </span><span className="text-zinc-300">{'{'}job.zk_receipt{'}'}</span><span className="text-amber-400">"</span><span className="text-zinc-500">)</span></div>
                                    </div>
                                </div>
                                <div className="mt-4 rounded-xl bg-green-500/5 border border-green-500/20 p-4 font-mono text-sm">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                        <div className="text-green-400/80 space-y-0.5">
                                            <p>Success! ZK-Proof ID: <span className="text-green-300">zk_0x7f3a...9e2d</span></p>
                                            <p className="text-green-400/50">Escrow settled: 250 USDC → tokyo_oncology_01.treasury</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════ */}
            {/* SECTION 5 — FOOTER                                 */}
            {/* ═══════════════════════════════════════════════════ */}
            <footer className="border-t border-zinc-800/50 bg-[#09090b]">
                <div className="border-b border-zinc-800/50">
                    <div className="max-w-7xl mx-auto px-6 py-12">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg font-bold text-white">A</div>
                                <div>
                                    <p className="text-sm text-zinc-400">Backed by</p>
                                    <p className="text-white font-semibold">Antler Inception Residency</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-sm text-zinc-400 font-mono">All Systems Operational</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                            <span className="font-bold text-zinc-400 text-sm">Rapha Protocol</span>
                            <span className="text-zinc-700 text-xs font-mono">© 2026</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-sm text-zinc-600">
                            <a href="/whitepaper" className="hover:text-zinc-300 transition-colors">Whitepaper</a>
                            <a href="https://pypi.org/project/rapha-ai" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">PyPI</a>
                            <a href="https://github.com/qrstuvabcd/rapha-protocol-core" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
                            <a href="/terms" className="hover:text-zinc-300 transition-colors">Terms</a>
                            <a href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</a>
                            <a href="/legacy" className="hover:text-zinc-300 transition-colors font-mono text-xs border border-zinc-800 px-2 py-0.5 rounded">v1.0 Archive</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
