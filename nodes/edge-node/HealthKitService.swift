import Foundation
import HealthKit

enum HealthKitError: Error {
    case healthDataNotAvailable
    case missingType(String)
    case unauthorized
}

class HealthKitService {
    static let shared = HealthKitService()
    let healthStore = HKHealthStore()
    
    private init() {}
    
    func requestAuthorization(completion: @escaping (Result<Bool, Error>) -> Void) {
        guard HKHealthStore.isHealthDataAvailable() else {
            completion(.failure(HealthKitError.healthDataNotAvailable))
            return
        }
        
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate),
              let sleepAnalysisType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            completion(.failure(HealthKitError.missingType("HeartRate or SleepAnalysis")))
            return
        }
        
        let readTypes: Set<HKObjectType> = [heartRateType, sleepAnalysisType]
        
        healthStore.requestAuthorization(toShare: nil, read: readTypes) { success, error in
            if let error = error {
                completion(.failure(error))
            } else {
                completion(.success(success))
            }
        }
    }
    
    func fetchLatestHeartRate(completion: @escaping (Result<Double?, Error>) -> Void) {
        guard let sampleType = HKSampleType.quantityType(forIdentifier: .heartRate) else {
            completion(.failure(HealthKitError.missingType("HeartRate")))
            return
        }
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(sampleType: sampleType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { query, samples, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            if let sample = samples?.first as? HKQuantitySample {
                let heartRateUnit = HKUnit.count().unitDivided(by: HKUnit.minute())
                let value = sample.quantity.doubleValue(for: heartRateUnit)
                completion(.success(value))
            } else {
                completion(.success(nil))
            }
        }
        
        healthStore.execute(query)
    }
    
    func fetchSleepAnalysis(completion: @escaping (Result<Double?, Error>) -> Void) {
        guard let sampleType = HKSampleType.categoryType(forIdentifier: .sleepAnalysis) else {
            completion(.failure(HealthKitError.missingType("SleepAnalysis")))
            return
        }
        
        // Fetch sleep data from the last 24 hours
        let endDate = Date()
        let startDate = Calendar.current.date(byAdding: .day, value: -1, to: endDate)
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let query = HKSampleQuery(sampleType: sampleType, predicate: predicate, limit: 10, sortDescriptors: [sortDescriptor]) { query, samples, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            // Calculate total hours of "inBed" or "asleep" from the result
            var totalSleepHours: Double = 0
            if let sleepSamples = samples as? [HKCategorySample] {
                for sample in sleepSamples {
                    if sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue || 
                       sample.value == HKCategoryValueSleepAnalysis.inBed.rawValue {
                        let duration = sample.endDate.timeIntervalSince(sample.startDate)
                        totalSleepHours += duration / 3600.0
                    }
                }
            }
            completion(.success(totalSleepHours))
        }
        
        healthStore.execute(query)
    }
}
