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
            <span className="text-emerald-500 font-serif italic opacity-70">{number}</span> {title}
        </h2>
    )

    const SubHeader = ({ title }: { title: string }) => (
        <h3 className="text-xl font-bold text-slate-200 mb-3 mt-8 flex items-center gap-2">
            {title}
        </h3>
    )

    return (
        <div id="top" className="min-h-screen bg-slate-950 font-sans selection:bg-emerald-500/30 text-slate-300">
            {/* Navigation */}
            <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-bold text-black border border-emerald-400">R</div>
                        <span className="text-lg font-bold text-white tracking-tight">RAPHA.LTD</span>
                    </Link>
                    <div className="hidden md:flex gap-6 text-xs font-medium uppercase tracking-widest text-slate-400">
                        {['Paradigm', 'ZK-TLS', 'Keepers', 'Bounty Pool', 'Privacy', 'Economics'].map((item) => (
                            <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="hover:text-emerald-400 transition-colors">
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </nav>

            <main className="container mx-auto px-6 py-20 max-w-4xl">
                {/* Header */}
                <div className="mb-24 text-center">
                    <div className="inline-block px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                        Technical Whitepaper v4.0
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                        rapha.ltd
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                        A Decentralized Logic Layer for Sovereign Health Data and Privacy-Preserving AI
                    </p>
                    <div className="mt-8 text-xs font-mono text-slate-500">
                        AUTHORS: RAPHA RESEARCH LABS • FEBRUARY 2026
                    </div>
                </div>

                {/* 1.0 The Paradigm */}
                <section className="mb-20">
                    <SectionHeader id="paradigm" number="1.0" title="The Paradigm: Sovereign Health" />

                    <div className="prose prose-invert max-w-none">
                        <p className="lead text-lg text-slate-300">
                            The current healthcare data infrastructure is defined by the <strong>Data-Silo Paradox</strong>: verified clinical data is abundant but trapped within non-interoperable institutional reservoirs (EHRs). This fragmentation prevents AI models from accessing high-fidelity training data and denies patients emergency cross-border access to their own records.
                        </p>

                        <SubHeader title="1.1 The Global Access Thesis" />
                        <p>
                            rapha.ltd introduces the <strong>Universal Medical Passport</strong>. By decoupling data ownership from the data custodian (hospital), we enable "World Instance Access." A patient’s emergency record—allergies, blood type, current medications—becomes instantly readable by any authorized clinician globally, bypassing local hospital silos via decentralized storage.
                        </p>
                    </div>
                </section>

                {/* 2.0 Layer 1: Cryptographic Provenance */}
                <section className="mb-20">
                    <SectionHeader id="zk-tls" number="2.0" title="Layer 1: Cryptographic Provenance (ZK-TLS)" />

                    <SubHeader title="2.1 Permissionless Ingestion" />
                    <p className="text-slate-300 mb-4">
                        rapha.ltd utilizes <strong>ZK-TLS</strong> (via Reclaim Protocol) to "pull" authentic records directly from existing HTTPS patient portals (e.g., NHS App, Kaiser Permanente) without requiring institutional API integrations. This transforms any HTTPS-enabled website into a trusted data source.
                    </p>

                    <SubHeader title="2.2 Formalization" />
                    <p className="text-slate-300 mb-4">
                        The protocol generates a Zero-Knowledge Proof <span className="font-serif italic">π</span> from the TLS session transcript <span className="font-serif italic">T</span>. The proof attests that a specific data signature <span className="font-serif italic">Σ</span> originated from a trusted domain <span className="font-serif italic">D</span> while mathematically masking sensitive session cookies or bearer tokens.
                    </p>

                    <Formula>
                        Verify(π, PubKey_Server, Σ) ∧ Origin(Σ) == D → Valid
                    </Formula>
                </section>

                {/* 3.0 Layer 2: The Keeper Network */}
                <section className="mb-20">
                    <SectionHeader id="keepers" number="3.0" title="Layer 2: The Keeper Network (Medical Oracle)" />

                    <div className="p-6 bg-slate-900/50 border-l-4 border-amber-500 rounded-r-xl mb-8 shadow-lg">
                        <h4 className="text-amber-400 font-bold mb-2">Quality Assurance Thesis</h4>
                        <p className="text-sm text-slate-400">
                            Cryptographic origin (ZK-TLS) does not guarantee clinical accuracy. A patient may upload a valid but irrelevant document. The Keeper Network acts as a distributed "Medical Oracle" to validate semantic utility.
                        </p>
                    </div>

                    <SubHeader title="3.1 The Keeper Workflow" />
                    <ul className="space-y-4 list-none pl-0 text-slate-300">
                        <li className="flex gap-4">
                            <span className="text-emerald-500 font-mono">01</span>
                            <div>
                                <strong className="text-white block">Authorization (DID)</strong>
                                Keepers onboard via <strong>Privado ID</strong>, proving ownership of valid medical credentials (e.g., GMC License, MBChB Degree) via ZK-proofs.
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="text-emerald-500 font-mono">02</span>
                            <div>
                                <strong className="text-white block">Blind Review (Threshold Access)</strong>
                                Utilizing <strong>Lit Protocol</strong>, Keepers receive a transient decryption key for a specific record. They review the data within a secure local environment to tag it for AI consumption (e.g., "Observation: Type 2 Diabetes").
                            </div>
                        </li>
                    </ul>

                    <SubHeader title="3.2 Formal Incentive Model" />
                    <p className="text-slate-300 mb-4">
                        The integrity of the oracle is secured by the <strong>Stake-and-Verify</strong> mechanism. Keepers must stake RAPHA tokens to participate.
                    </p>

                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl mb-6">
                        <h5 className="text-emerald-400 font-bold text-sm mb-4 uppercase tracking-wider">Slashing Logic Definitions</h5>
                        <ul className="text-sm space-y-2 font-mono text-slate-400">
                            <li>S_current = Keeper's current stake</li>
                            <li>Δ = Slashing penalty coefficient</li>
                            <li>C_fraud = Boolean flag for fraudulent attestation</li>
                        </ul>
                    </div>

                    <p className="text-slate-300 mb-2">If consensus detects negligence or fraud:</p>
                    <Formula>
                        S_new = S_current - (S_current × Δ)  where C_fraud = True
                    </Formula>

                    <SubHeader title="3.3 Human-in-the-Loop (HITL) Verification & The Tiered Keeper Portal" />

                    <div className="mb-6">
                        <h4 className="text-white font-bold mb-2">The Data Poisoning Vulnerability</h4>
                        <p className="text-slate-300 mb-4">
                            In any decentralized physical infrastructure network (DePIN) or decentralized science (DeSci) protocol, incentivizing data uploads creates an inherent risk of "data poisoning" or Sybil attacks. Bad actors may attempt to upload corrupted, falsified, or irrelevant files (e.g., uploading a JPEG of a dog instead of a valid MRI) simply to farm network rewards. To ensure absolute clinical validity for the AI models training on rapha.ltd, raw data must be verified before it is permitted to enter the compute layer.
                        </p>

                        <h4 className="text-white font-bold mb-2">The Solution: Tiered Role-Based Access Control (RBAC)</h4>
                        <p className="text-slate-300 mb-4">
                            To solve this without relying on centralized, cost-prohibitive medical boards, rapha.ltd employs a decentralized Keeper Portal. This portal utilizes a Tiered Role-Based Access Control (RBAC) architecture, tapping into the extensive UK medical university and NHS ecosystem to provide scalable, low-cost, high-accuracy clinical validation.
                        </p>

                        <p className="text-slate-300 mb-4">
                            Keepers are not anonymous network participants; they are vetted individuals bound by clinical confidentiality, assigned specific cryptographic Role Tokens:
                        </p>

                        <ul className="space-y-4 list-none pl-0 text-slate-300 mb-8">
                            <li className="flex gap-4 p-4 bg-slate-900 border border-slate-700/50 rounded-xl">
                                <span className="text-emerald-400 font-bold text-xl w-16 whitespace-nowrap">Tier 1</span>
                                <div>
                                    <strong className="text-white block">Medical Students</strong>
                                    <span className="text-slate-400 text-sm">Utilizes the MBChB and pre-clinical student networks (e.g., UoE, UCL) to perform high-volume, low-complexity verification. This includes binary file validation and confirming the presence of correctly defaced, low-risk scans.</span>
                                </div>
                            </li>
                            <li className="flex gap-4 p-4 bg-slate-900 border border-slate-700/50 rounded-xl">
                                <span className="text-amber-400 font-bold text-xl w-16 whitespace-nowrap">Tier 2</span>
                                <div>
                                    <strong className="text-white block">Junior Doctors / Registrars</strong>
                                    <span className="text-slate-400 text-sm">Assigned to moderate-risk datasets, responsible for verifying the accuracy of diagnostic labels on pseudonymized pathology or radiology reports.</span>
                                </div>
                            </li>
                            <li className="flex gap-4 p-4 bg-slate-900 border border-slate-700/50 rounded-xl">
                                <span className="text-rose-400 font-bold text-xl w-16 whitespace-nowrap">Tier 3</span>
                                <div>
                                    <strong className="text-white block">Consultants / Specialists</strong>
                                    <span className="text-slate-400 text-sm">The final escalation tier for high-value, highly complex datasets (e.g., rare oncology MRIs) that require expert validation before executing premium AI compute jobs.</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="p-6 bg-slate-900/50 border-l-4 border-indigo-500 rounded-r-xl shadow-lg mt-8">
                        <h4 className="text-indigo-400 font-bold mb-4 flex items-center gap-2">
                            <span className="text-xl">⚖️</span> The Compliance Firewall: Legal & Regulatory Architecture
                        </h4>
                        <p className="text-sm text-slate-400 mb-6 italic">
                            Note: The following architectural constraints are hardcoded into the rapha.ltd smart contracts to ensure strict adherence to UK health data laws.
                        </p>

                        <div className="space-y-6">
                            <div>
                                <strong className="text-white block mb-1">1. Algorithmic Defacing & GDPR Deregulation</strong>
                                <p className="text-sm text-slate-300 mb-2">
                                    Before any dataset is accessible to a Keeper, the local hospital node executes an automated sanitization script. This process completely strips all DICOM metadata (names, dates, NHS numbers) and utilizes computational "skull-stripping" algorithms to permanently destroy facial biometrics from 3D imaging.
                                </p>
                                <p className="text-xs text-indigo-300 bg-indigo-500/10 p-2 rounded border border-indigo-500/20">
                                    <strong>Legal Check:</strong> By irreversibly destroying personally identifiable information (PII) and biometrics at the source node, the data ceases to be classified as Special Category Personal Data under UK GDPR Article 9. Keepers verify strictly anonymized clinical artifacts, neutralizing the risk of a data breach.
                                </p>
                            </div>

                            <div>
                                <strong className="text-white block mb-1">2. Cryptographic Enforcement of Caldicott Principle 4</strong>
                                <p className="text-sm text-slate-300 mb-2">
                                    The UK National Data Guardian’s Caldicott Principle 4 mandates that access to health information must be strictly on a "need-to-know" basis.
                                </p>
                                <p className="text-xs text-indigo-300 bg-indigo-500/10 p-2 rounded border border-indigo-500/20">
                                    <strong>Legal Check:</strong> rapha.ltd enforces this mathematically via smart contracts. A Tier 1 Keeper's wallet is cryptographically incapable of decrypting a Tier 3 dataset. The Threshold TACo network will only generate a decryption key if the on-chain Role Token perfectly matches the assigned risk level of the data payload.
                                </p>
                            </div>

                            <div>
                                <strong className="text-white block mb-1">3. Protocol-Specific Data Processing Agreements (DPAs)</strong>
                                <p className="text-sm text-slate-300 mb-2">
                                    No Keeper relies on external university or NHS confidentiality agreements to access the portal.
                                </p>
                                <p className="text-xs text-indigo-300 bg-indigo-500/10 p-2 rounded border border-indigo-500/20">
                                    <strong>Legal Check:</strong> Every verified Keeper operates strictly as an independent data annotator under rapha.ltd’s proprietary DPAs, ensuring a legally isolated environment that protects both the clinical institutions and the network operators.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4.0 The Bounty Pool Ecosystem */}
                <section className="mb-20">
                    <SectionHeader id="bounty-pool" number="4.0" title="The Bounty Pool Ecosystem: A Dual-Sided Marketplace" />

                    <p className="text-slate-300 mb-8 text-lg">
                        rapha.ltd operates as a decentralized refinery that bridges the gap between <strong>AI Data Starvation</strong> and <strong>Stagnant Medical Capital</strong>. This is facilitated through <strong>Bounty Pools</strong>—smart-contract-governed environments where medical data is requested, verified, and monetized.
                    </p>

                    <SubHeader title="4.1 For AI Startups: Initiating a Data Request" />
                    <p className="text-slate-300 mb-4">
                        AI startups and research institutions act as the "Demand" side of the marketplace. To secure high-fidelity, clinical-grade training data, they follow the <strong>Initialization Protocol</strong>:
                    </p>
                    <ul className="space-y-4 list-none pl-0 text-slate-300 mb-6">
                        <li className="flex gap-4">
                            <span className="text-emerald-500 font-mono">01</span>
                            <div>
                                <strong className="text-white block">Pool Creation</strong>
                                The startup defines a Metadata Requirement Schema (e.g., "500 MRI scans for Stage 2 Osteoarthritis with associated clinical notes").
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="text-emerald-500 font-mono">02</span>
                            <div>
                                <strong className="text-white block">Funding (The Escrow)</strong>
                                The startup deposits the total bounty in USDC into a secure, audited smart contract on the Polygon Network.
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="text-emerald-500 font-mono">03</span>
                            <div>
                                <strong className="text-white block">Refinery Parameters</strong>
                                The startup sets the Verification Threshold. The funds remain in escrow until the data is verified by the Keeper Network, ensuring the startup only pays for high-fidelity assets.
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="text-emerald-500 font-mono">04</span>
                            <div>
                                <strong className="text-white block">Completion & Withdrawal</strong>
                                Once the data target is met and verified, the startup receives access to the Clinical Vectors (anonymized, AI-ready embeddings) while the smart contract automatically distributes the funds.
                            </div>
                        </li>
                    </ul>

                    <div className="p-5 bg-slate-900/50 border-l-4 border-emerald-500 rounded-r-xl mb-8 shadow-lg">
                        <h4 className="text-emerald-400 font-bold mb-2">Smart Escrow — De-Risked Acquisition</h4>
                        <p className="text-sm text-slate-400">
                            If a pool fails to meet its minimum target within a set timeframe, the Smart Escrow logic triggers an automatic refund to the startup, de-risking the acquisition process.
                        </p>
                    </div>

                    <SubHeader title="4.2 For Patients: Activating Dead Capital" />
                    <p className="text-slate-300 mb-4">
                        Patients act as the "Supply" side of the marketplace. To transform their dormant health records into a yielding asset, they follow the <strong>Participation Protocol</strong>:
                    </p>
                    <ul className="space-y-4 list-none pl-0 text-slate-300 mb-6">
                        <li className="flex gap-4">
                            <span className="text-emerald-500 font-mono">01</span>
                            <div>
                                <strong className="text-white block">Onboarding via ZK-TLS</strong>
                                Using the rapha.ltd dashboard, the patient "pulls" their authentic records from a trusted portal (e.g., NHS/MyChart). ZK-TLS (Zero-Knowledge Transport Layer Security) generates a cryptographic proof of the data's origin without the patient ever sharing their login credentials.
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="text-emerald-500 font-mono">02</span>
                            <div>
                                <strong className="text-white block">The Integrity Bond (Staking)</strong>
                                To join a specific Bounty Pool, the patient must stake a nominal amount of $RAPHA tokens. This "skin-in-the-game" prevents sybil attacks and duplicate submissions.
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="text-emerald-500 font-mono">03</span>
                            <div>
                                <strong className="text-white block">Submission & Review</strong>
                                The patient submits their ZK-proven data to the pool. A Medical Keeper (a verified medical professional/student) reviews the clinical relevance.
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="text-emerald-500 font-mono">04</span>
                            <div>
                                <strong className="text-white block">Asset Monetization</strong>
                                Upon successful validation, the patient is awarded <strong className="text-emerald-400">85%</strong> of the allocated bounty in USDC.
                            </div>
                        </li>
                    </ul>

                    <SubHeader title="4.3 The Settlement Logic (The 85/10/5 Split)" />
                    <p className="text-slate-300 mb-4">
                        Every transaction within a Bounty Pool follows a transparent, code-enforced distribution model:
                    </p>

                    <Formula>
                        Total Bounty = P(85%) + K(10%) + T(5%)
                    </Formula>

                    <div className="space-y-4 mt-6">
                        <div className="flex items-center gap-4 p-4 bg-slate-900 border border-emerald-500/30 rounded-xl">
                            <span className="text-emerald-400 font-bold text-xl w-16">85%</span>
                            <div>
                                <strong className="text-white block">Patient (<span className="font-serif italic">P</span>)</strong>
                                <span className="text-slate-400 text-xs">Receives 85% for providing the underlying asset.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-slate-900 border border-amber-500/30 rounded-xl">
                            <span className="text-amber-400 font-bold text-xl w-16">10%</span>
                            <div>
                                <strong className="text-white block">Keeper (<span className="font-serif italic">K</span>)</strong>
                                <span className="text-slate-400 text-xs">Receives 10% for providing professional clinical validation (the "Human Firewall").</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-slate-900 border border-indigo-500/30 rounded-xl">
                            <span className="text-indigo-400 font-bold text-xl w-16">5%</span>
                            <div>
                                <strong className="text-white block">Treasury (<span className="font-serif italic">T</span>)</strong>
                                <span className="text-slate-400 text-xs">Receives 5% to sustain protocol development and security audits.</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5.0 Layer 3: The Privacy Vault */}
                <section className="mb-20">
                    <SectionHeader id="privacy" number="5.0" title="Layer 3: The Privacy Vault (Lit Protocol & IPFS)" />

                    <SubHeader title="5.1 Non-Custodial Storage" />
                    <p className="text-slate-300 mb-4">
                        All medical blobs are encrypted client-side (AES-256-GCM) and stored on decentralized IPFS nodes. The protocol never holds custodial access to patient data.
                    </p>

                    <SubHeader title="5.2 Access Control Conditions (ACC)" />
                    <p className="text-slate-300 mb-4">
                        Decryption is governed by Lit Protocol's threshold network. The Access Control Condition (ACC) <span className="font-serif italic">Φ</span> acts as a logic gate:
                    </p>

                    <Formula>
                        Φ(a) = (a_addr == Owner) ∨ (a_role == AuthorizedKeeper ∧ Task == Active)
                    </Formula>

                    <SubHeader title="5.3 Cryptographic Shredding" />
                    <p className="text-slate-300">
                        To satisfy GDPR's "Right to be Forgotten," a patient can revoke the ACC. This effectively destroys the decryption mechanism, rendering the immutable IPFS ciphertext permanently indecipherable ("Cryptographic Shredding").
                    </p>
                </section>

                {/* 6.0 Layer 4: AI Marketplace */}
                <section className="mb-20">
                    <SectionHeader id="ai" number="6.0" title="Layer 4: The AI Training Marketplace" />

                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <SubHeader title="6.1 Data Refinement (FHIR)" />
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Keepers transform raw, unstructured data (PDFs, images) into <strong>FHIR-compliant Vector Embeddings</strong>. This standardization ensures that a dataset from London is semantically identical to one from Tokyo, creating a unified global training corpus.
                            </p>
                        </div>
                        <div>
                            <SubHeader title="6.2 Compute-over-Data (TEE)" />
                            <p className="text-slate-300 text-sm leading-relaxed">
                                AI models are trained within <strong>Trusted Execution Environments (TEEs)</strong> (e.g., Intel SGX). The raw data is decrypted only inside the hardware "black box." The model learns from the data and outputs weights, but the data itself is never exposed to the researcher.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 7.0 Layer 5: Economic Engine */}
                <section className="mb-20">
                    <SectionHeader id="economics" number="7.0" title="Layer 5: The Economic Engine" />

                    <p className="text-slate-300 mb-8 text-lg">
                        The rapha.ltd Economy is designed as a sustainable flywheel, where the utility of the Medical Passport drives data supply for the high-value AI Marketplace.
                    </p>

                    <SubHeader title="7.1 The 85/10/5 Revenue Split" />
                    <p className="text-slate-300 mb-6">
                        Smart contracts automate the settlement of all data rental transactions <span className="font-serif italic">T</span> (denominated in USDC):
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-slate-900 border border-emerald-500/30 rounded-xl">
                            <span className="text-emerald-400 font-bold text-xl w-16">85%</span>
                            <div>
                                <strong className="text-white block">Patient Pool (Universal Basic Data Income)</strong>
                                <span className="text-slate-400 text-xs">Direct "Data Yield" for contributing to the research pool. Patients verify their commitment to the network by staking a <strong className="text-emerald-400">Data Integrity Bond</strong> (50 RAPHA). This prevents spam and aligns long-term incentives — only bonded participants receive Data Usage Fees.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-slate-900 border border-amber-500/30 rounded-xl">
                            <span className="text-amber-400 font-bold text-xl w-16">10%</span>
                            <div>
                                <strong className="text-white block">Keepers (Oracle Fees)</strong>
                                <span className="text-slate-400 text-xs">Compensation for professional verification services.</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-slate-900 border border-indigo-500/30 rounded-xl">
                            <span className="text-indigo-400 font-bold text-xl w-16">5%</span>
                            <div>
                                <strong className="text-white block">rapha.ltd Treasury</strong>
                                <span className="text-slate-400 text-xs">Ecosystem growth, security audits, and R&D.</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 p-6 bg-gradient-to-br from-slate-900 to-black rounded-2xl border border-white/5">
                        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            The rapha.ltd Flywheel
                        </h4>
                        <p className="text-slate-300 text-sm italic">
                            "The Emergency Passport provides the immediate utility to acquire users; the verified data they upload creates the supply for the AI Marketplace, which generates the revenue to sustain the ecosystem."
                        </p>
                    </div>

                    {/* AI Company Refund Notice */}
                    <div className="mt-8 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">🚧</span>
                            <div>
                                <h4 className="text-amber-400 font-bold mb-2">AI Data Pool — Conditional Escrow (Coming Soon)</h4>
                                <p className="text-slate-300 text-sm mb-2">
                                    The <strong className="text-white">Pool Refund &amp; Expiry</strong> feature for AI companies is currently under development. This includes:
                                </p>
                                <ul className="text-slate-400 text-xs list-disc list-inside space-y-1 mb-3">
                                    <li>Automatic refunds if a data pool does not reach its minimum target by the deadline</li>
                                    <li>Penalty-free patient stake withdrawals from failed pools</li>
                                    <li>Keeper payment protection for all verified work regardless of pool outcome</li>
                                </ul>
                                <p className="text-amber-400/80 text-xs font-semibold">
                                    ⏳ Estimated completion: End of February 2026. AI companies will not receive refunds until this feature is live.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-24 pt-10 border-t border-white/10 text-center">
                    <p className="text-slate-500 text-sm mb-2">
                        rapha.ltd Foundation • Scientific Paper Series
                    </p>
                    <p className="text-slate-600 text-xs font-mono">
                        COMMIT: {new Date().getFullYear()}.RP.V4.0 // DECENTRALIZED DATA REFINERY
                    </p>
                </div>
            </main>
            <PageFooter />
        </div>
    )
}
