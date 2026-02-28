/**
 * Demo Mode Service
 * 
 * Provides realistic simulation data for video demos.
 * Activated via ?demo=true in the URL.
 * Seeds localStorage with medical records, access grants, etc.
 */

import type { UserProfile } from './profile.service'
import type { StoredRecord } from './recordStorage.service'
import type { AccessGrant } from './access.service'

// ============ Flag Detection ============

export function isDemoMode(): boolean {
    if (typeof window === 'undefined') return false
    return new URLSearchParams(window.location.search).get('demo') === 'true'
}

// ============ Demo Identities ============

export const DEMO_WALLET = '0x7a3B91c8d4E2f5A6b9C0d1E3f4A5B6C7D8E9F0a1'
export const DEMO_HOSPITAL_WALLET = '0x2b4C83d5E6f7a8B9c0D1e2F3a4B5c6D7e8F9a0B1'
export const DEMO_RESEARCHER_WALLET = '0x3c5D94e6F7a8b9C0d1E2f3A4b5C6d7E8f9A0b1C2'

export const DEMO_PATIENT_PROFILE: UserProfile = {
    walletAddress: DEMO_WALLET.toLowerCase(),
    fullName: 'James Mitchell',
    dateOfBirth: '1985-03-15',
    nationalId: 'NHS-9284756',
    hospitalPatientId: 'HN-00412938',
    role: 'patient',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
}

export const DEMO_PROVIDER_PROFILE: UserProfile = {
    walletAddress: DEMO_HOSPITAL_WALLET.toLowerCase(),
    fullName: 'Dr. Sarah Chen',
    role: 'provider',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
}

export const DEMO_RESEARCHER_PROFILE: UserProfile = {
    walletAddress: DEMO_RESEARCHER_WALLET.toLowerCase(),
    fullName: 'Dr. Elena Rodriguez',
    role: 'provider',
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
}

// ============ Demo Medical Records ============

export const DEMO_RECORDS: StoredRecord[] = [
    {
        id: 'rec_demo_001',
        patientAddress: DEMO_WALLET.toLowerCase(),
        providerAddress: DEMO_HOSPITAL_WALLET.toLowerCase(),
        providerName: 'St. Thomas Hospital',
        recordType: 'Blood Work',
        fileName: 'CBC_Panel_Feb2026.pdf',
        fileSize: 245760,
        notes: 'Complete Blood Count — all markers within normal range. Cholesterol slightly elevated.',
        ipfsHash: 'QmX7b2J9kF3mN4cR8tY5vW6xZ1aB2dE3fG4hI5jK6lM7n0',
        timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
        isActive: true,
        isOriginVerified: true,
        providerId: 'nhs.uk',
        proofHash: '0xabc123def456...',
        isQualityChecked: true,
        qualityTags: '#CBC, #Cholesterol, #Lipids',
        isMinted: true,
        tokenId: '42',
    },
    {
        id: 'rec_demo_002',
        patientAddress: DEMO_WALLET.toLowerCase(),
        providerAddress: DEMO_HOSPITAL_WALLET.toLowerCase(),
        providerName: "King's College Hospital",
        recordType: 'MRI Scan',
        fileName: 'Brain_MRI_Jan2026.dcm',
        fileSize: 52428800,
        notes: 'Routine brain MRI — no abnormalities detected. Follow-up in 12 months.',
        ipfsHash: 'QmY8c3K0lG4nO5dS9uZ6wX7yA2bC3eF4gH5iJ6kL7mN8o1',
        timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
        isActive: true,
        isOriginVerified: true,
        providerId: 'nhs.uk',
        proofHash: '0xdef789abc012...',
        isQualityChecked: true,
        qualityTags: '#Neurology, #MRI, #BrainScan',
        isMinted: true,
        tokenId: '38',
    },
    {
        id: 'rec_demo_003',
        patientAddress: DEMO_WALLET.toLowerCase(),
        providerAddress: '0x4d6E05f7a8b9c0D1e2F3a4B5c6D7e8F9a0B1c2D3'.toLowerCase(),
        providerName: 'Harley Street Cardiology',
        recordType: 'ECG Report',
        fileName: 'ECG_Resting_Dec2025.pdf',
        fileSize: 128000,
        notes: 'Resting 12-lead ECG — normal sinus rhythm. PR interval 160ms. QTc normal.',
        ipfsHash: 'QmZ9d4L1mH5oP6eT0vA7xY8zB3cD4fG5hI6jK7lM8nO9p2',
        timestamp: Date.now() - 45 * 24 * 60 * 60 * 1000,
        isActive: true,
        isOriginVerified: false,
        isQualityChecked: true,
        qualityTags: '#Cardiology, #ECG, #HeartRhythm',
        isMinted: false,
    },
    {
        id: 'rec_demo_004',
        patientAddress: DEMO_WALLET.toLowerCase(),
        providerAddress: DEMO_HOSPITAL_WALLET.toLowerCase(),
        providerName: 'Boots Pharmacy',
        recordType: 'Prescription',
        fileName: 'Atorvastatin_Rx_Feb2026.pdf',
        fileSize: 64000,
        notes: 'Atorvastatin 20mg — 1 daily for cholesterol management. Repeat prescription.',
        ipfsHash: 'QmA0e5M2nI6pQ7fU1wB8yZ9aC4dE5fG6hI7jK8lM9nO0p3',
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
        isActive: true,
        isOriginVerified: true,
        providerId: 'nhs.uk',
        proofHash: '0xghi345jkl678...',
        isQualityChecked: false,
    },
    {
        id: 'rec_demo_005',
        patientAddress: DEMO_WALLET.toLowerCase(),
        providerAddress: '0x5e7F16a8b9c0d1E2f3A4b5C6d7E8f9A0b1C2d3E4'.toLowerCase(),
        providerName: 'NHS Digital Vaccination',
        recordType: 'Vaccination Record',
        fileName: 'COVID_Booster_Nov2025.pdf',
        fileSize: 32000,
        notes: 'COVID-19 Booster (Pfizer BNT162b2) — Batch: FN4832. No adverse reactions.',
        ipfsHash: 'QmB1f6N3oJ7qR8gV2xC9zA0bD5eF6gH7iJ8kL9mN0oP1q4',
        timestamp: Date.now() - 90 * 24 * 60 * 60 * 1000,
        isActive: true,
        isOriginVerified: true,
        providerId: 'nhs.uk',
        proofHash: '0xjkl901mno234...',
        isQualityChecked: true,
        qualityTags: '#Vaccination, #COVID19, #Immunisation',
        isMinted: true,
        tokenId: '27',
    },
]

// ============ Demo Access Grants ============

export const DEMO_GRANTS: AccessGrant[] = [
    {
        id: '0x1a2b3c4d5e6f7a',
        patientAddress: DEMO_WALLET.toLowerCase(),
        providerAddress: DEMO_HOSPITAL_WALLET.toLowerCase(),
        providerName: 'St. Thomas Hospital',
        recordIds: [],
        recordTypes: [],
        expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        status: 'active',
    },
    {
        id: '0x2b3c4d5e6f7a8b',
        patientAddress: DEMO_WALLET.toLowerCase(),
        providerAddress: DEMO_RESEARCHER_WALLET.toLowerCase(),
        providerName: 'Imperial College Research Lab',
        recordIds: ['rec_demo_001', 'rec_demo_003'],
        recordTypes: ['Blood Work', 'ECG Report'],
        expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000,
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        status: 'active',
    },
    {
        id: '0x3c4d5e6f7a8b9c',
        patientAddress: DEMO_WALLET.toLowerCase(),
        providerAddress: '0x6f8A27b9c0d1e2F3a4B5c6D7e8F9a0B1c2D3e4F5'.toLowerCase(),
        providerName: 'AXA Health Insurance',
        recordIds: [],
        recordTypes: ['Blood Work', 'Vaccination Record'],
        expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
        createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
        status: 'active',
    },
]

// ============ Demo Campaigns (AI Research) ============

export interface DemoCampaign {
    address: string
    title: string
    condition: string
    dataType: string
    bountyPerUser: number
    maxUsers: number
    currentParticipants: number
    totalBudget: number
    deadline: number
    state: 'OPEN' | 'FILLED' | 'EXECUTED' | 'EXPIRED'
}

export const DEMO_CAMPAIGNS: DemoCampaign[] = [
    {
        address: '0xPool001...abc',
        title: 'Cardiac Risk Prediction Model',
        condition: 'Cardiovascular Disease',
        dataType: 'ECG + Blood Work',
        bountyPerUser: 25,
        maxUsers: 500,
        currentParticipants: 347,
        totalBudget: 12500,
        deadline: Date.now() + 60 * 24 * 60 * 60 * 1000,
        state: 'OPEN',
    },
    {
        address: '0xPool002...def',
        title: 'Genomic Markers for Rare Diseases',
        condition: 'Rare Genetic Disorders',
        dataType: 'Genomic Sequencing',
        bountyPerUser: 50,
        maxUsers: 200,
        currentParticipants: 200,
        totalBudget: 10000,
        deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
        state: 'FILLED',
    },
    {
        address: '0xPool003...ghi',
        title: 'Type 2 Diabetes Progression Study',
        condition: 'Diabetes Type 2',
        dataType: 'Blood Work + Prescriptions',
        bountyPerUser: 15,
        maxUsers: 1000,
        currentParticipants: 612,
        totalBudget: 15000,
        deadline: Date.now() + 120 * 24 * 60 * 60 * 1000,
        state: 'OPEN',
    },
]

// ============ Demo Keeper Submissions ============

export interface DemoSubmission {
    id: number
    patient: string
    dataCid: string
    isVerified: boolean
    isPaid: boolean
    recordType: string
    submittedAt: number
}

export const DEMO_SUBMISSIONS: DemoSubmission[] = [
    { id: 0, patient: '0xA1b2...C3d4', dataCid: 'QmT8r3K0l...data1', isVerified: false, isPaid: false, recordType: 'Blood Work', submittedAt: Date.now() - 2 * 60 * 60 * 1000 },
    { id: 1, patient: '0xE5f6...G7h8', dataCid: 'QmU9s4L1m...data2', isVerified: false, isPaid: false, recordType: 'MRI Scan', submittedAt: Date.now() - 5 * 60 * 60 * 1000 },
    { id: 2, patient: '0xI9j0...K1l2', dataCid: 'QmV0t5M2n...data3', isVerified: true, isPaid: true, recordType: 'ECG Report', submittedAt: Date.now() - 12 * 60 * 60 * 1000 },
    { id: 3, patient: '0xM3n4...O5p6', dataCid: 'QmW1u6N3o...data4', isVerified: true, isPaid: true, recordType: 'Prescription', submittedAt: Date.now() - 24 * 60 * 60 * 1000 },
    { id: 4, patient: '0xQ7r8...S9t0', dataCid: 'QmX2v7O4p...data5', isVerified: false, isPaid: false, recordType: 'Vaccination', submittedAt: Date.now() - 45 * 60 * 1000 },
]

// ============ Seeding Functions ============

const SEEDED_KEY = 'rapha_demo_seeded'

export function seedDemoData(): void {
    if (localStorage.getItem(SEEDED_KEY)) return // already seeded

    // Seed records
    const existingRecords = JSON.parse(localStorage.getItem('rapha_medical_records') || '[]')
    const mergedRecords = [...existingRecords, ...DEMO_RECORDS]
    localStorage.setItem('rapha_medical_records', JSON.stringify(mergedRecords))

    // Seed grants
    const existingGrants = JSON.parse(localStorage.getItem('aura_access_grants') || '[]')
    const mergedGrants = [...existingGrants, ...DEMO_GRANTS]
    localStorage.setItem('aura_access_grants', JSON.stringify(mergedGrants))

    // Seed profiles
    const existingProfiles = JSON.parse(localStorage.getItem('aura_health_profile') || '{}')
    existingProfiles[DEMO_PATIENT_PROFILE.walletAddress] = DEMO_PATIENT_PROFILE
    existingProfiles[DEMO_PROVIDER_PROFILE.walletAddress] = DEMO_PROVIDER_PROFILE
    existingProfiles[DEMO_RESEARCHER_PROFILE.walletAddress] = DEMO_RESEARCHER_PROFILE
    localStorage.setItem('aura_health_profile', JSON.stringify(existingProfiles))

    localStorage.setItem(SEEDED_KEY, 'true')
}
