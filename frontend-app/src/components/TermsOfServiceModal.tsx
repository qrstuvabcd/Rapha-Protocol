import { useState } from 'react'

interface TermsOfServiceModalProps {
    onAccept: () => void
    onDecline: () => void
}

export function TermsOfServiceModal({ onAccept, onDecline }: TermsOfServiceModalProps) {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
    const [agreedToRisk, setAgreedToRisk] = useState(false)
    const [confirmedAge, setConfirmedAge] = useState(false)
    const [confirmedJurisdiction, setConfirmedJurisdiction] = useState(false)

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
        // More generous tolerance for mobile devices (50px instead of 20px)
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            setHasScrolledToBottom(true)
        }
    }

    const canAccept = hasScrolledToBottom && agreedToTerms && agreedToPrivacy && agreedToRisk && confirmedAge && confirmedJurisdiction

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold text-white mb-4">Terms of Service & Legal Agreement</h2>

                {/* Scrollable Terms Content */}
                <div
                    className="flex-1 overflow-y-auto pr-4 mb-6 text-slate-300 text-sm space-y-4"
                    onScroll={handleScroll}
                    style={{ maxHeight: '50vh' }}
                >
                    <section>
                        <h3 className="text-white font-bold text-lg mb-2">1. ACCEPTANCE OF TERMS</h3>
                        <p>
                            By connecting your wallet and using the Rapha Protocol ("Service"), you agree to be bound by
                            these Terms of Service. If you do not agree, do not use the Service.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold text-lg mb-2">2. SERVICE DESCRIPTION</h3>
                        <p>
                            Rapha Protocol is a decentralized protocol that facilitates the exchange of medical data between
                            patients and research organizations. The Service operates on blockchain technology and
                            utilizes smart contracts for automated transactions.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold text-lg mb-2">3. NO WARRANTY - "AS IS" PROVISION</h3>
                        <p className="text-amber-400">
                            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS
                            OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                            PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                        </p>
                        <p className="mt-2">
                            Rapha Protocol makes no warranty that: (a) the Service will meet your requirements; (b) the Service
                            will be uninterrupted, timely, secure, or error-free; (c) any data obtained through the
                            Service will be accurate, complete, or suitable for any purpose.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold text-lg mb-2">4. LIMITATION OF LIABILITY</h3>
                        <p className="text-red-400">
                            IN NO EVENT SHALL Rapha Protocol, ITS FOUNDERS, DEVELOPERS, OR AFFILIATES BE LIABLE FOR ANY
                            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT
                            LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                        </p>
                        <p className="mt-2">
                            Rapha Protocol'S TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT OF FEES PAID BY YOU IN THE
                            TRANSACTION GIVING RISE TO THE CLAIM, OR ONE HUNDRED US DOLLARS (USD $100), WHICHEVER IS LESS.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold text-lg mb-2">5. DATA QUALITY DISCLAIMER</h3>
                        <p>
                            Rapha Protocol does not verify, validate, or guarantee the accuracy, completeness, or suitability
                            of any medical data exchanged through the protocol. Users of data obtained through Rapha Protocol
                            assume all risk associated with such data.
                        </p>
                        <p className="mt-2">
                            AI models trained on data from Rapha Protocol are solely the responsibility of the training party.
                            Rapha Protocol shall not be liable for any outcomes, diagnoses, or decisions made using such models.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold text-lg mb-2">6. INDEMNIFICATION</h3>
                        <p>
                            You agree to indemnify and hold harmless Rapha Protocol, its founders, developers, and affiliates
                            from any claims, damages, losses, or expenses arising from: (a) your use of the Service;
                            (b) your violation of these Terms; (c) your violation of any third party rights.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold text-lg mb-2">7. BLOCKCHAIN RISKS</h3>
                        <p>
                            You acknowledge that: (a) blockchain transactions are irreversible; (b) smart contracts
                            may contain bugs or vulnerabilities; (c) cryptocurrency values are volatile; (d) you are
                            solely responsible for the security of your wallet and private keys.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold text-lg mb-2">8. MEDICAL DISCLAIMER</h3>
                        <p>
                            Rapha Protocol is not a healthcare provider. The Service does not provide medical advice, diagnosis,
                            or treatment. Always consult qualified healthcare professionals for medical decisions.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold text-lg mb-2">9. GOVERNING LAW</h3>
                        <p>
                            These Terms shall be governed by the laws of the Republic of China (Taiwan), without
                            regard to conflict of law principles.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold text-lg mb-2">10. DISPUTE RESOLUTION</h3>
                        <p>
                            Any dispute arising from these Terms shall be resolved through binding arbitration in
                            Taipei, Taiwan, in accordance with the Arbitration Law of the Republic of China.
                            YOU WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTION LAWSUITS.
                        </p>
                    </section>

                    <section>
                        <h3 className="text-white font-bold text-lg mb-2">11. DATA DELETION</h3>
                        <p>
                            Upon request, Rapha Protocol will delete your account and destroy cryptographic keys rendering
                            your encrypted data unreadable. Due to the nature of decentralized storage, encrypted
                            ciphertext may persist but will be permanently inaccessible.
                        </p>
                    </section>

                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-600 mt-6">
                        <p className="text-slate-400 text-xs">
                            Last Updated: January 2026 | Version 1.0
                        </p>
                    </div>
                </div>

                {!hasScrolledToBottom && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4 animate-pulse">
                        <span className="text-lg">⬇️</span>
                        <p className="text-amber-400 text-sm font-medium">Please scroll to the bottom to accept</p>
                    </div>
                )}

                {/* Checkboxes */}
                <div className="space-y-3 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            disabled={!hasScrolledToBottom}
                            className="w-5 h-5 mt-0.5 rounded"
                        />
                        <span className={`text-sm ${hasScrolledToBottom ? 'text-white' : 'text-slate-500'}`}>
                            I have read and agree to the Terms of Service
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreedToPrivacy}
                            onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                            disabled={!hasScrolledToBottom}
                            className="w-5 h-5 mt-0.5 rounded"
                        />
                        <span className={`text-sm ${hasScrolledToBottom ? 'text-white' : 'text-slate-500'}`}>
                            I understand my data will be encrypted and shared only with my explicit consent
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={agreedToRisk}
                            onChange={(e) => setAgreedToRisk(e.target.checked)}
                            disabled={!hasScrolledToBottom}
                            className="w-5 h-5 mt-0.5 rounded"
                        />
                        <span className={`text-sm ${hasScrolledToBottom ? 'text-white' : 'text-slate-500'}`}>
                            I accept the risks associated with blockchain technology and cryptocurrency
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={confirmedAge}
                            onChange={(e) => setConfirmedAge(e.target.checked)}
                            disabled={!hasScrolledToBottom}
                            className="w-5 h-5 mt-0.5 rounded"
                        />
                        <span className={`text-sm ${hasScrolledToBottom ? 'text-white' : 'text-slate-500'}`}>
                            <strong>I confirm I am at least 18 years of age</strong>
                        </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={confirmedJurisdiction}
                            onChange={(e) => setConfirmedJurisdiction(e.target.checked)}
                            disabled={!hasScrolledToBottom}
                            className="w-5 h-5 mt-0.5 rounded"
                        />
                        <span className={`text-sm ${hasScrolledToBottom ? 'text-white' : 'text-slate-500'}`}>
                            <strong>I am not located in a jurisdiction where this service is prohibited</strong> (including but not limited to: China, Russia, Iran, North Korea, Syria, Cuba)
                        </span>
                    </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={onDecline}
                        className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    >
                        Decline
                    </button>
                    <button
                        onClick={onAccept}
                        disabled={!canAccept}
                        className={`flex-1 py-3 rounded-xl font-medium ${canAccept
                            ? 'btn-gradient'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        I Accept
                    </button>
                </div>
            </div>
        </div>
    )
}
