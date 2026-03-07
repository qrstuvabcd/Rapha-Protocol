import Foundation
import CoreML

/// Struct representing the local training loop inputs and outputs.
struct ComputeEpochResult {
    let updatedWeights: [Double]
    let epochID: UUID
    let sampleSize: Int
    let dataHash: String
}

class OnDeviceTraining {
    
    /// Retrieves live biometric data from HealthKit and performs an on-device mock ML update.
    /// - Parameters:
    ///   - initialWeights: The weights supplied from the global federation.
    ///   - completion: Callback providing the results of the local training step.
    func performLocalTrainingEpoch(initialWeights: [Double], completion: @escaping (Result<ComputeEpochResult, Error>) -> Void) {
        
        let healthKitService = HealthKitService.shared
        
        // 1. Fetch live metrics
        healthKitService.fetchLatestHeartRate { heartRateResult in
            switch heartRateResult {
            case .success(let hrValue):
                let heartRate = hrValue ?? 72.0 // Fallback for mocking if nil
                
                healthKitService.fetchSleepAnalysis { sleepResult in
                    switch sleepResult {
                    case .success(let sleepValue):
                        let sleepHours = sleepValue ?? 7.0 // Fallback
                        
                        // 2. Mock model training logic
                        self.mockModelUpdate(
                            currentWeights: initialWeights,
                            heartRate: heartRate,
                            sleepHours: sleepHours,
                            completion: completion
                        )
                        
                    case .failure(let error):
                        completion(.failure(error))
                    }
                }
                
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
    
    private func mockModelUpdate(currentWeights: [Double], heartRate: Double, sleepHours: Double, completion: @escaping (Result<ComputeEpochResult, Error>) -> Void) {
        // Run as a background task
        DispatchQueue.global(qos: .userInitiated).async {
            // Apply a small mock gradient step based on the provided biometric baseline
            let learningRate = 0.005
            
            // Artificial normalisation logic
            let hrNormalized = (heartRate - 60.0) / 40.0
            let sleepNormalized = (sleepHours - 8.0) / 4.0
            let combinedFactor = (hrNormalized + sleepNormalized) / 2.0
            
            var updatedWeights = [Double]()
            for weight in currentWeights {
                // Introducing a minor mock shift simulating learning from this user's node
                let shift = combinedFactor * learningRate * Double.random(in: -1...1)
                updatedWeights.append(weight + shift)
            }
            
            // Create a pseudo hash of the local data shape to simulate ZK data proof
            let dataShapeStr = "hr:\(heartRate),slp:\(sleepHours)"
            let dataHash = self.sha256(dataShapeStr)
            
            let result = ComputeEpochResult(
                updatedWeights: updatedWeights,
                epochID: UUID(),
                sampleSize: 1, // Single patient user session
                dataHash: dataHash
            )
            
            DispatchQueue.main.async {
                completion(.success(result))
            }
        }
    }
    
    private func sha256(_ input: String) -> String {
        // Mock SHA-256 for compilation simplicity
        // Note: Production uses CryptoKit `SHA256.hash(data: Data(input.utf8))`
        var hash = 5381
        for char in input.unicodeScalars {
            hash = ((hash << 5) &+ hash) &+ Int(char.value)
        }
        return String(format: "%08x", hash)
    }
}
