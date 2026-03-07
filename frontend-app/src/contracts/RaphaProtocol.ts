import { ethers } from 'ethers';

// Official Polygon Mainnet Addresses
export const RAPHA_REGISTRY_ADDRESS = "0x5468B7d5F4A52d00b4192874598b620e53a0CcA6"; // Registry
export const RAPHA_ESCROW_ADDRESS = "0x5468B7d5F4A52d00b4192874598b620e53a0CcA6"; // Linked Registry/Escrow
export const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

export const RAPHA_ABI = [
    // Escrow Functions
    "function fundJob(string jobId, uint256 amount) external",
    "function settleJob(string jobId, string zkProof, address nodeAddress) external",
    "function jobs(string) external view returns (address funder, uint256 amount, bool isSettled)",
    "event JobFunded(string jobId, address funder, uint256 amount)",
    "event JobSettled(string jobId, address nodeAddress, uint256 nodePayout, uint256 protocolFee, string zkProof)",

    // Registry / Edge Functions
    "function registerBiometricRoot(bytes32 root) external",
    "function biometricRoots(address) external view returns (bytes32)",
    "event BiometricRootRegistered(address indexed user, bytes32 root)"
];

export const IERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address recipient, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)"
];

/**
 * Helper to get a read-only provider for Polygon Mainnet
 */
export const getPolygonProvider = () => {
    return new ethers.JsonRpcProvider("https://polygon-rpc.com");
};

/**
 * Helper to get the Rapha Protocol contract instance
 */
export const getRaphaContract = (signerOrProvider: ethers.Signer | ethers.Provider) => {
    return new ethers.Contract(RAPHA_REGISTRY_ADDRESS, RAPHA_ABI, signerOrProvider);
};
