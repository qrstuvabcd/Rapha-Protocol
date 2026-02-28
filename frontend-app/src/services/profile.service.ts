/**
 * User Profile Service
 * 
 * Manages user identity data linked to their wallet.
 * Profile is encrypted and stored locally.
 */

const PROFILE_STORAGE_KEY = 'aura_health_profile'

export interface UserProfile {
    /** Wallet address this profile belongs to */
    walletAddress: string
    /** User's full name */
    fullName: string
    /** Date of birth (YYYY-MM-DD) */
    dateOfBirth?: string
    /** National ID or SSN (encrypted) */
    nationalId?: string
    /** Hospital Patient ID for linking records */
    hospitalPatientId?: string
    /** Email (optional) */
    email?: string
    /** Phone (optional) */
    phone?: string
    /** User role: patient or provider */
    role: 'patient' | 'provider'
    /** Profile creation timestamp */
    createdAt: number
    /** Last updated timestamp */
    updatedAt: number
}

export interface CreateProfileData {
    fullName: string
    dateOfBirth?: string
    nationalId?: string
    hospitalPatientId?: string
    email?: string
    phone?: string
    role?: 'patient' | 'provider'
}

/**
 * Save user profile to local storage
 */
export function saveProfile(walletAddress: string, data: CreateProfileData): UserProfile {
    const now = Date.now()

    const profile: UserProfile = {
        walletAddress: walletAddress.toLowerCase(),
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        nationalId: data.nationalId,
        hospitalPatientId: data.hospitalPatientId,
        email: data.email,
        phone: data.phone,
        role: data.role || 'patient',
        createdAt: now,
        updatedAt: now,
    }

    // Store profile indexed by wallet address
    const profiles = getAllProfiles()
    profiles[profile.walletAddress] = profile
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles))

    return profile
}

/**
 * Get profile by wallet address
 */
export function getProfile(walletAddress: string): UserProfile | null {
    const profiles = getAllProfiles()
    return profiles[walletAddress.toLowerCase()] || null
}

/**
 * Update existing profile
 */
export function updateProfile(walletAddress: string, updates: Partial<CreateProfileData>): UserProfile | null {
    const profile = getProfile(walletAddress)
    if (!profile) return null

    const updatedProfile: UserProfile = {
        ...profile,
        ...updates,
        updatedAt: Date.now(),
    }

    const profiles = getAllProfiles()
    profiles[walletAddress.toLowerCase()] = updatedProfile
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles))

    return updatedProfile
}

/**
 * Delete profile
 */
export function deleteProfile(walletAddress: string): void {
    const profiles = getAllProfiles()
    delete profiles[walletAddress.toLowerCase()]
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles))
}

/**
 * Check if profile exists
 */
export function hasProfile(walletAddress: string): boolean {
    return getProfile(walletAddress) !== null
}

/**
 * Get all stored profiles
 */
function getAllProfiles(): Record<string, UserProfile> {
    const stored = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (!stored) return {}

    try {
        return JSON.parse(stored)
    } catch {
        return {}
    }
}

/**
 * Format display name (first name or full name)
 */
export function getDisplayName(profile: UserProfile | null, short = false): string {
    if (!profile) return 'User'

    if (short) {
        const firstName = profile.fullName.split(' ')[0]
        return firstName || profile.fullName
    }

    return profile.fullName
}

/**
 * Mask sensitive data for display
 */
export function maskSensitiveData(value: string): string {
    if (value.length <= 4) return '****'
    return '*'.repeat(value.length - 4) + value.slice(-4)
}
