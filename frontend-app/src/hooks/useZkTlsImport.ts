/**
 * useZkTlsImport — React Hook for ZK-TLS Data Import
 * 
 * Manages the complete lifecycle of a ZK-TLS verified data import:
 * idle → generating → polling → verifying → complete
 * 
 * Uses the ZkTlsService to create Reclaim Protocol proof sessions,
 * generates QR codes for user scanning, and polls for proof completion.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
    zkTlsService,
    ZkTlsService,
    type VerifiedClaim,
    type HealthcareProvider,
    HEALTHCARE_PROVIDERS,
} from '../services/zkTls.service';

// ============================================================
// Types
// ============================================================

export type ZkTlsStatus =
    | 'idle'          // No import in progress
    | 'generating'    // Building proof request via SDK
    | 'polling'       // QR displayed, waiting for user to scan & prove
    | 'verifying'     // Proof received, extracting + validating claim
    | 'complete'      // Claim verified, ready for encryption + upload
    | 'error';        // Something went wrong

export interface UseZkTlsImportReturn {
    /** Current state of the import flow */
    status: ZkTlsStatus;
    /** URL to render as QR code — null until 'polling' state */
    requestUrl: string | null;
    /** Verified claim data — null until 'complete' state */
    verifiedClaim: VerifiedClaim | null;
    /** Selected healthcare provider info */
    selectedProvider: HealthcareProvider | null;
    /** Error message if status is 'error' */
    error: string | null;
    /** Whether the Reclaim SDK is properly configured with credentials */
    isConfigured: boolean;
    /** List of supported healthcare providers */
    providers: HealthcareProvider[];

    // Actions
    /** Start the ZK-TLS import flow for a given provider */
    startImport: (providerId: string) => Promise<void>;
    /** Reset the hook to idle state */
    reset: () => void;
}

// ============================================================
// Hook
// ============================================================

export function useZkTlsImport(
    service: ZkTlsService = zkTlsService
): UseZkTlsImportReturn {
    const [status, setStatus] = useState<ZkTlsStatus>('idle');
    const [requestUrl, setRequestUrl] = useState<string | null>(null);
    const [verifiedClaim, setVerifiedClaim] = useState<VerifiedClaim | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<HealthcareProvider | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Ref to hold the cleanup function from session polling
    const stopListeningRef = useRef<(() => void) | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopListeningRef.current?.();
        };
    }, []);

    /**
     * Start the ZK-TLS import flow.
     * 
     * State machine: idle → generating → polling → verifying → complete
     */
    const startImport = useCallback(async (providerId: string) => {
        // Look up the provider
        const provider = service.getProvider(providerId);
        if (!provider) {
            setError(`Unknown provider: ${providerId}`);
            setStatus('error');
            return;
        }

        setSelectedProvider(provider);
        setError(null);
        setVerifiedClaim(null);
        setRequestUrl(null);

        // --- Phase 1: Generating ---
        setStatus('generating');

        try {
            // Start a Reclaim session with callbacks
            const { requestUrl: url, stopListening } = await service.startSession(
                provider.providerId,
                // onSuccess: proof received
                (proof) => {
                    // --- Phase 3: Verifying ---
                    setStatus('verifying');

                    try {
                        const claim = service.extractVerifiedClaim(proof, provider.domain);
                        setVerifiedClaim(claim);
                        setStatus('complete');
                    } catch (verifyError) {
                        setError(
                            verifyError instanceof Error
                                ? verifyError.message
                                : 'Claim verification failed'
                        );
                        setStatus('error');
                    }
                },
                // onFailure
                (sessionError) => {
                    setError(sessionError.message);
                    setStatus('error');
                }
            );

            stopListeningRef.current = stopListening;

            // --- Phase 2: Polling ---
            setRequestUrl(url);
            setStatus('polling');
        } catch (initError) {
            setError(
                initError instanceof Error
                    ? initError.message
                    : 'Failed to initialize ZK-TLS session'
            );
            setStatus('error');
        }
    }, [service]);

    /**
     * Reset hook back to idle state.
     */
    const reset = useCallback(() => {
        stopListeningRef.current?.();
        stopListeningRef.current = null;

        setStatus('idle');
        setRequestUrl(null);
        setVerifiedClaim(null);
        setSelectedProvider(null);
        setError(null);
    }, []);

    return {
        status,
        requestUrl,
        verifiedClaim,
        selectedProvider,
        error,
        isConfigured: service.isConfigured(),
        providers: HEALTHCARE_PROVIDERS,
        startImport,
        reset,
    };
}
