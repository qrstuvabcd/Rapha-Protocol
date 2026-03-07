import { Link } from 'react-router-dom';
import { Shield, ChevronLeft, AlertTriangle, Network, Lock, Zap } from 'lucide-react';

export function Whitepaper() {
    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans">
            <nav className="border-b border-zinc-800/60 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back to Home</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-indigo-500" />
                        <span className="font-semibold text-zinc-100">Rapha 2.0 Whitepaper</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-20 pb-40">
                <header className="mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        The Rapha Protocol: Decentralized Compute-to-Data for Healthcare AI
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span>Version 2.0</span>
                        <span>•</span>
                        <span>March 2026</span>
                        <span>•</span>
                        <span className="text-indigo-400">Polygon Mainnet Integration</span>
                    </div>
                </header>

                <article className="prose prose-invert prose-zinc max-w-none">
                    <div className="mb-16 p-6 rounded-xl border border-rose-500/20 bg-rose-500/5">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="w-6 h-6 text-rose-500" />
                            <h2 className="text-xl font-bold text-rose-100 m-0">The Problem: The Regulatory Data Trap</h2>
                        </div>
                        <p className="text-zinc-300 mt-2">
                            Modern AI requires massive amounts of high-quality data. However, the most valuable data—clinical records, genomic sequences, and high-resolution medical imaging—is locked behind stringent regulatory firewalls like HIPAA and GDPR.
                        </p>
                        <p className="text-zinc-300">
                            Hospitals cannot legally or ethically extract and sell this proprietary data. As a result, AI models are starved of diverse, real-world datasets, leading to biased algorithms and stunted breakthroughs in precision medicine. The traditional B2C model (aggregating patient data centrally) fundamentally fails at scale due to compliance friction and data sovereignty concerns.
                        </p>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-6 mt-12 flex items-center gap-3">
                        <Network className="w-6 h-6 text-indigo-400" />
                        The Solution: Compute-to-Data Architecture
                    </h2>
                    <p className="text-zinc-400 leading-relaxed mb-6">
                        Rapha 2.0 introduces a paradigm shift: <strong>Instead of moving the data to the algorithm, we dispatch the algorithm to the data.</strong>
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 mt-8">
                        <Lock className="w-5 h-5 text-zinc-500" />
                        1. Dockerized Trusted Execution Environments (TEEs)
                    </h3>
                    <p className="text-zinc-400 leading-relaxed mb-6">
                        Researchers bundle their untrained or partially trained models into secure Docker containers via the Rapha PyPI SDK. These containers are routed directly into the hospital's local infrastructure. Execution occurs within hardware-isolated TEEs (such as Intel SGX or AWS Nitro Enclaves). The hospital retains absolute custody of their records. The AI model trains on the local data but cannot exfiltrate it.
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 mt-8">
                        <Shield className="w-5 h-5 text-zinc-500" />
                        2. ZK-TLS Cryptography & Verifiable Truth
                    </h3>
                    <p className="text-zinc-400 leading-relaxed mb-6">
                        To guarantee that the exact requested algorithm was run on the exact requested dataset—without exposing the dataset itself—Rapha utilizes Zero-Knowledge Transport Layer Security (ZK-TLS) alongside ZK-SNARKs. The hospital's node generates a cryptographic proof that the training epoch was completed accurately. This proof mathematically guarantees execution integrity.
                    </p>

                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2 mt-8">
                        <Zap className="w-5 h-5 text-zinc-500" />
                        3. Polygon Mainnet Settlement
                    </h3>
                    <p className="text-zinc-400 leading-relaxed mb-6">
                        The ZK-Proofs are posted to the Rapha Escrow Smart Contracts on the Polygon Mainnet. Once the on-chain verifier confirms the SNARK, the enterprise escrow unlocks. The hospital receives their compute/data access fee (in USDC or MATIC), and the researcher receives the highly valuable, updated model weights.
                    </p>

                    <div className="mt-16 pt-8 border-t border-zinc-800/60">
                        <h2 className="text-2xl font-bold text-white mb-6">Conclusion</h2>
                        <p className="text-zinc-400 leading-relaxed">
                            By separating the <em>compute</em> from the <em>underlying data custody</em>, Rapha 2.0 bypasses the regulatory data trap. We are building the foundational API for decentralized, privacy-preserving AI training at an enterprise scale.
                        </p>
                    </div>
                </article>
            </main>
        </div>
    );
}
