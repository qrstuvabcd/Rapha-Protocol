import { Link } from 'react-router-dom'
import { PageFooter } from '../components/PageFooter'

export function Whitepaper() {
    // Custom Latex-like formula component
    const Formula = ({ children }: { children: React.ReactNode }) => (
        <div className="my-6 p-4 bg-slate-900 border border-slate-700 rounded-xl overflow-x-auto shadow-inner">
            <code className="text-emerald-400 font-mono text-sm md:text-base whitespace-nowrap">
                {children}
            </code>
        </div>
    )

    const SectionHeader = ({ id, number, title }: { id: string, number: string, title: string }) => (
        <h2 id={id} className="text-3xl font-bold text-white mb-8 flex items-center gap-4 scroll-mt-24 border-b border-white/10 pb-4">
            <span className="text-cyan-500 font-serif italic opacity-70">{number}</span> {title}
        </h2>
    )

    const SubHeader = ({ title }: { title: string }) => (
        <h3 className="text-xl font-bold text-slate-200 mb-3 mt-8 flex items-center gap-2">
            {title}
        </h3>
    )

    return (
        <div id="top" className="min-h-screen bg-slate-950 font-sans selection:bg-cyan-500/30 text-slate-300">
            {/* Navigation */}
            <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">R</div>
                        <span className="text-lg font-bold text-white tracking-tight">Rapha Protocol</span>
                    </Link>
                    <div className="hidden md:flex gap-6 text-xs font-medium uppercase tracking-widest text-slate-400">
                        {['The Trap', 'Architecture', 'SDK', 'Smart Contracts'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="hover:text-cyan-400 transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-20 max-w-4xl">
                {/* Header */}
                <div className="mb-24 text-center">
                    <div className="inline-block px-3 py-1 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 font-mono">
                        Rapha 2.0 Protocol Specification
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                        Compute-to-Data API
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                        Decentralized model training within enterprise firewalls using ZK-TLS and Polygon settlement.
                    </p>
                    <div className="mt-8 text-xs font-mono text-slate-500">
                        AUTHORS: RAPHA RESEARCH LABS • MARCH 2026
                    </div>
                </div>

                {/* 1.0 The Regulatory Data Trap */}
                <section className="mb-20">
                    <SectionHeader id="the-trap" number="1.0" title="The Regulatory Data Trap" />

                    <div className="prose prose-invert max-w-none">
                        <p className="lead text-lg text-slate-300">
                            The current landscape of medical AI development is paralyzed by the <strong>Regulatory Data Trap</strong>. AI foundations models require vast amounts of diverse, high-fidelity clinical data (EHR sets, genomics, imaging) to achieve robust diagnostic capabilities. However, stringent data sovereignty laws—such as HIPAA (US) and GDPR (EU)—make it legally toxic, procedurally sluggish, and financially unviable for hospitals to extract, anonymize, and transmit this data to centralized AI data-centers.
                        </p>

                        <SubHeader title="1.1 The Legacy Paradigm: Data-to-Compute" />
                        <p>
                            Traditionally, researchers sign complex multi-year Business Associate Agreements (BAAs), pay exorbitant licensing fees, and demand hospitals export their data silos via APIs to centralized cloud environments. This incurs massive liability for the hospital, risks patient privacy breaches during transit, and creates an artificial bottleneck in scientific velocity.
                        </p>

                        <SubHeader title="1.2 The Rapha 2.0 Paradigm: Compute-to-Data" />
                        <p>
                            Rapha 2.0 reverses the vector of transmission. Instead of moving regulated data out of the hospital to the AI models, <strong>we move the AI models into the hospital to train on the data natively.</strong> This entirely short-circuits healthcare compliance—if the data never leaves the institution's firewall, there is no HIPAA liability.
                        </p>
                    </div>
                </section>

                {/* 2.0 Architectural Overview */}
                <section className="mb-20">
                    <SectionHeader id="architecture" number="2.0" title="Architectural Overview" />

                    <p className="text-slate-300 mb-6">
                        The Rapha compute pipeline is bifurcated into an off-chain Enterprise Node and an on-chain verification layer. It relies heavily on Trusted Execution Environments (TEEs) and Zero-Knowledge proofs.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mb-8">
                        <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-xl">
                            <h4 className="text-cyan-400 font-bold mb-3 flex items-center gap-2">
                                <span className="text-lg">🛡️</span> Trusted Execution Environments
                            </h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Hospitals deploy our Dockerized <code>rapha-enterprise-node</code> behind their own firewalls. Within this node, a hardware-level TEE (e.g., AWS Nitro Enclaves or Intel SGX) establishes an isolated "clean room". The encrypted neural network payload is ingested, decrypted, trained on the local hospital database, and re-encrypted. The hospital IT staff cannot read the model weights, and the AI researcher cannot read the hospital data.
                            </p>
                        </div>
                        <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-xl">
                            <h4 className="text-indigo-400 font-bold mb-3 flex items-center gap-2">
                                <span className="text-lg">🔐</span> ZK-TLS & Settlement
                            </h4>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                Upon completing a training epoch, the node generates a rigorous mathematical proof (ZK-SNARK) attesting that the gradients were computed correctly over the verifiable dataset without exposing the underlying patient data. This ZK-Proof is submitted to Polygon Mainnet to trigger automated USDC payment settlements.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 3.0 Integration (Python SDK) */}
                <section className="mb-20">
                    <SectionHeader id="sdk" number="3.0" title="Integration: rapha-ai SDK" />

                    <p className="text-slate-300 mb-6">
                        For AI researchers, interacting with the Rapha network requires zero knowledge of blockchain infrastructure. The entire protocol is modularized into a lightweight Python package available on PyPI.
                    </p>

                    <div className="bg-black/80 rounded-xl overflow-hidden border border-white/10 mb-8">
                        <div className="px-4 py-2 border-b border-white/5 bg-white/5 font-mono text-xs text-slate-500">Installation</div>
                        <div className="p-4">
                            <code className="text-emerald-400 font-mono text-sm">pip install rapha-ai</code>
                        </div>
                    </div>

                    <SubHeader title="3.1 Orchestrating a Training Job" />
                    <p className="text-slate-300 mb-4">
                        Researchers instantiate a client pointing to a specific hospital's public endpoint (which proxies to their internal node), sign the payload with their Ethereum wallet, and dispatch the architecture.
                    </p>

                    <div className="bg-black border border-slate-800 rounded-xl overflow-hidden">
                        <div className="p-6 overflow-x-auto text-sm">
                            <pre className="font-mono leading-relaxed">
                                <code className="text-sky-300">import</code> <span className="text-white">rapha_ai</span>
                                <br /><br />
                                <span className="text-slate-500"># 1. Initialize ZK-TLS Connection</span><br />
                                <span className="text-white">client</span> <span className="text-sky-300">=</span> <span className="text-emerald-300">rapha_ai.Client</span>(<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-sky-300">node=</span><span className="text-amber-300">"https://api.rapha.ltd"</span>, <span className="text-slate-500"># The Hospital's Public IP</span><br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-sky-300">escrow=</span><span className="text-amber-300">"0xF1437ee28076B0A55...2aC"</span>,<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-sky-300">network=</span><span className="text-amber-300">"polygon"</span>,<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-sky-300">private_key=</span>os.environ[<span className="text-amber-300">"ETH_KEY"</span>]<br />
                                )<br /><br />
                                <span className="text-slate-500"># 2. Transmit Model Compute into Hospital TEE</span><br />
                                <span className="text-slate-500"># The payload is encrypted and dispatched over the wire.</span><br />
                                <span className="text-white">receipt</span> <span className="text-sky-300">=</span> <span className="text-emerald-300">client.train</span>(<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-sky-300">model=</span><span className="text-amber-300">'llama-3-8b-medical'</span>,<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-sky-300">dataset=</span><span className="text-amber-300">'stanford_med_ehr_v2'</span>,<br />
                                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-sky-300">epochs=</span><span className="text-purple-400">10</span><br />
                                )<br /><br />
                                <span className="text-slate-500"># 3. Validation & Off-Ramp</span><br />
                                <span className="text-emerald-300">print</span>(<span className="text-amber-300">f"Training Success! Escrow Settled. Proof: </span><span className="text-white">{'{receipt.zk_hash}'}</span><span className="text-amber-300">"</span>)<br />
                                <span className="text-emerald-300">print</span>(<span className="text-amber-300">f"Gradient Payload saved to: ./checkpoints/weights.pt"</span>)<br />
                            </pre>
                        </div>
                    </div>
                </section>

                {/* 4.0 On-Chain Escrow */}
                <section className="mb-20">
                    <SectionHeader id="smart-contracts" number="4.0" title="Smart Contracts: RaphaEscrow.sol" />

                    <p className="text-slate-300 mb-6">
                        The financial layer of the protocol operates entirely permissionlessly on Polygon Mainnet. Hospitals price their compute/data access in USDC. When an AI company wishes to train on a dataset, they pre-fund a smart contract Escrow.
                    </p>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl mb-6">
                        <h5 className="text-emerald-400 font-bold text-sm mb-4 uppercase tracking-wider">Settlement Logic Definitions</h5>
                        <ul className="text-sm space-y-2 font-mono text-slate-400">
                            <li><strong>State 1 (FUNDED):</strong> AI firm deposits 1,000 USDC specifying Hospital X's address.</li>
                            <li><strong>State 2 (TRAINING):</strong> Hospital TEE performs compute iterations locally.</li>
                            <li><strong>State 3 (SETTLEMENT):</strong> Hospital node broadcasts `settleJob(jobId, zkProof)` to Polygon.</li>
                        </ul>
                    </div>

                    <p className="text-slate-300 my-4">
                        The Escrow contract employs an on-chain verifier. It cryptographically checks the `zkProof` signature. If `<code className="text-sky-400">verifier.verifyProof(zkProof) == true</code>`, the updated AI gradients are unlocked for the researcher, and the USDC is instantly released to the hospital's treasury wallet.
                    </p>

                    <p className="text-slate-300">
                        This guarantees atomic swaps of gradient data for financial compensation, eliminating institutional counterparty risk and accounts receivable delays for healthcare providers.
                    </p>
                </section>

                <div className="mt-24 pt-10 border-t border-white/10 text-center">
                    <p className="text-slate-500 text-sm mb-2">
                        Rapha Protocol Core Engineering
                    </p>
                    <p className="text-slate-600 text-xs font-mono">
                        COMMIT: {new Date().getFullYear()}.RP.V2.0 // B2B DECENTRALIZED COMPUTE
                    </p>
                </div>
            </main>
            <PageFooter />
        </div>
    )
}

export default Whitepaper;
