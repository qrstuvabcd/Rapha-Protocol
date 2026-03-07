import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Shield, Cpu, Code2, Copy, CheckCircle2, Lock } from 'lucide-react';

export function Rapha2Landing() {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const quickstartCode = `import rapha_ai

# Initialize the Compute-to-Data client
client = rapha_ai.Client(
    api_key="sk_rapha_...",
    network="polygon-mainnet"
)

# Dispatch training job to secure enclave
job = client.train(
    model="resnet50",
    dataset="tokyo_oncology_01",
    epochs=10,
    proof_type="zk-snark"
)

# Wait for ZK-Proof verification and fetch updated weights
result = job.wait_and_verify()
print(f"Status: {result.status} | Merkle Root: {result.merkle_root}")`;

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-indigo-500/30">
            {/* Navbar */}
            <nav className="border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-semibold text-zinc-100 tracking-tight text-lg">Rapha Protocol</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm font-medium">
                        <a href="#quickstart" className="text-zinc-400 hover:text-zinc-100 transition-colors">PyPI SDK</a>
                        <a href="/whitepaper" className="text-zinc-400 hover:text-zinc-100 transition-colors">Documentation</a>
                        <Link to="/legacy" className="px-4 py-2 rounded-md border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 hover:bg-zinc-900 transition-all">
                            v1.0 (Legacy)
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
                {/* Hero Section */}
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            v0.1.0 Live on Polygon Mainnet
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-white leading-tight">
                            Train AI on Clinical Data. <span className="text-zinc-500">Without Moving the Data.</span>
                        </h1>
                        <p className="text-xl text-zinc-400 leading-relaxed max-w-lg">
                            The decentralized Compute-to-Data API. Route AI training directly into secure hospital firewalls using ZK-TLS cryptography.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#quickstart" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white text-zinc-950 font-medium hover:bg-zinc-200 transition-colors">
                                <Terminal className="w-4 h-4" />
                                Start Building
                            </a>
                            <Link to="/whitepaper" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-zinc-800 text-zinc-100 hover:bg-zinc-900 transition-colors">
                                <Code2 className="w-4 h-4" />
                                Read the Whitepaper
                            </Link>
                        </div>
                    </div>

                    {/* Visual: Mac-style Terminal */}
                    <div className="relative group">
                        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500/30 to-purple-500/30 opacity-50 blur-xl group-hover:opacity-75 transition duration-1000"></div>
                        <div className="relative rounded-xl border border-zinc-800 bg-[#0c0c0e] shadow-2xl overflow-hidden">
                            <div className="flex items-center px-4 py-3 border-b border-zinc-800/60 bg-[#121214]">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                                </div>
                                <div className="mx-auto text-xs font-mono text-zinc-500">rapha-environment — bash</div>
                            </div>
                            <div className="p-6 font-mono text-sm leading-relaxed text-zinc-400 overflow-x-auto">
                                <pre><code>
                                    <span className="text-indigo-400">{'>'} ~$</span> pip install rapha-ai{'\n'}
                                    Collecting rapha-ai{'\n'}
                                    {'  '}Downloading rapha_ai-0.1.0-py3-none-any.whl (42 kB){'\n'}
                                    Installing collected packages: rapha-ai{'\n'}
                                    Successfully installed rapha-ai-0.1.0{'\n\n'}
                                    <span className="text-indigo-400">{'>'} ~$</span> python train_model.py{'\n'}
                                    <span className="text-blue-400">[INFO]</span> Connecting to <span className="text-purple-400">Polygon Mainnet Escrow</span>...{'\n'}
                                    <span className="text-blue-400">[INFO]</span> Escrow locked. Dispatching algorithm to <span className="text-amber-400">tokyo_oncology_01</span>...{'\n'}
                                    <span className="text-blue-400">[INFO]</span> TEE Enclave initialized. Starting encrypted training...{'\n'}
                                    <span className="text-blue-400">[INFO]</span> Epoch 10/10 completed. Generating ZK-SNARK...{'\n'}
                                    <span className="text-emerald-400">[SUCCESS] ZK-Proof Verified on-chain via Polygon.</span>{'\n'}
                                    <span className="text-blue-400">[INFO]</span> Weights downloaded securely. Training complete.
                                </code></pre>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Architecture Grid */}
                <div className="mt-40 border-t border-zinc-800/60 pt-24">
                    <div className="mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Zero-Trust Architecture</h2>
                        <p className="text-zinc-400">Built for enterprise-grade compliance and deterministic execution.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-6">
                                <Cpu className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">1. Local TEE Execution</h3>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                Dockerized algorithms are securely routed into isolated Trusted Execution Environments (TEEs) residing entirely within the hospital's firewall. No data ever leaves the premises.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6">
                                <Lock className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">2. ZK-TLS Cryptography</h3>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                Network traffic and remote attestations are guarded by Zero-Knowledge Transport Layer Security, ensuring proofs of execution without revealing the underlying data or logic.
                            </p>
                        </div>
                        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6">
                                <Shield className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-3">3. Polygon Settlement</h3>
                            <p className="text-zinc-400 leading-relaxed text-sm">
                                Compute payments and verifiable cryptographic truths are settled immutably on the Polygon Mainnet, guaranteeing decentralized dispute resolution.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Developer Quickstart */}
                <div id="quickstart" className="mt-40 border-t border-zinc-800/60 pt-24">
                    <div className="mb-12 flex flex-col items-center text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">Developer Quickstart</h2>
                        <p className="text-zinc-400 max-w-2xl">
                            Integrate the Rapha Python SDK in minutes. Ship secure, compliant models without dealing with hospital red tape.
                        </p>
                    </div>

                    <div className="max-w-3xl mx-auto rounded-xl border border-zinc-800 bg-[#0c0c0e] shadow-xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-[#121214]">
                            <div className="flex gap-4 font-mono text-sm">
                                <span className="text-zinc-100 border-b border-indigo-500 pb-4 -mb-4">main.py</span>
                            </div>
                            <button
                                onClick={() => copyToClipboard(quickstartCode)}
                                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                                aria-label="Copy to clipboard"
                            >
                                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="p-6 overflow-x-auto text-[13px] leading-loose">
                            <pre className="font-mono text-zinc-300">
                                <code>
                                    <span className="text-pink-400">import</span> rapha_ai{'\n\n'}
                                    <span className="text-zinc-500 italic"># Initialize the Compute-to-Data client</span>{'\n'}
                                    client = rapha_ai.<span className="text-indigo-300">Client</span>({'\n'}
                                    {'    '}api_key=<span className="text-amber-300">"sk_rapha_..."</span>,{'\n'}
                                    {'    '}network=<span className="text-amber-300">"polygon-mainnet"</span>{'\n'}
                                    ){'\n\n'}
                                    <span className="text-zinc-500 italic"># Dispatch training job to secure enclave</span>{'\n'}
                                    job = client.train({'\n'}
                                    {'    '}model=<span className="text-amber-300">"resnet50"</span>,{'\n'}
                                    {'    '}dataset=<span className="text-amber-300">"tokyo_oncology_01"</span>,{'\n'}
                                    {'    '}epochs=<span className="text-purple-300">10</span>,{'\n'}
                                    {'    '}proof_type=<span className="text-amber-300">"zk-snark"</span>{'\n'}
                                    ){'\n\n'}
                                    <span className="text-zinc-500 italic"># Wait for ZK-Proof verification and fetch updated weights</span>{'\n'}
                                    result = job.wait_and_verify(){'\n'}
                                    <span className="text-pink-400">print</span>(<span className="text-amber-300">f"Status: </span>{'{'}<span className="text-blue-300">result.status</span>{'}'}<span className="text-amber-300"> | Merkle Root: </span>{'{'}<span className="text-blue-300">result.merkle_root</span>{'}'}<span className="text-amber-300">"</span>)
                                </code>
                            </pre>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-zinc-800/60 bg-[#09090b] py-12 text-center text-sm text-zinc-500">
                <p>© 2026 Rapha Protocol. All rights reserved.</p>
                <p className="mt-2">Operating on Polygon Mainnet.</p>
            </footer>
        </div>
    );
}
