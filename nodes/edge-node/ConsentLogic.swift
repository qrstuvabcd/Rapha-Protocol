import Foundation
import Security

/// Represents the digital signature from the user's Secure Enclave approving computation.
struct NodeConsentSignature {
    let signatureAlgorithm: String
    let signatureData: String
    let timestamp: Date
    let epochID: UUID
}

class ConsentLogic {
    
    enum ConsentError: Error {
        case enclaveUnavailable
        case keyGenerationFailed
        case signingFailed
    }
    
    /// Generates a signature using the iPhone's Secure Enclave to authorize a compute epoch.
    /// This demonstrates cryptographic proof that the user device approved the federated ML step.
    /// - Parameter epochID: The ID of the training epoch being signed off.
    /// - Returns: A `NodeConsentSignature` wrapped in a `Result`.
    func authorizeComputeEpoch(epochID: UUID) -> Result<NodeConsentSignature, Error> {
        
        let tag = "com.rapha.protocol.consent.\(epochID.uuidString)".data(using: .utf8)!
        
        // Define access control for Secure Enclave
        var error: Unmanaged<CFError>?
        guard let accessControl = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            [.privateKeyUsage], // Requires FaceID/TouchID in a real app if .userPresence is passed
            &error
        ) else {
            return .failure(error!.takeRetainedValue() as Error)
        }
        
        let attributes: [String: Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeECSECPrimeRandom,
            kSecAttrKeySizeInBits as String: 256,
            kSecAttrTokenID as String: kSecAttrTokenIDSecureEnclave,
            kSecPrivateKeyAttrs as String: [
                kSecAttrIsPermanent as String: false,
                kSecAttrApplicationTag as String: tag,
                kSecAttrAccessControl as String: accessControl
            ]
        ]
        
        // Generate a new ephemeral key pair inside the Secure Enclave
        var privateKey: SecKey?
        let status = SecKeyGeneratePair(attributes as CFDictionary, nil, &privateKey)
        
        guard status == errSecSuccess, let key = privateKey else {
            return .failure(ConsentError.keyGenerationFailed)
        }
        
        // Prepare data to sign: The epoch ID and a consent string
        let contentToSign = "Authorize Rapha Compute Epoch: \(epochID.uuidString)"
        guard let dataToSign = contentToSign.data(using: .utf8) else {
            return .failure(ConsentError.signingFailed)
        }
        
        // Sign the data using the generated private key
        let algorithm: SecKeyAlgorithm = .ecdsaSignatureMessageX962SHA256
        guard SecKeyIsAlgorithmSupported(key, .sign, algorithm) else {
            return .failure(ConsentError.signingFailed)
        }
        
        var signError: Unmanaged<CFError>?
        guard let signature = SecKeyCreateSignature(key, algorithm, dataToSign as CFData, &signError) as Data? else {
            return .failure(signError!.takeRetainedValue() as Error)
        }
        
        let consentSignature = NodeConsentSignature(
            signatureAlgorithm: "ECDSA-P256",
            signatureData: signature.base64EncodedString(),
            timestamp: Date(),
            epochID: epochID
        )
        
        return .success(consentSignature)
    }
}
