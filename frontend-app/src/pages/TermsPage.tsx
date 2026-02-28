import { Link } from 'react-router-dom'
import { LegalDisclaimer } from '../components/LegalDisclaimer'

export function TermsPage() {
    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-6 max-w-4xl">
                <Link to="/" className="text-indigo-400 hover:underline mb-8 block">← Back to Home</Link>

                <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>

                <div className="prose prose-invert prose-slate max-w-none space-y-8">
                    <section className="glass-card p-6">
                        <p className="text-slate-400">
                            <strong>Last Updated:</strong> January 2026<br />
                            <strong>Effective Date:</strong> January 2026<br />
                            <strong>Governing Law:</strong> Republic of China (Taiwan)
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p className="text-slate-300">
                            By accessing or using Rapha Protocol ("Service"), you agree to be bound by these Terms of
                            Service ("Terms"). If you do not agree to all terms, do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility</h2>
                        <p className="text-slate-300">You represent and warrant that:</p>
                        <ul className="list-disc pl-6 text-slate-300 mt-2 space-y-1">
                            <li>You are at least 18 years of age</li>
                            <li>You have the legal capacity to enter into binding agreements</li>
                            <li>You are not located in a jurisdiction where the Service is prohibited</li>
                            <li>You are not subject to economic sanctions or on any prohibited party lists</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Service Description</h2>
                        <p className="text-slate-300">
                            Rapha Protocol is a decentralized protocol that facilitates the exchange of encrypted medical data
                            between patients and research organizations. The Service operates on blockchain technology
                            and utilizes smart contracts for automated transactions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. No Warranty ("AS IS")</h2>
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                            <p className="text-red-400 font-bold mb-2">IMPORTANT DISCLAIMER</p>
                            <p className="text-slate-300">
                                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND,
                                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                                FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, COMPLETENESS, AND NON-INFRINGEMENT.
                            </p>
                        </div>
                        <p className="text-slate-300 mt-4">
                            Rapha Protocol makes no warranty that:
                        </p>
                        <ul className="list-disc pl-6 text-slate-300 mt-2 space-y-1">
                            <li>The Service will meet your requirements</li>
                            <li>The Service will be uninterrupted, timely, secure, or error-free</li>
                            <li>Any data obtained will be accurate, complete, or suitable for any purpose</li>
                            <li>Smart contracts will execute as expected</li>
                            <li>Blockchain networks will remain operational</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Data Quality Disclaimer</h2>
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <p className="text-amber-400 font-bold mb-2">FOR RESEARCH ORGANIZATIONS</p>
                            <p className="text-slate-300">
                                Rapha Protocol does NOT verify, validate, authenticate, or guarantee the accuracy,
                                completeness, or suitability of any medical data exchanged through the protocol.
                                Users of data obtained through Rapha Protocol assume ALL risk associated with such data.
                            </p>
                        </div>
                        <p className="text-slate-300 mt-4">
                            AI models, algorithms, or any outputs derived from data accessed via Rapha Protocol are solely
                            the responsibility of the party creating them. Rapha Protocol shall NOT be liable for any
                            outcomes, diagnoses, treatments, or decisions made using such models or data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                            <p className="text-red-400">
                                IN NO EVENT SHALL Rapha Protocol, ITS FOUNDERS, DEVELOPERS, AFFILIATES, OFFICERS,
                                DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                                SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING WITHOUT
                                LIMITATION:
                            </p>
                            <ul className="list-disc pl-6 text-slate-300 mt-2 space-y-1">
                                <li>Loss of profits, revenue, or data</li>
                                <li>Personal injury or death</li>
                                <li>Business interruption</li>
                                <li>Loss of goodwill or reputation</li>
                                <li>Cost of substitute services</li>
                            </ul>
                        </div>
                        <p className="text-slate-300 mt-4">
                            <strong>MAXIMUM LIABILITY:</strong> Rapha Protocol's total liability to you for any claims arising
                            from the Service shall not exceed the GREATER of: (a) the fees paid by you in the
                            transaction giving rise to the claim, or (b) ONE HUNDRED US DOLLARS (USD $100).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Indemnification</h2>
                        <p className="text-slate-300">
                            You agree to indemnify, defend, and hold harmless Rapha Protocol and its founders, developers,
                            affiliates, officers, directors, employees, and agents from and against any and all
                            claims, damages, losses, liabilities, costs, and expenses (including reasonable
                            attorneys' fees) arising from:
                        </p>
                        <ul className="list-disc pl-6 text-slate-300 mt-2 space-y-1">
                            <li>Your use of the Service</li>
                            <li>Your violation of these Terms</li>
                            <li>Your violation of any third-party rights</li>
                            <li>Your violation of any applicable law or regulation</li>
                            <li>Any data you upload, share, or make available through the Service</li>
                            <li>Any AI models or algorithms you create using data from the Service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Blockchain & Cryptocurrency Risks</h2>
                        <p className="text-slate-300">You acknowledge and accept that:</p>
                        <ul className="list-disc pl-6 text-slate-300 mt-2 space-y-1">
                            <li>Blockchain transactions are irreversible</li>
                            <li>Smart contracts may contain bugs, vulnerabilities, or unintended behaviors</li>
                            <li>Cryptocurrency values are highly volatile</li>
                            <li>You are solely responsible for the security of your wallet and private keys</li>
                            <li>Loss of private keys may result in permanent loss of funds</li>
                            <li>Network congestion may delay transactions</li>
                            <li>Regulatory changes may affect the legality or operability of the Service</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Medical Disclaimer</h2>
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <p className="text-amber-400 font-bold">NOT MEDICAL ADVICE</p>
                            <p className="text-slate-300 mt-2">
                                Rapha Protocol is NOT a healthcare provider. The Service does NOT provide medical advice,
                                diagnosis, treatment, or second opinions. Nothing on this platform should be
                                construed as medical advice. Always consult qualified healthcare professionals
                                for medical decisions.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Prohibited Uses</h2>
                        <p className="text-slate-300">You agree NOT to:</p>
                        <ul className="list-disc pl-6 text-slate-300 mt-2 space-y-1">
                            <li>Upload false, fraudulent, or misleading data</li>
                            <li>Attempt to de-anonymize or re-identify data subjects</li>
                            <li>Use the Service for money laundering or terrorist financing</li>
                            <li>Violate any applicable laws or regulations</li>
                            <li>Infringe on intellectual property rights</li>
                            <li>Interfere with the proper functioning of the Service</li>
                            <li>Attempt to exploit vulnerabilities in smart contracts</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">11. Governing Law</h2>
                        <p className="text-slate-300">
                            These Terms shall be governed by and construed in accordance with the laws of the
                            Republic of China (Taiwan), without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">12. Dispute Resolution</h2>
                        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                            <p className="text-white font-bold mb-2">MANDATORY ARBITRATION</p>
                            <p className="text-slate-300">
                                Any dispute, controversy, or claim arising out of or relating to these Terms or
                                the Service shall be settled by binding arbitration in Taipei, Taiwan, in
                                accordance with the Arbitration Law of the Republic of China.
                            </p>
                            <p className="text-red-400 mt-4 font-bold">
                                CLASS ACTION WAIVER: YOU WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTION LAWSUITS
                                OR CLASS-WIDE ARBITRATION.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">13. Force Majeure</h2>
                        <p className="text-slate-300">
                            Rapha Protocol shall not be liable for any failure or delay in performance due to circumstances
                            beyond its reasonable control, including but not limited to: acts of God, natural
                            disasters, war, terrorism, government actions, regulatory changes, blockchain network
                            failures, or third-party service outages.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">14. Regulatory Compliance</h2>
                        <p className="text-slate-300">
                            Laws regarding blockchain technology, cryptocurrency, and medical data vary by
                            jurisdiction. It is YOUR responsibility to ensure that your use of the Service
                            complies with all applicable laws and regulations in your jurisdiction. Rapha Protocol makes
                            no representation that the Service is appropriate or legal in all jurisdictions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">15. Severability</h2>
                        <p className="text-slate-300">
                            If any provision of these Terms is held to be invalid or unenforceable, such provision
                            shall be struck and the remaining provisions shall remain in full force and effect.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">16. Entire Agreement</h2>
                        <p className="text-slate-300">
                            These Terms, together with our Privacy Policy, constitute the entire agreement between
                            you and Rapha Protocol regarding the Service and supersede all prior agreements.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">17. Contact</h2>
                        <p className="text-slate-300">
                            For questions about these Terms:<br />
                            Location: Taipei, Taiwan (Republic of China)
                        </p>
                    </section>
                </div>

                <LegalDisclaimer />
            </div>
        </div>
    )
}

export default TermsPage
