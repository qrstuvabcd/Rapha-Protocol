/**
 * FHIR Transformer — AI-Ready Medical Data Vectorization
 * 
 * Transforms verified clinical findings into FHIR R4 JSON-LD format,
 * the global standard for health data interoperability (HL7 FHIR).
 * 
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  WHY FHIR R4 JSON-LD?                                         ║
 * ║                                                                ║
 * ║  FHIR (Fast Healthcare Interoperability Resources) is the      ║
 * ║  international standard for health data exchange endorsed by   ║
 * ║  HL7 International, used by NHS, CMS, and Epic Systems.       ║
 * ║                                                                ║
 * ║  JSON-LD (Linked Data) adds semantic context via @context URIs,║
 * ║  making each resource globally addressable and machine-         ║
 * ║  readable without ambiguity.                                   ║
 * ║                                                                ║
 * ║  This format is CRITICAL for Rapha's AI moat because:          ║
 * ║                                                                ║
 * ║  1. AI models trained on FHIR data can generalize across       ║
 * ║     institutions (NHS, Kaiser, Mayo) without per-schema ETL.   ║
 * ║                                                                ║
 * ║  2. Compute-over-Data (TEE): An AI model can be executed       ║
 * ║     INSIDE an Intel SGX / AMD SEV enclave against FHIR-        ║
 * ║     structured data WITHOUT downloading the raw file.          ║
 * ║     The enclave receives the JSON-LD, runs the model, and      ║
 * ║     outputs only the result (diagnosis, risk score, etc.)      ║
 * ║     — the raw data never leaves the enclave.                   ║
 * ║                                                                ║
 * ║  3. SNOMED CT codes provide standardized medical terminology   ║
 * ║     that AI models can use as feature vectors.                 ║
 * ║                                                                ║
 * ║  This is the "data moat" — high-quality, structured, verified  ║
 * ║  medical data that AI companies will pay to compute against.   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { ethers } from 'ethers';

// ============================================================
// FHIR R4 Types (subset relevant to Rapha)
// ============================================================

/** FHIR R4 JSON-LD context for semantic linking */
const FHIR_CONTEXT = {
    '@context': {
        '@vocab': 'http://hl7.org/fhir/',
        'fhir': 'http://hl7.org/fhir/',
        'snomed': 'http://snomed.info/sct/',
        'loinc': 'http://loinc.org/',
        'rapha': 'https://rapha.ltd/schema/',
        'xsd': 'http://www.w3.org/2001/XMLSchema#',
    },
};

/** FHIR Resource Type identifiers */
export type FhirResourceType =
    | 'Observation'    // Lab results, vitals
    | 'Condition'      // Diagnoses
    | 'MedicationStatement' // Active medications
    | 'AllergyIntolerance'  // Allergies
    | 'DiagnosticReport'    // Full reports (MRI, X-Ray)
    | 'Immunization'        // Vaccination records
    | 'Bundle';             // Collection of resources

/** SNOMED CT codes for common medical concepts */
const SNOMED_CODES: Record<string, { code: string; display: string }> = {
    blood_type: { code: '363787002', display: 'Observable entity: Blood group' },
    diabetes: { code: '73211009', display: 'Diabetes mellitus' },
    diabetes_type2: { code: '44054006', display: 'Diabetes mellitus type 2' },
    hypertension: { code: '38341003', display: 'Hypertensive disorder' },
    asthma: { code: '195967001', display: 'Asthma' },
    allergy: { code: '420134006', display: 'Propensity to adverse reaction' },
    mri_brain: { code: '29071007', display: 'Magnetic resonance imaging of brain' },
    xray_chest: { code: '399208008', display: 'Plain chest X-ray' },
    blood_glucose: { code: '33747003', display: 'Blood glucose measurement' },
    cholesterol: { code: '121868005', display: 'Total cholesterol measurement' },
    hemoglobin: { code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood' },
    clear_lungs: { code: '48348007', display: 'Normal breath sounds' },
};

/** LOINC codes for lab observations */
const LOINC_CODES: Record<string, { code: string; display: string }> = {
    blood_glucose: { code: '2345-7', display: 'Glucose [Mass/volume] in Serum or Plasma' },
    hba1c: { code: '4548-4', display: 'Hemoglobin A1c' },
    total_cholesterol: { code: '2093-3', display: 'Cholesterol [Mass/volume] in Serum or Plasma' },
    ldl: { code: '2089-1', display: 'LDL Cholesterol' },
    hdl: { code: '2085-9', display: 'HDL Cholesterol' },
    blood_pressure_systolic: { code: '8480-6', display: 'Systolic blood pressure' },
    blood_pressure_diastolic: { code: '8462-4', display: 'Diastolic blood pressure' },
    body_temperature: { code: '8310-5', display: 'Body temperature' },
    heart_rate: { code: '8867-4', display: 'Heart rate' },
};

// ============================================================
// FHIR Resource Interfaces
// ============================================================

export interface FhirResource {
    '@context'?: typeof FHIR_CONTEXT['@context'];
    resourceType: FhirResourceType;
    id: string;
    meta: {
        lastUpdated: string;
        source: string;
        profile?: string[];
        tag?: Array<{ system: string; code: string; display: string }>;
    };
    [key: string]: unknown;
}

export interface FhirObservation extends FhirResource {
    resourceType: 'Observation';
    status: 'final' | 'preliminary' | 'amended';
    category: Array<{
        coding: Array<{ system: string; code: string; display: string }>;
    }>;
    code: {
        coding: Array<{ system: string; code: string; display: string }>;
        text: string;
    };
    subject: { reference: string; display: string };
    effectiveDateTime: string;
    valueQuantity?: { value: number; unit: string; system: string; code: string };
    valueString?: string;
    interpretation?: Array<{
        coding: Array<{ system: string; code: string; display: string }>;
    }>;
}

export interface FhirCondition extends FhirResource {
    resourceType: 'Condition';
    clinicalStatus: {
        coding: Array<{ system: string; code: string }>;
    };
    verificationStatus: {
        coding: Array<{ system: string; code: string }>;
    };
    category: Array<{
        coding: Array<{ system: string; code: string; display: string }>;
    }>;
    code: {
        coding: Array<{ system: string; code: string; display: string }>;
        text: string;
    };
    subject: { reference: string; display: string };
    onsetDateTime?: string;
}

export interface FhirBundle extends FhirResource {
    resourceType: 'Bundle';
    type: 'collection' | 'document' | 'searchset';
    total: number;
    entry: Array<{
        fullUrl: string;
        resource: FhirResource;
    }>;
}

// ============================================================
// Input types (from ZK-TLS claim data or keeper labels)
// ============================================================

export interface ClinicalFinding {
    /** Type of finding (e.g., "blood_type", "diagnosis", "lab_result") */
    type: string;
    /** Finding name or label (e.g., "Diabetes Type 2") */
    name: string;
    /** Optional value (e.g., "5.7" for HbA1c) */
    value?: string | number;
    /** Optional unit (e.g., "mg/dL", "mmHg") */
    unit?: string;
    /** When the finding was recorded */
    dateRecorded?: string;
    /** Reference range (e.g., "70-100 mg/dL") */
    referenceRange?: string;
    /** SNOMED or LOINC code if known */
    code?: string;
    /** Code system (e.g., "snomed", "loinc") */
    codeSystem?: string;
}

export interface TransformInput {
    /** Patient wallet address (used as DID reference) */
    patientAddress: string;
    /** Clinical findings from ZK-TLS or keeper review */
    findings: ClinicalFinding[];
    /** Data source (e.g., "nhs.uk") */
    source: string;
    /** ZK proof hash (for provenance chain) */
    proofHash?: string;
    /** Keeper quality tags */
    qualityTags?: string;
}

// ============================================================
// Transformer
// ============================================================

export class FhirTransformer {
    /**
     * Transform clinical findings into a FHIR R4 JSON-LD Bundle.
     * 
     * This is the core data preparation step for AI compute.
     * The output Bundle can be:
     *   1. Stored on IPFS alongside the encrypted data
     *   2. Loaded into a TEE enclave for Compute-over-Data
     *   3. Fed into an AI vectorization pipeline (embeddings)
     * 
     * @param input — Clinical findings and metadata
     * @returns FHIR R4 Bundle in JSON-LD format
     */
    transform(input: TransformInput): FhirBundle {
        const { patientAddress, findings, source, proofHash, qualityTags } = input;
        const now = new Date().toISOString();

        // Generate a deterministic bundle ID from patient + timestamp
        const bundleId = ethers.keccak256(
            ethers.toUtf8Bytes(`${patientAddress}:${now}`)
        ).slice(0, 18); // Short ID for readability

        // Transform each finding into the appropriate FHIR resource
        const entries = findings.map((finding, index) => {
            const resource = this.findingToResource(finding, patientAddress, source, index);
            return {
                fullUrl: `urn:uuid:${bundleId}-${index}`,
                resource,
            };
        });

        // Build the Bundle
        const bundle: FhirBundle = {
            ...FHIR_CONTEXT,
            resourceType: 'Bundle',
            id: bundleId,
            type: 'collection',
            total: entries.length,
            meta: {
                lastUpdated: now,
                source: `rapha:zk-tls:${source}`,
                profile: ['http://hl7.org/fhir/StructureDefinition/Bundle'],
                tag: [
                    {
                        system: 'https://rapha.ltd/tags',
                        code: 'zk-verified',
                        display: 'ZK-TLS Verified Origin',
                    },
                    ...(proofHash ? [{
                        system: 'https://rapha.ltd/proof',
                        code: proofHash,
                        display: 'ZK Proof Hash',
                    }] : []),
                    ...(qualityTags ? qualityTags.split(',').map(tag => ({
                        system: 'https://rapha.ltd/quality',
                        code: tag.trim(),
                        display: tag.trim(),
                    })) : []),
                ],
            },
            entry: entries,
        };

        return bundle;
    }

    /**
     * Convert a single clinical finding to the appropriate FHIR resource.
     */
    private findingToResource(
        finding: ClinicalFinding,
        patientAddress: string,
        source: string,
        index: number
    ): FhirResource {
        const now = finding.dateRecorded || new Date().toISOString();
        const id = `${patientAddress.slice(0, 10)}-${index}`;

        // Route by finding type
        switch (finding.type) {
            case 'lab_result':
            case 'vital':
            case 'blood_type':
                return this.createObservation(finding, id, patientAddress, source, now);

            case 'diagnosis':
            case 'condition':
                return this.createCondition(finding, id, patientAddress, now);

            default:
                // Default to Observation for unknown types
                return this.createObservation(finding, id, patientAddress, source, now);
        }
    }

    /**
     * Create a FHIR Observation resource (lab results, vitals, measurements).
     */
    private createObservation(
        finding: ClinicalFinding,
        id: string,
        patientAddress: string,
        source: string,
        date: string
    ): FhirObservation {
        const coding = this.resolveCoding(finding);

        const observation: FhirObservation = {
            resourceType: 'Observation',
            id,
            meta: {
                lastUpdated: date,
                source: `rapha:${source}`,
            },
            status: 'final',
            category: [{
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                    code: finding.type === 'vital' ? 'vital-signs' : 'laboratory',
                    display: finding.type === 'vital' ? 'Vital Signs' : 'Laboratory',
                }],
            }],
            code: {
                coding,
                text: finding.name,
            },
            subject: {
                reference: `Patient/${patientAddress}`,
                display: `Wallet ${patientAddress.slice(0, 8)}...`,
            },
            effectiveDateTime: date,
        };

        // Add value if present
        if (finding.value !== undefined) {
            if (typeof finding.value === 'number') {
                observation.valueQuantity = {
                    value: finding.value,
                    unit: finding.unit || '',
                    system: 'http://unitsofmeasure.org',
                    code: finding.unit || '',
                };
            } else {
                observation.valueString = String(finding.value);
            }
        }

        return observation;
    }

    /**
     * Create a FHIR Condition resource (diagnoses, diseases).
     */
    private createCondition(
        finding: ClinicalFinding,
        id: string,
        patientAddress: string,
        date: string
    ): FhirCondition {
        const coding = this.resolveCoding(finding);

        return {
            resourceType: 'Condition',
            id,
            meta: {
                lastUpdated: date,
                source: 'rapha:zk-tls',
            },
            clinicalStatus: {
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                    code: 'active',
                }],
            },
            verificationStatus: {
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
                    code: 'confirmed',
                }],
            },
            category: [{
                coding: [{
                    system: 'http://terminology.hl7.org/CodeSystem/condition-category',
                    code: 'encounter-diagnosis',
                    display: 'Encounter Diagnosis',
                }],
            }],
            code: {
                coding,
                text: finding.name,
            },
            subject: {
                reference: `Patient/${patientAddress}`,
                display: `Wallet ${patientAddress.slice(0, 8)}...`,
            },
            onsetDateTime: date,
        };
    }

    /**
     * Resolve a finding name to SNOMED CT or LOINC coding.
     * 
     * This is where the standardization happens. The AI model
     * receives these standard codes as features rather than
     * free-text, enabling cross-institutional learning.
     */
    private resolveCoding(
        finding: ClinicalFinding
    ): Array<{ system: string; code: string; display: string }> {
        // If explicit code provided, use it
        if (finding.code && finding.codeSystem) {
            const system = finding.codeSystem === 'snomed'
                ? 'http://snomed.info/sct'
                : finding.codeSystem === 'loinc'
                    ? 'http://loinc.org'
                    : finding.codeSystem;

            return [{ system, code: finding.code, display: finding.name }];
        }

        // Try to match by name against known codes
        const normalized = finding.name.toLowerCase().replace(/\s+/g, '_');

        // Check SNOMED first
        const snomed = SNOMED_CODES[normalized];
        if (snomed) {
            return [{ system: 'http://snomed.info/sct', ...snomed }];
        }

        // Check LOINC
        const loinc = LOINC_CODES[normalized];
        if (loinc) {
            return [{ system: 'http://loinc.org', ...loinc }];
        }

        // Fuzzy match: check if any key is contained in the name
        for (const [key, value] of Object.entries(SNOMED_CODES)) {
            if (normalized.includes(key) || key.includes(normalized)) {
                return [{ system: 'http://snomed.info/sct', ...value }];
            }
        }

        // Fall back to a generic coding with just the text
        return [{ system: 'https://rapha.ltd/codes', code: normalized, display: finding.name }];
    }

    /**
     * Parse keeper quality tags into clinical findings.
     * 
     * Converts tags like "#DiabetesType2, #ClearLungs" into
     * structured ClinicalFinding objects that can be transformed
     * into FHIR resources.
     */
    parseQualityTags(tags: string): ClinicalFinding[] {
        return tags
            .split(',')
            .map(tag => tag.trim().replace('#', ''))
            .filter(Boolean)
            .map(tag => ({
                type: this.inferFindingType(tag),
                name: tag,
                dateRecorded: new Date().toISOString(),
            }));
    }

    /**
     * Infer the finding type from a tag name.
     * Used to route tags to the correct FHIR resource type.
     */
    private inferFindingType(tag: string): string {
        const normalized = tag.toLowerCase();

        // Check if it's a known diagnosis
        const diagnosisKeywords = ['diabetes', 'hypertension', 'asthma', 'copd', 'cancer', 'covid'];
        if (diagnosisKeywords.some(kw => normalized.includes(kw))) {
            return 'diagnosis';
        }

        // Check if it's a vital/observation
        const vitalKeywords = ['blood', 'pressure', 'glucose', 'cholesterol', 'hba1c', 'temperature'];
        if (vitalKeywords.some(kw => normalized.includes(kw))) {
            return 'lab_result';
        }

        // Default to observation (covers "ClearLungs", "Normal" etc.)
        return 'lab_result';
    }
}

// ============================================================
// Singleton Export
// ============================================================

export const fhirTransformer = new FhirTransformer();

// ============================================================
// Example Usage (for documentation)
// ============================================================

/**
 * @example
 * ```typescript
 * import { fhirTransformer } from './fhir.transformer';
 * 
 * const bundle = fhirTransformer.transform({
 *   patientAddress: '0xAbC...123',
 *   source: 'nhs.uk',
 *   proofHash: '0xdef...789',
 *   qualityTags: '#DiabetesType2, #ClearLungs',
 *   findings: [
 *     {
 *       type: 'lab_result',
 *       name: 'hba1c',
 *       value: 5.7,
 *       unit: '%',
 *       dateRecorded: '2026-02-01T00:00:00Z',
 *     },
 *     {
 *       type: 'diagnosis',
 *       name: 'Diabetes mellitus type 2',
 *       code: '44054006',
 *       codeSystem: 'snomed',
 *     },
 *   ],
 * });
 * 
 * // bundle is now a FHIR R4 JSON-LD object ready for:
 * // 1. IPFS storage (alongside encrypted data)
 * // 2. TEE enclave input (Compute-over-Data)
 * // 3. AI model vectorization pipeline
 * ```
 */
