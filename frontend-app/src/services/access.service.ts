/**
 * Access Control Service
 * 
 * Manages access grants between patients and providers.
 * Uses TACo-style conditions for decentralized access control.
 */

import { ethers } from 'ethers'

const ACCESS_STORAGE_KEY = 'aura_access_grants'

export interface AccessGrant {
    id: string
    /** Patient wallet who owns the record */
    patientAddress: string
    /** Provider wallet receiving access */
    providerAddress: string
    /** Provider's name (for display) */
    providerName: string
    /** Record IDs this grant applies to (empty = all records) */
    recordIds: string[]
    /** Record types this grant applies to (empty = all types) */
    recordTypes: string[]
    /** When access expires (0 = never) */
    expiresAt: number
    /** When grant was created */
    createdAt: number
    /** Grant status */
    status: 'active' | 'revoked' | 'expired'
}

export interface CreateGrantParams {
    patientAddress: string
    providerAddress: string
    providerName: string
    recordIds?: string[]
    recordTypes?: string[]
    expirationDays?: number
}

/**
 * Create a new access grant
 */
export function createAccessGrant(params: CreateGrantParams): AccessGrant {
    const {
        patientAddress,
        providerAddress,
        providerName,
        recordIds = [],
        recordTypes = [],
        expirationDays = 0,
    } = params

    const now = Date.now()
    const grant: AccessGrant = {
        id: ethers.keccak256(ethers.toUtf8Bytes(`${patientAddress}-${providerAddress}-${now}`)).slice(0, 18),
        patientAddress: patientAddress.toLowerCase(),
        providerAddress: providerAddress.toLowerCase(),
        providerName,
        recordIds,
        recordTypes,
        expiresAt: expirationDays > 0 ? now + (expirationDays * 24 * 60 * 60 * 1000) : 0,
        createdAt: now,
        status: 'active',
    }

    // Save to storage
    const grants = getAllGrants()
    grants.push(grant)
    localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(grants))

    return grant
}

/**
 * Get all grants for a patient
 */
export function getPatientGrants(patientAddress: string): AccessGrant[] {
    const grants = getAllGrants()
    return grants.filter(g => g.patientAddress === patientAddress.toLowerCase())
}

/**
 * Get all grants for a provider (records they can access)
 */
export function getProviderGrants(providerAddress: string): AccessGrant[] {
    const grants = getAllGrants()
    const now = Date.now()

    return grants.filter(g =>
        g.providerAddress === providerAddress.toLowerCase() &&
        g.status === 'active' &&
        (g.expiresAt === 0 || g.expiresAt > now)
    )
}

/**
 * Revoke an access grant
 */
export function revokeGrant(grantId: string): boolean {
    const grants = getAllGrants()
    const index = grants.findIndex(g => g.id === grantId)

    if (index === -1) return false

    grants[index].status = 'revoked'
    localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(grants))

    return true
}

/**
 * Check if a provider has access to a specific record
 */
export function hasAccess(
    providerAddress: string,
    patientAddress: string,
    recordId?: string,
    recordType?: string
): boolean {
    const grants = getProviderGrants(providerAddress)

    return grants.some(g => {
        if (g.patientAddress !== patientAddress.toLowerCase()) return false

        // Check record ID restriction
        if (recordId && g.recordIds.length > 0 && !g.recordIds.includes(recordId)) {
            return false
        }

        // Check record type restriction
        if (recordType && g.recordTypes.length > 0 && !g.recordTypes.includes(recordType)) {
            return false
        }

        return true
    })
}

/**
 * Get all stored grants
 */
function getAllGrants(): AccessGrant[] {
    const stored = localStorage.getItem(ACCESS_STORAGE_KEY)
    if (!stored) return []

    try {
        const grants: AccessGrant[] = JSON.parse(stored)

        // Update expired grants
        const now = Date.now()
        let updated = false
        grants.forEach(g => {
            if (g.status === 'active' && g.expiresAt > 0 && g.expiresAt < now) {
                g.status = 'expired'
                updated = true
            }
        })

        if (updated) {
            localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(grants))
        }

        return grants
    } catch {
        return []
    }
}

/**
 * Format expiration for display
 */
export function formatExpiration(expiresAt: number): string {
    if (expiresAt === 0) return 'Never'

    const now = Date.now()
    if (expiresAt < now) return 'Expired'

    const days = Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000))
    if (days === 1) return '1 day'
    if (days < 30) return `${days} days`

    const months = Math.ceil(days / 30)
    return `${months} month${months > 1 ? 's' : ''}`
}
