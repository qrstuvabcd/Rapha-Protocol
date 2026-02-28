// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RaphaAccountFactory
 * @author Rapha Chain - ERC-4337 Account Abstraction
 * @notice Factory for deploying patient smart accounts
 * @dev Deployed at genesis address 0x8000000000000000000000000000000000000005
 * 
 * Patient Smart Accounts enable:
 * 1. Gasless transactions via RaphaPaymaster sponsorship
 * 2. Social recovery for lost keys
 * 3. Batch operations for efficiency
 * 4. Time-locked access grants
 */
contract RaphaAccountFactory {
    // ============ Constants ============
    
    /// @notice System contract identifier
    bytes32 public constant SYSTEM_ID = keccak256("RAPHA_ACCOUNT_FACTORY_V1");
    
    /// @notice Paymaster address for gasless ops
    address public constant PAYMASTER = 0x8000000000000000000000000000000000000004;

    // ============ State Variables ============

    /// @notice Mapping of EOA to their smart account
    mapping(address => address) public accounts;
    
    /// @notice Mapping of smart account to its EOA owner
    mapping(address => address) public accountOwners;
    
    /// @notice Total accounts created
    uint256 public accountCount;
    
    /// @notice Account implementation template
    address public accountImplementation;
    
    /// @notice Owner for upgrades
    address public owner;

    // ============ Events ============

    event AccountCreated(
        address indexed eoa,
        address indexed account,
        bytes32 initialConditionId
    );
    
    event AccountImplementationUpdated(address indexed newImplementation);

    // ============ Constructor ============

    constructor() {
        owner = msg.sender;
        // Deploy initial account implementation
        accountImplementation = address(new RaphaAccount(address(this)));
    }

    // ============ Core Functions ============

    /**
     * @notice Deploy a new patient smart account
     * @param patientEOA The patient's EOA address
     * @param initialConditionId Initial TACo condition for the account
     * @return account Address of the deployed smart account
     */
    function createAccount(
        address patientEOA,
        bytes32 initialConditionId
    ) external returns (address account) {
        require(patientEOA != address(0), "Invalid EOA");
        require(accounts[patientEOA] == address(0), "Account exists");
        
        // Create minimal proxy (EIP-1167)
        bytes memory bytecode = _getProxyBytecode(accountImplementation);
        bytes32 salt = keccak256(abi.encodePacked(patientEOA, initialConditionId));
        
        assembly {
            account := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
            if iszero(extcodesize(account)) {
                revert(0, 0)
            }
        }
        
        // Initialize the account
        RaphaAccount(payable(account)).initialize(patientEOA, initialConditionId);
        
        // Track accounts
        accounts[patientEOA] = account;
        accountOwners[account] = patientEOA;
        accountCount++;
        
        emit AccountCreated(patientEOA, account, initialConditionId);
        
        return account;
    }

    /**
     * @notice Get the counterfactual address for an account
     * @param patientEOA The patient's EOA address
     * @param initialConditionId Initial TACo condition
     * @return The address the account would be deployed to
     */
    function getAddress(
        address patientEOA,
        bytes32 initialConditionId
    ) external view returns (address) {
        bytes memory bytecode = _getProxyBytecode(accountImplementation);
        bytes32 salt = keccak256(abi.encodePacked(patientEOA, initialConditionId));
        
        return address(uint160(uint256(keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        ))));
    }

    /**
     * @notice Check if an account exists for an EOA
     * @param eoa EOA to check
     * @return True if account exists
     */
    function hasAccount(address eoa) external view returns (bool) {
        return accounts[eoa] != address(0);
    }

    // ============ Admin Functions ============

    /**
     * @notice Update account implementation (for upgrades)
     * @param newImplementation New implementation address
     */
    function setAccountImplementation(address newImplementation) external {
        require(msg.sender == owner, "Only owner");
        require(newImplementation != address(0), "Invalid address");
        accountImplementation = newImplementation;
        emit AccountImplementationUpdated(newImplementation);
    }

    // ============ Internal Functions ============

    /**
     * @notice Generate minimal proxy bytecode (EIP-1167)
     */
    function _getProxyBytecode(address implementation) internal pure returns (bytes memory) {
        return abi.encodePacked(
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            implementation,
            hex"5af43d82803e903d91602b57fd5bf3"
        );
    }
}

/**
 * @title RaphaAccount
 * @notice Patient smart account implementation
 */
contract RaphaAccount {
    // ============ State Variables ============
    
    address public factory;
    address public owner;
    bytes32 public tacoConditionId;
    bool public initialized;
    
    /// @notice Social recovery guardians (2-of-3)
    address[3] public guardians;
    uint256 public guardianCount;
    
    /// @notice Recovery requests
    mapping(bytes32 => uint256) public recoveryVotes;
    
    /// @notice Access grants with time locks
    struct AccessGrant {
        address grantee;
        uint256 expiresAt;
        bool active;
    }
    mapping(bytes32 => AccessGrant) public accessGrants;

    // ============ Events ============
    
    event Executed(address indexed target, uint256 value, bytes data);
    event GuardianAdded(address indexed guardian);
    event RecoveryInitiated(address indexed newOwner, bytes32 requestId);
    event RecoveryCompleted(address indexed newOwner);
    event AccessGranted(bytes32 indexed grantId, address indexed grantee, uint256 expiresAt);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    // ============ Constructor ============

    constructor(address _factory) {
        factory = _factory;
    }

    // ============ Initialization ============

    function initialize(address _owner, bytes32 _conditionId) external onlyFactory {
        require(!initialized, "Already initialized");
        owner = _owner;
        tacoConditionId = _conditionId;
        initialized = true;
    }

    // ============ ERC-4337 Interface ============

    /**
     * @notice Execute a transaction (called by EntryPoint)
     * @param target Target contract
     * @param value ETH value
     * @param data Call data
     */
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external onlyOwner returns (bytes memory result) {
        (bool success, bytes memory returnData) = target.call{value: value}(data);
        require(success, "Execution failed");
        emit Executed(target, value, data);
        return returnData;
    }

    /**
     * @notice Execute batch transactions
     * @param targets Target contracts
     * @param values ETH values
     * @param datas Call data array
     */
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external onlyOwner {
        require(targets.length == values.length && values.length == datas.length, "Length mismatch");
        
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success,) = targets[i].call{value: values[i]}(datas[i]);
            require(success, "Batch execution failed");
        }
    }

    // ============ Social Recovery ============

    /**
     * @notice Add a recovery guardian
     * @param guardian Guardian address
     */
    function addGuardian(address guardian) external onlyOwner {
        require(guardianCount < 3, "Max 3 guardians");
        require(guardian != address(0) && guardian != owner, "Invalid guardian");
        
        guardians[guardianCount] = guardian;
        guardianCount++;
        
        emit GuardianAdded(guardian);
    }

    /**
     * @notice Initiate recovery to new owner (requires 2 guardians)
     * @param newOwner New owner address
     */
    function initiateRecovery(address newOwner) external {
        require(newOwner != address(0), "Invalid new owner");
        require(_isGuardian(msg.sender), "Not a guardian");
        
        bytes32 requestId = keccak256(abi.encodePacked(newOwner, block.timestamp));
        recoveryVotes[requestId]++;
        
        emit RecoveryInitiated(newOwner, requestId);
        
        if (recoveryVotes[requestId] >= 2) {
            owner = newOwner;
            delete recoveryVotes[requestId];
            emit RecoveryCompleted(newOwner);
        }
    }

    // ============ Access Management ============

    /**
     * @notice Grant time-locked access to a provider
     * @param grantee Provider address
     * @param duration Duration in seconds
     * @return grantId Grant identifier
     */
    function grantAccess(
        address grantee,
        uint256 duration
    ) external onlyOwner returns (bytes32 grantId) {
        grantId = keccak256(abi.encodePacked(grantee, block.timestamp));
        
        accessGrants[grantId] = AccessGrant({
            grantee: grantee,
            expiresAt: block.timestamp + duration,
            active: true
        });
        
        emit AccessGranted(grantId, grantee, block.timestamp + duration);
        return grantId;
    }

    /**
     * @notice Revoke access grant
     * @param grantId Grant to revoke
     */
    function revokeAccess(bytes32 grantId) external onlyOwner {
        accessGrants[grantId].active = false;
    }

    // ============ View Functions ============

    function _isGuardian(address addr) internal view returns (bool) {
        for (uint256 i = 0; i < guardianCount; i++) {
            if (guardians[i] == addr) return true;
        }
        return false;
    }

    function isAccessValid(bytes32 grantId) external view returns (bool) {
        AccessGrant storage grant = accessGrants[grantId];
        return grant.active && grant.expiresAt > block.timestamp;
    }

    // Accept RAPHA
    receive() external payable {}
}
