import { ethers } from 'ethers';

// ABI to interact with the RaphaKeeperRBAC contract
const RaphaKeeperRBAC_ABI = [
    "function datasets(uint256) view returns (uint256 datasetId, uint8 riskLevel, bool isDefaced, string cid, uint8 verificationStatus)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function TIER_1_STUDENT() view returns (bytes32)",
    "function TIER_2_REGISTRAR() view returns (bytes32)",
    "function TIER_3_CONSULTANT() view returns (bytes32)"
];

/**
 * KeeperAuthMiddleware coordinates between RaphaKeeperRBAC and Threshold TACo.
 * Strict RBAC rules apply, preventing any generic admin overrides.
 */
export class KeeperAuthMiddleware {
    private provider: ethers.Provider;
    private contract: ethers.Contract;

    constructor(rpcUrl: string, contractAddress: string) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.contract = new ethers.Contract(contractAddress, RaphaKeeperRBAC_ABI, this.provider);
    }

    /**
     * Bridges the on-chain requestVerificationAccess() logic to generate a Threshold TACo decryption condition.
     * Generates a decryption condition binding to the Keeper's wallet and specific Role Token.
     */
    public async generateTACoCondition(keeperAddress: string, datasetId: number): Promise<any> {
        // Read on-chain state to get dataset risk level
        const dataset = await this.contract.datasets(datasetId);

        // Zero-PII Enforcement in middleware before condition generation
        if (!dataset.isDefaced) {
            throw new Error("Zero-PII Enforcement Failed: Dataset is not defaced. Decryption aborted.");
        }

        const riskLevel = dataset.riskLevel;

        // Fetch Tier Constants
        const TIER_1 = await this.contract.TIER_1_STUDENT();
        const TIER_2 = await this.contract.TIER_2_REGISTRAR();
        const TIER_3 = await this.contract.TIER_3_CONSULTANT();

        // Check clearance based on Caldicott Principle 4
        let hasClearance = false;
        let requiredRoles: string[] = [];

        if (riskLevel === 0n) { // LOW_RISK
            requiredRoles = [TIER_1, TIER_2, TIER_3];
            hasClearance = await this.checkAnyRole(keeperAddress, requiredRoles);
        } else if (riskLevel === 1n) { // MODERATE_RISK
            requiredRoles = [TIER_2, TIER_3];
            hasClearance = await this.checkAnyRole(keeperAddress, requiredRoles);
        } else if (riskLevel === 2n) { // HIGH_RISK
            requiredRoles = [TIER_3];
            hasClearance = await this.checkAnyRole(keeperAddress, requiredRoles);
        }

        if (!hasClearance) {
            throw new Error("Caldicott Principle 4 Violation: Keeper lacks sufficient Role Token clearance.");
        }

        // Generate the Threshold TACo Decryption Condition
        // Condition strictly binds the decryption to the required Role Token on-chain via EVM call condition
        const condition = this.createThresholdCondition(keeperAddress, requiredRoles, this.contract.target as string);
        return condition;
    }

    private async checkAnyRole(keeperAddress: string, roles: string[]): Promise<boolean> {
        for (const role of roles) {
            const hasRole = await this.contract.hasRole(role, keeperAddress);
            if (hasRole) return true;
        }
        return false;
    }

    /**
     * Creates an EVM-based access control condition for Threshold TACo.
     * It ensures only the specified keeper address possessing valid Role Tokens can decrypt the CID.
     */
    private createThresholdCondition(keeperAddress: string, allowedRoles: string[], contractAddress: string): any {
        // Note: For Threshold TACo or Lit Protocol, constructing EVM conditions usually verifies the smart contract `hasRole` call returns `true`.
        // Below is an abstraction of the condition binding it strictly to the specific `hasRole` check on RaphaKeeperRBAC.
        return {
            contractAddress: contractAddress,
            standardContractType: "Custom",
            chain: "polygon", // Polygon CDK 
            method: "hasRole",
            parameters: [allowedRoles[0], ":userAddress"], // Checks the required Role Token
            returnValueTest: {
                comparator: "=",
                value: "true"
            },
            // The requester MUST be the specific Keeper
            userAddressCondition: {
                userAddress: keeperAddress
            }
        };
    }
}
