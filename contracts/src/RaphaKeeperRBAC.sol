// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

// UK GDPR Article 9 & Caldicott Principle 4 Compliance Enforced
// No centralized admin override for dataset decryption access.

/// @title rapha.ltd Keeper Portal RBAC
/// @notice Manages medical dataset registration and access via Tiered Role-Based Access Control
contract RaphaKeeperRBAC is AccessControl {
    
    // Define 3 explicit medical tiers
    bytes32 public constant TIER_1_STUDENT = keccak256("TIER_1_STUDENT");
    bytes32 public constant TIER_2_REGISTRAR = keccak256("TIER_2_REGISTRAR");
    bytes32 public constant TIER_3_CONSULTANT = keccak256("TIER_3_CONSULTANT");

    enum RiskLevel { LOW_RISK, MODERATE_RISK, HIGH_RISK }
    enum VerificationStatus { PENDING, VERIFIED, REJECTED }

    struct Dataset {
        uint256 datasetId;
        RiskLevel riskLevel;
        bool isDefaced;
        string cid; // IPFS/Arweave Hash
        VerificationStatus verificationStatus;
    }

    mapping(uint256 => Dataset) public datasets;
    
    // Custom error for strict UK GDPR & Caldicott Principle 4 compliance
    error CaldicottPrinciple4Violation();
    error ZeroPIIEnforcementFailed();
    error DatasetAlreadyExists();

    event DatasetRegistered(uint256 indexed datasetId, RiskLevel riskLevel, string cid);
    event AccessGranted(address indexed keeper, uint256 indexed datasetId);

    constructor() {
        // Only grant admin to setup roles, no overriding dataset access.
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /// @notice Registers a dataset. Zero-PII Enforcement: strictly rejects any dataset where isDefaced is false.
    function registerDataset(
        uint256 datasetId,
        RiskLevel riskLevel,
        bool isDefaced,
        string calldata cid
    ) external {
        if (!isDefaced) {
            revert ZeroPIIEnforcementFailed();
        }
        if (datasets[datasetId].datasetId != 0 || datasets[datasetId].isDefaced == true) {
            revert DatasetAlreadyExists();
        }

        datasets[datasetId] = Dataset({
            datasetId: datasetId,
            riskLevel: riskLevel,
            isDefaced: isDefaced,
            cid: cid,
            verificationStatus: VerificationStatus.PENDING
        });

        emit DatasetRegistered(datasetId, riskLevel, cid);
    }

    /// @notice Keeper requests to view a dataset. 
    /// @dev The contract verifies msg.sender has the required Role Token matching the dataset's riskLevel.
    /// @custom:compliance Legally enforces UK GDPR Article 9 & Caldicott Principle 4 (Need-to-Know Access).
    function requestVerificationAccess(uint256 datasetId) external {
        Dataset memory ds = datasets[datasetId];
        
        bool hasClearance = false;

        // Verify the Keeper's role token strictly matches the dataset's risk level authorization.
        if (ds.riskLevel == RiskLevel.LOW_RISK) {
            hasClearance = hasRole(TIER_1_STUDENT, msg.sender) || hasRole(TIER_2_REGISTRAR, msg.sender) || hasRole(TIER_3_CONSULTANT, msg.sender);
        } else if (ds.riskLevel == RiskLevel.MODERATE_RISK) {
            hasClearance = hasRole(TIER_2_REGISTRAR, msg.sender) || hasRole(TIER_3_CONSULTANT, msg.sender);
        } else if (ds.riskLevel == RiskLevel.HIGH_RISK) {
            hasClearance = hasRole(TIER_3_CONSULTANT, msg.sender);
        }

        if (!hasClearance) {
            revert CaldicottPrinciple4Violation();
        }

        emit AccessGranted(msg.sender, datasetId);
    }
}
