/**
 * Footer Disclaimer Component
 * Displays legal disclaimers at the bottom of pages
 */
export function LegalDisclaimer() {
    return (
        <div className="mt-8 p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
            <p className="text-xs text-slate-500">
                <strong className="text-slate-400">Disclaimer:</strong> Rapha Protocol is provided "as is" without warranty.
                Medical data is user-contributed and not verified. Not medical advice.
                Use at your own risk. See{' '}
                <a href="/terms" className="text-indigo-400 hover:underline">Terms of Service</a>
                {' '}for details.
            </p>
            <p className="text-xs text-slate-600 mt-2">
                 2026 Rapha Protocol. Governed by the laws of the Republic of China (Taiwan).
            </p>
        </div>
    )
}

/**
 * Small inline disclaimer for specific features
 */
export function DataDisclaimer() {
    return (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
            <p className="text-amber-400/80">
                 <strong>Data Disclaimer:</strong> All data is provided without warranty of accuracy.
                Rapha Protocol does not verify or validate medical records. Users assume all risk.
            </p>
        </div>
    )
}

/**
 * Research/AI specific disclaimer
 */
export function ResearchDisclaimer() {
    return (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <h4 className="text-red-400 font-medium text-sm mb-2"> Important Notice for Researchers</h4>
            <ul className="text-xs text-slate-400 space-y-1">
                <li> Data is provided "AS-IS" without warranty of accuracy or completeness</li>
                <li> Rapha Protocol is not liable for any AI models trained on this data</li>
                <li> You assume all responsibility for downstream use of data</li>
                <li> By proceeding, you agree to indemnify Rapha Protocol against all claims</li>
            </ul>
        </div>
    )
}

/**
 * Testing Stage Warning Banner
 * Prominent warning that the AI system is in beta testing
 */
export function TestingDisclaimer() {
    return (
        <div className="p-4 rounded-xl bg-amber-500/20 border-2 border-amber-500/50 backdrop-blur-sm">
            <div className="flex items-start gap-3">
                <div className="text-2xl"></div>
                <div>
                    <h4 className="text-amber-400 font-bold text-sm mb-1">
                        BETA TESTING - USE AT YOUR OWN RISK
                    </h4>
                    <p className="text-xs text-amber-300/80 mb-2">
                        This AI training system is currently in <strong>testing stage</strong> and may not work as expected.
                    </p>
                    <ul className="text-xs text-slate-400 space-y-0.5">
                        <li> Features may be incomplete, buggy, or non-functional</li>
                        <li> <strong className="text-amber-400">Rapha Protocol takes NO responsibility</strong> for any issues, losses, or damages</li>
                        <li> By using this feature, you accept all risks and agree to hold Rapha Protocol harmless</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}
