
import { Terminal, Shield, Cpu, Lock, Network, Code, Server, Building2, HeartPulse, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    // Animation Variants
    const staggerContainer = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
    };

    const scaleIn = {
        hidden: { opacity: 0, scale: 0.95 },
        show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 20 } }
    };

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans overflow-x-hidden">

            {/* NAVIGATION BAR */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md fixed top-0 w-full z-50"
            >
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)] animate-pulse"></div>
                        <span className="font-bold text-white text-xl tracking-tight">Rapha Protocol</span>
                    </div>
                    <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
                        <Link to="/whitepaper" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"><Code size={16} /> Docs</Link>
                        <motion.a whileHover={{ scale: 1.05 }} href="https://pypi.org/project/rapha-ai" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-2"><Terminal size={16} /> PyPI SDK</motion.a>
                        <Link to="/dashboard" className="border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-4 py-1.5 rounded-md transition-all">
                            Launch Dashboard
                        </Link>
                        <motion.a whileHover={{ scale: 1.05 }} href="/legacy" className="text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-700 px-4 py-1.5 rounded-md hover:border-zinc-500 hover:bg-zinc-900">
                            v1.0 (Legacy)
                        </motion.a>
                    </div>
                </div>
            </motion.nav>

            {/* HERO SECTION */}
            <main className="max-w-7xl mx-auto px-6 pt-40 pb-24 grid lg:grid-cols-2 gap-16 items-center">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="space-y-8 z-10"
                >
                    <motion.div variants={fadeInUp} className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-500 text-xs font-mono">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        <span>Rapha-AI v0.1.0 is Live on Polygon Mainnet</span>
                    </motion.div>

                    <motion.h1 variants={fadeInUp} className="text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
                        Train AI on <br />Clinical Data.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-500">
                            Without Moving It.
                        </span>
                    </motion.h1>

                    <motion.p variants={fadeInUp} className="text-lg text-zinc-400 leading-relaxed max-w-xl">
                        The decentralized Compute-to-Data API. Route AI training loops directly into secure hospital firewalls using ZK-TLS cryptography. Zero data leaves the building. Zero HIPAA liability.
                    </motion.p>

                    <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                            Get API Keys
                        </motion.button>
                        <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href="/whitepaper" className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 text-white border border-zinc-700 font-semibold rounded-lg hover:bg-zinc-800 hover:border-zinc-600 transition-colors flex justify-center items-center gap-2">
                            <Code size={18} /> Read the Docs
                        </motion.a>
                    </motion.div>
                </motion.div>

                {/* Hero Terminal UI */}
                <motion.div
                    initial={{ opacity: 0, x: 50, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 80, damping: 20, delay: 0.3 }}
                    className="relative z-10"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur opacity-20 animate-pulse"></div>
                    <div className="relative rounded-xl bg-[#0c0c0e] border border-zinc-800 shadow-2xl overflow-hidden font-mono text-sm">
                        <div className="flex items-center px-4 py-3 bg-[#18181b] border-b border-zinc-800">
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
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                                <span className="text-cyan-500">$</span> pip install rapha-ai<br />
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="text-zinc-500">Successfully installed rapha-ai-0.1.0</motion.span>
                            </motion.div>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>
                                <span className="text-cyan-500">$</span> python train_model.py
                            </motion.div>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="text-zinc-400 space-y-1.5 border-l-2 border-zinc-700 pl-4 ml-1">
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>&gt; Initializing RaphaClient (Mainnet)...</motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.1 }}>&gt; Packaging Llama-3 weights (8B)...</motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.4 }} className="text-blue-400">&gt; Dispatching compute payload to Node: Tokyo_Oncology_01</motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.0 }} className="text-yellow-400">&gt; [TEE] Epoch 1/5 running locally on HIPAA data...</motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.8 }} className="text-yellow-400">&gt; [TEE] Epoch 5/5 completed. Loss: 0.214</motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.2 }}>&gt; Receiving updated mathematical weights...</motion.p>
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 5.8 }} className="text-green-400 font-semibold flex items-center gap-2">
                                    <Shield size={14} /> SUCCESS: ZK-Proof verified. Polygon Contract Settled.
                                </motion.p>
                            </motion.div>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 6 }} className="flex items-center">
                                <span className="text-cyan-500">$</span> <span className="ml-2 w-2 h-4 bg-zinc-400 animate-pulse inline-block"></span>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* THE RAPHA ECOSYSTEM */}
            <section className="border-t border-zinc-800 bg-[#0c0c0e] py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="text-center mb-16 space-y-4"
                    >
                        <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white">The Rapha Ecosystem</motion.h2>
                        <motion.p variants={fadeInUp} className="text-zinc-400 max-w-2xl mx-auto">A unified, decentralized marketplace connecting the demand for AI compute with the supply of high-fidelity clinical data.</motion.p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        {/* AI Researchers */}
                        <motion.div variants={fadeInUp} whileHover={{ y: -5 }} className="p-8 rounded-2xl bg-[#121214] border border-zinc-800 flex flex-col justify-between hover:border-cyan-500 transition-colors shadow-lg hover:shadow-cyan-500/10 object-contain group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Terminal className="text-cyan-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">AI Researchers</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">Stop training on synthetic garbage. Dispatch your models into the world's largest decentralized network of proprietary EHR and telemetry data.</p>
                            </div>
                            <div className="pt-4 border-t border-zinc-800 mt-auto relative z-10">
                                <Link to="/whitepaper" className="inline-flex items-center text-sm font-semibold text-cyan-500 hover:text-cyan-400 transition-colors">
                                    View Documentation →
                                </Link>
                            </div>
                        </motion.div>

                        {/* Hospitals */}
                        <motion.div variants={fadeInUp} whileHover={{ y: -5 }} className="p-8 rounded-2xl bg-[#121214] border border-zinc-800 flex flex-col justify-between hover:border-blue-500 transition-colors shadow-lg hover:shadow-blue-500/10 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Building2 className="text-blue-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Hospitals &amp; Enterprise</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">Deploy the <code className="text-blue-300 bg-blue-900/30 px-1 py-0.5 rounded border border-blue-800">rapha-node</code> container behind your firewall. Monetize siloed data without ever exposing raw patient files. Zero HIPAA liability.</p>
                            </div>
                            <div className="pt-4 border-t border-zinc-800 mt-auto space-y-3 relative z-10">
                                <Link to="/dashboard" className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/50 font-semibold rounded-lg hover:bg-blue-500 hover:text-white transition-all text-sm group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                    <Building2 size={16} /> Access Hospital Portal
                                </Link>
                                <a href="https://github.com/qrstuvabcd/Rapha-Protocol/tree/main/nodes/enterprise-node" className="flex items-center justify-center gap-2 w-full px-6 py-2 bg-zinc-900 text-zinc-400 border border-zinc-800 text-xs font-medium rounded-lg hover:bg-zinc-800 hover:text-zinc-200 transition-all">
                                    <ExternalLink size={14} /> Download Docker Node
                                </a>
                            </div>
                        </motion.div>

                        {/* Patients */}
                        <motion.div variants={fadeInUp} whileHover={{ y: -5 }} className="p-8 rounded-2xl bg-[#121214] border border-zinc-800 flex flex-col justify-between hover:border-purple-500 transition-colors shadow-lg hover:shadow-purple-500/10 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <HeartPulse className="text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">Patients &amp; Keepers</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-6">You own your health data. Cryptographically sign compute-consent transactions and earn token bounties when your data is utilized.</p>
                            </div>
                            <div className="pt-4 border-t border-zinc-800 mt-auto space-y-3 relative z-10">
                                <Link to="/dashboard" className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-purple-500/10 text-purple-400 border border-purple-500/50 font-semibold rounded-lg hover:bg-purple-500 hover:text-white transition-all text-sm group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                                    <HeartPulse size={16} /> Access Patient Portal
                                </Link>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* THE ARCHITECTURE GRID */}
            <section className="border-t border-zinc-800 bg-[#09090b] py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="text-center mb-16 space-y-4"
                    >
                        <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white">The Data Wall is Broken.</motion.h2>
                        <motion.p variants={fadeInUp} className="text-zinc-400 max-w-2xl mx-auto">Uploading patient records to the cloud is a legal dead-end. We inverted the architecture: send the compute to the data.</motion.p>
                    </motion.div>

                    <motion.div
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid md:grid-cols-3 gap-8"
                    >
                        <motion.div variants={fadeInUp} className="flex flex-col items-center text-center space-y-4 group">
                            <div className="p-4 rounded-full bg-cyan-500/5 border border-cyan-500/20 group-hover:bg-cyan-500/10 transition-colors">
                                <Server className="text-cyan-500 w-10 h-10 group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Local TEE Execution</h3>
                            <p className="text-zinc-400 text-sm">Models run securely inside the hospital's Trusted Execution Environment.</p>
                        </motion.div>
                        <motion.div variants={fadeInUp} className="flex flex-col items-center text-center space-y-4 group">
                            <div className="p-4 rounded-full bg-blue-500/5 border border-blue-500/20 group-hover:bg-blue-500/10 transition-colors">
                                <Shield className="text-blue-400 w-10 h-10 group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-lg font-bold text-white">ZK-TLS Verification</h3>
                            <p className="text-zinc-400 text-sm">We generate a zero-knowledge proof guaranteeing data authenticity.</p>
                        </motion.div>
                        <motion.div variants={fadeInUp} className="flex flex-col items-center text-center space-y-4 group">
                            <div className="p-4 rounded-full bg-purple-500/5 border border-purple-500/20 group-hover:bg-purple-500/10 transition-colors">
                                <Network className="text-purple-400 w-10 h-10 group-hover:scale-110 transition-transform" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Polygon Settlement</h3>
                            <p className="text-zinc-400 text-sm">Escrow smart contracts release USDC bounties upon ZK verification.</p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* DEVELOPER QUICKSTART */}
            <section className="py-24 max-w-5xl mx-auto px-6 border-t border-zinc-800">
                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeInUp}
                    className="flex items-center gap-3 mb-10"
                >
                    <Cpu className="text-cyan-500" />
                    <h2 className="text-3xl font-bold text-white">Developer Quickstart</h2>
                </motion.div>

                <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={scaleIn}
                    className="rounded-xl border border-zinc-800 bg-[#0c0c0e] overflow-hidden shadow-2xl"
                >
                    <div className="flex border-b border-zinc-800 bg-[#121214] px-4 py-3 gap-6 text-sm font-medium">
                        <span className="text-cyan-500 border-b-2 border-cyan-500 pb-3 -mb-3">Python SDK</span>
                    </div>
                    <div className="p-6 font-mono text-sm text-zinc-300 space-y-6">
                        <div>
                            <p className="text-zinc-500 mb-2"># 1. Install the SDK via PyPI</p>
                            <div className="bg-black/50 p-3 rounded-lg border border-zinc-800">
                                <span className="text-cyan-500">$</span> pip install rapha-ai
                            </div>
                        </div>

                        <div>
                            <p className="text-zinc-500 mb-2"># 2. Initialize your Client &amp; Dispatch Compute</p>
                            <div className="bg-black/50 p-4 rounded-lg border border-zinc-800 whitespace-pre-wrap overflow-x-auto">
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
                </motion.div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-zinc-800 py-12 text-center text-sm text-zinc-500 bg-[#09090b]">
                <div className="flex justify-center items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>All Network Systems Operational</span>
                </div>
                <p>© 2026 Rapha Protocol Ltd.</p>
            </footer>
        </div>
    );
}