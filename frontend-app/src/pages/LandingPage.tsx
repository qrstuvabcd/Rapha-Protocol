import React from 'react';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-cyan-900 selection:text-cyan-50">

            {/* Navigation Bar */}
            <nav className="border-b border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-md fixed top-0 w-full z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse"></div>
                        <span className="font-bold text-white text-xl tracking-tight">Rapha Protocol</span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm font-medium">
                        <a href="#" className="hover:text-white transition-colors">Documentation</a>
                        <a href="https://pypi.org/project/rapha-ai" className="hover:text-white transition-colors">PyPI SDK</a>
                        <a href="/legacy" className="text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-800 px-3 py-1 rounded-md">
                            v1.0 (Legacy)
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto px-6 pt-40 pb-24 grid lg:grid-cols-2 gap-16 items-center">

                {/* Left Column: The Pitch */}
                <div className="space-y-8">
                    <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-mono">
                        <span>🚀 Rapha-AI v0.1.0 is now live on Mainnet</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
                        Train AI on Clinical Data. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                            Without Moving the Data.
                        </span>
                    </h1>
                    <p className="text-lg text-zinc-400 leading-relaxed max-w-xl">
                        Rapha Protocol is the decentralized Compute-to-Data API. We route AI training directly into secure hospital firewalls using ZK-TLS cryptography. Zero data leaves the building. Zero HIPAA liability.
                    </p>
                    <div className="flex items-center space-x-4">
                        <button className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors">
                            Get API Keys
                        </button>
                        <button className="px-6 py-3 bg-zinc-900 text-white border border-zinc-700 font-semibold rounded-lg hover:bg-zinc-800 transition-colors">
                            Read the Docs
                        </button>
                    </div>
                </div>

                {/* Right Column: The OpenClaw-style Terminal */}
                <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-20"></div>
                    <div className="relative rounded-xl bg-[#0c0c0e] border border-zinc-800 shadow-2xl overflow-hidden font-mono text-sm">
                        <div className="flex items-center px-4 py-3 bg-[#18181b] border-b border-zinc-800">
                            <div className="flex space-x-2">
                                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                            </div>
                            <div className="mx-auto text-zinc-500 text-xs">researcher@rapha-ai:~</div>
                        </div>

                        <div className="p-6 space-y-4 text-zinc-300">
                            <div><span className="text-cyan-400">$</span> pip install rapha-ai<br /><span className="text-zinc-500">Successfully installed rapha-ai-0.1.0</span></div>
                            <div><span className="text-cyan-400">$</span> python train_model.py</div>
                            <div className="text-zinc-400 space-y-1">
                                <p>&gt; Initializing RaphaClient (Mainnet)...</p>
                                <p>&gt; Packaging Llama-3-Base weights...</p>
                                <p>&gt; Dispatching compute payload to TEE: Tokyo_Oncology_01...</p>
                                <p className="text-yellow-400">&gt; [NODE] Training epoch 1/5 on local HIPAA data...</p>
                                <p className="text-yellow-400">&gt; [NODE] Training epoch 5/5 completed. Loss: 0.214</p>
                                <p>&gt; Receiving updated mathematical weights...</p>
                                <p className="text-green-400 font-semibold">&gt; SUCCESS: ZK-Proof verified on Polygon. Smart contract settled.</p>
                            </div>
                            <div className="flex items-center animate-pulse"><span className="text-cyan-400">$</span> <span className="ml-2 w-2 h-4 bg-zinc-400 inline-block"></span></div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}

export default LandingPage;
