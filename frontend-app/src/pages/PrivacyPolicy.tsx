import { Link } from 'react-router-dom'
import { LegalDisclaimer } from '../components/LegalDisclaimer'

export function PrivacyPolicy() {
    return (
        <div className="min-h-screen py-12">
            <div className="container mx-auto px-6 max-w-4xl">
                <Link to="/" className="text-indigo-400 hover:underline mb-8 block">← Back to Home</Link>

                <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>

                <div className="prose prose-invert prose-slate max-w-none space-y-8">
                    <section className="glass-card p-6">
                        <p className="text-slate-400">
                            <strong>Last Updated:</strong> January 2026<br />
                            <strong>Effective Date:</strong> January 2026<br />
                            <strong>Governing Law:</strong> Republic of China (Taiwan)
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p className="text-slate-300">
                            Rapha Protocol ("we", "us", "our") respects your privacy and is committed to protecting
                            your personal data. This Privacy Policy explains how we collect, use, and protect your
                            information when you use our decentralized health data marketplace.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Data Controller</h2>
                        <p className="text-slate-300">
                            Rapha Protocol operates as a software platform that facilitates peer-to-peer data exchange.
                            For GDPR purposes:
                        </p>
                        <ul className="list-disc pl-6 text-slate-300 mt-2 space-y-1">
                            <li><strong>Patients:</strong> You are the Data Controller of your own health data</li>
                            <li><strong>Research Organizations:</strong> They become Data Controllers when they access data</li>
                            <li><strong>Rapha Protocol:</strong> We act as a Data Processor facilitating the exchange</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Data We Collect</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-slate-300 text-sm">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left py-2">Data Type</th>
                                        <th className="text-left py-2">Purpose</th>
                                        <th className="text-left py-2">Storage</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-800">
                                        <td className="py-2">Wallet Address</td>
                                        <td>Authentication, payments</td>
                                        <td>Blockchain (permanent)</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="py-2">Profile Data</td>
                                        <td>User experience</td>
                                        <td>Local device (encrypted)</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="py-2">Health Records</td>
                                        <td>Research marketplace</td>
                                        <td>IPFS (encrypted)</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="py-2">Transaction Data</td>
                                        <td>Payment processing</td>
                                        <td>Blockchain (permanent)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Your Rights (GDPR & Taiwan PDPA)</h2>
                        <p className="text-slate-300 mb-4">You have the following rights:</p>
                        <ul className="list-disc pl-6 text-slate-300 space-y-2">
                            <li><strong>Right to Access:</strong> Request a copy of your data</li>
                            <li><strong>Right to Rectification:</strong> Correct inaccurate data</li>
                            <li><strong>Right to Erasure:</strong> Request deletion (see Section 5)</li>
                            <li><strong>Right to Restriction:</strong> Limit processing of your data</li>
                            <li><strong>Right to Portability:</strong> Export your data</li>
                            <li><strong>Right to Object:</strong> Opt-out of certain processing</li>
                            <li><strong>Right to Withdraw Consent:</strong> Revoke access at any time</li>
                        </ul>
                        <p className="text-slate-400 mt-4 text-sm">
                            To exercise these rights, use the contact form on our website.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Data Deletion ("Crypto-Shredding")</h2>
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-4">
                            <p className="text-amber-400">
                                <strong>?��? Important:</strong> Due to the decentralized nature of our service,
                                data deletion works differently than traditional systems.
                            </p>
                        </div>
                        <p className="text-slate-300">
                            When you request deletion:
                        </p>
                        <ol className="list-decimal pl-6 text-slate-300 mt-2 space-y-2">
                            <li>We destroy your cryptographic decryption keys</li>
                            <li>Your encrypted data on IPFS becomes permanently unreadable</li>
                            <li>The encrypted ciphertext may persist but is inaccessible</li>
                            <li>Blockchain transaction records cannot be deleted (pseudonymous only)</li>
                        </ol>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">6. International Transfers</h2>
                        <p className="text-slate-300">
                            Rapha Protocol operates on decentralized infrastructure. Your encrypted data may be stored on
                            IPFS nodes worldwide. By using our service, you consent to this cross-border transfer.
                        </p>
                        <p className="text-slate-300 mt-2">
                            For EU users: We rely on your consent and the encryption of data as safeguards for
                            international transfers.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Data Security</h2>
                        <ul className="list-disc pl-6 text-slate-300 space-y-2">
                            <li>All health data is encrypted client-side before upload</li>
                            <li>Decryption keys are managed via threshold cryptography (Lit Protocol)</li>
                            <li>No Rapha Protocol employee can access your unencrypted data</li>
                            <li>Payments processed via audited smart contracts</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
                        <p className="text-slate-300">
                            Rapha Protocol is not intended for users under 18 years of age. We do not knowingly collect
                            data from minors. If you believe a minor has used our service, contact us immediately.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
                        <p className="text-slate-300">
                            We may update this Privacy Policy. Material changes will be notified via the app.
                            Continued use after changes constitutes acceptance.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
                        <p className="text-slate-300">
                            For privacy inquiries:<br />
                            Location: Taipei, Taiwan (Republic of China)
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">11. Supervisory Authority</h2>
                        <p className="text-slate-300">
                            Taiwan: National Development Council (Personal Data Protection)<br />
                            EU Users: You have the right to lodge a complaint with your local Data Protection Authority.
                        </p>
                    </section>
                </div>

                <LegalDisclaimer />
            </div>
        </div>
    )
}

export default PrivacyPolicy
