/**
 * Anti-Spam and Rate Limiting Service
 * Protects against spam messages and abusive behavior
 */

// Rate limit configuration
const RATE_LIMITS = {
    ACCESS_REQUEST: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 per hour
    DATA_UPLOAD: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 per hour
    MESSAGE: { maxRequests: 3, windowMs: 15 * 60 * 1000 }, // 3 per 15 minutes
}

// In-memory rate tracking (in production, use Redis)
const rateLimitStore: Record<string, { count: number; resetAt: number }> = {}

/**
 * Check if an action is allowed based on rate limits
 */
export function checkRateLimit(
    walletAddress: string,
    actionType: keyof typeof RATE_LIMITS
): { allowed: boolean; remainingAttempts: number; retryAfterMs: number } {
    const config = RATE_LIMITS[actionType]
    const key = `${walletAddress}:${actionType}`
    const now = Date.now()

    if (!rateLimitStore[key] || rateLimitStore[key].resetAt < now) {
        rateLimitStore[key] = { count: 1, resetAt: now + config.windowMs }
        return { allowed: true, remainingAttempts: config.maxRequests - 1, retryAfterMs: 0 }
    }

    if (rateLimitStore[key].count >= config.maxRequests) {
        const retryAfterMs = rateLimitStore[key].resetAt - now
        return { allowed: false, remainingAttempts: 0, retryAfterMs }
    }

    rateLimitStore[key].count++
    return {
        allowed: true,
        remainingAttempts: config.maxRequests - rateLimitStore[key].count,
        retryAfterMs: 0
    }
}

/**
 * Spam content detection
 */
const SPAM_PATTERNS = [
    /\b(urgent|act now|limited time)\b/i,
    /\b(free money|earn \$|make money)\b/i,
    /\b(click here|verify your account)\b/i,
    /\b(cryptocurrency|bitcoin|ethereum)\b/i,
    /https?:\/\/[^\s]+/g, // URLs
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Emails
]

export function checkForSpam(message: string): { isSpam: boolean; reason?: string } {
    // Check for spam patterns
    for (const pattern of SPAM_PATTERNS) {
        if (pattern.test(message)) {
            return { isSpam: true, reason: 'Message contains suspicious content' }
        }
    }

    // Check for excessive capitalization
    const upperCount = (message.match(/[A-Z]/g) || []).length
    if (upperCount / message.length > 0.5 && message.length > 10) {
        return { isSpam: true, reason: 'Excessive capitalization detected' }
    }

    // Check for repeated characters
    if (/(.)\1{4,}/.test(message)) {
        return { isSpam: true, reason: 'Repeated characters detected' }
    }

    return { isSpam: false }
}

/**
 * Report type for suspicious behavior
 */
export interface SpamReport {
    reporterAddress: string
    reportedAddress: string
    reason: string
    messageContent?: string
    timestamp: number
}

// Store reports (in production, store in database)
const spamReports: SpamReport[] = []

export function reportSpam(report: Omit<SpamReport, 'timestamp'>): void {
    spamReports.push({ ...report, timestamp: Date.now() })
    console.log('Spam reported:', report)
    // In production, this would trigger alerts and potential bans
}

export function getReportsForAddress(address: string): SpamReport[] {
    return spamReports.filter(r => r.reportedAddress === address)
}

/**
 * Check if address is flagged (reported 3+ times)
 */
export function isAddressFlagged(address: string): boolean {
    return getReportsForAddress(address).length >= 3
}
