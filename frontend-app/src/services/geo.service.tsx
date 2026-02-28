/**
 * Geo-blocking and Jurisdiction Restrictions
 * Blocks users from countries where crypto/medical data sharing is banned or high-risk
 */

// Countries where service is NOT available
export const BLOCKED_COUNTRIES = [
    'CN', // China - Crypto banned
    'RU', // Russia - Data localization, sanctions
    'IR', // Iran - Sanctions
    'KP', // North Korea - Sanctions
    'SY', // Syria - Sanctions
    'CU', // Cuba - Sanctions
    'VE', // Venezuela - Sanctions
    'BY', // Belarus - Sanctions
    'MM', // Myanmar - Sanctions
]

// Countries with HIGH restrictions requiring extra consent
export const RESTRICTED_COUNTRIES = [
    'US', // USA - HIPAA requirements
    'DE', // Germany - Strict GDPR
    'FR', // France - Strict GDPR
    'AT', // Austria - Strict GDPR
    'NL', // Netherlands - Strict data laws
    'SA', // Saudi Arabia - Strict healthcare laws
    'AE', // UAE - Data regulations
]

// EU countries (GDPR applies)
export const EU_COUNTRIES = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
]

interface GeoCheckResult {
    allowed: boolean
    isEU: boolean
    isRestricted: boolean
    countryCode: string | null
    message: string
}

/**
 * Check if user's country is allowed
 * Uses timezone as a rough estimate (privacy-preserving)
 */
export async function checkJurisdiction(): Promise<GeoCheckResult> {
    try {
        // Use timezone to estimate country (privacy-preserving, no IP lookup)
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

        // Map timezones to country codes (simplified)
        const timezoneCountryMap: Record<string, string> = {
            'Asia/Shanghai': 'CN',
            'Asia/Beijing': 'CN',
            'Asia/Chongqing': 'CN',
            'Europe/Moscow': 'RU',
            'Asia/Tehran': 'IR',
            'Asia/Pyongyang': 'KP',
            'Asia/Damascus': 'SY',
            'America/Havana': 'CU',
            'America/Caracas': 'VE',
            'Europe/Minsk': 'BY',
            'Asia/Yangon': 'MM',
            'Asia/Taipei': 'TW',
            'America/New_York': 'US',
            'America/Los_Angeles': 'US',
            'America/Chicago': 'US',
            'Europe/Berlin': 'DE',
            'Europe/Paris': 'FR',
            'Europe/London': 'GB',
        }

        const countryCode = timezoneCountryMap[timezone] || null

        if (countryCode && BLOCKED_COUNTRIES.includes(countryCode)) {
            return {
                allowed: false,
                isEU: false,
                isRestricted: true,
                countryCode,
                message: 'Rapha Protocol is not available in your region due to regulatory restrictions.'
            }
        }

        const isEU = countryCode ? EU_COUNTRIES.includes(countryCode) : false
        const isRestricted = countryCode ? RESTRICTED_COUNTRIES.includes(countryCode) : false

        return {
            allowed: true,
            isEU,
            isRestricted,
            countryCode,
            message: ''
        }
    } catch {
        // If we can't detect, allow with warning
        return {
            allowed: true,
            isEU: false,
            isRestricted: false,
            countryCode: null,
            message: ''
        }
    }
}

/**
 * Component to block access from restricted regions
 */
export function GeoBlockedMessage() {
    return (
        <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md text-center">
                <div className="text-6xl mb-4">?��</div>
                <h2 className="text-2xl font-bold text-white mb-4">Service Not Available</h2>
                <p className="text-slate-400 mb-6">
                    Rapha Protocol is not available in your region due to regulatory restrictions.
                </p>
                <p className="text-xs text-slate-500">
                    If you believe this is an error, please contact support.
                </p>
            </div>
        </div>
    )
}
