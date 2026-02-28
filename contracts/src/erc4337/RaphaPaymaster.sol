// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RaphaPaymaster
 * @author Rapha Chain - ERC-4337 Account Abstraction
 * @notice Gasless transaction sponsorship for Essential Patient Transactions
 * @dev Deployed at genesis address 0x8000000000000000000000000000000000000004
 * 
 * The Gasless Bridge:
 * - Essential Patient Transactions are sponsored by the research treasury
 * - Patients never need to hold $RAPHA to access their health data
 * - Funded by the 20% DeSci tax from bounty completions
 * 
 * Essential Patient Transactions:
 * 1. Viewing medical results
 * 2. Updating prescriptions
 * 3. Granting access to providers
 * 4. Revoking access
 * 5. Registering new records (with dual signature)
 */
contract RaphaPaymaster {
    // ============ Constants ============
    
    /// @notice System contract identifier
    bytes32 public constant SYSTEM_ID = keccak256("RAPHA_PAYMASTER_V1");
    
    /// @notice RaphaCoreRegistry address
    address public constant CORE_REGISTRY = 0x8000000000000000000000000000000000000001;
    
    /// @notice EntryPoint contract (ERC-4337 standard)
    address public entryPoint;
    
    /// @notice Maximum gas cost to sponsor per transaction
    uint256 public constant MAX_SPONSORED_GAS = 500000;
    
    /// @notice Daily spending limit per patient
    uint256 public constant DAILY_LIMIT_PER_PATIENT = 0.1 ether; // 0.1 RAPHA

    // ============ Structs ============

    /// @notice Essential Patient Transaction types
    enum EssentialTxType {
        VIEW_RESULTS,
        UPDATE_PRESCRIPTION,
        GRANT_ACCESS,
        REVOKE_ACCESS,
        REGISTER_RECORD,
        UPDATE_CONDITION,
        DEACTIVATE_RECORD
    }

    /// @notice Packed user operation (simplified for demo)
    struct UserOperation {
        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        uint256 callGasLimit;
        uint256 verificationGasLimit;
        uint256 preVerificationGas;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        bytes paymasterAndData;
        bytes signature;
    }

    // ============ State Variables ============

    /// @notice Daily spending tracker for patients
    mapping(address => mapping(uint256 => uint256)) public dailySpending;
    
    /// @notice Owner for admin functions
    address public owner;
    
    /// @notice Whitelisted function selectors for sponsorship
    mapping(bytes4 => EssentialTxType) public sponsoredSelectors;
    
    /// @notice Whether a selector is sponsored
    mapping(bytes4 => bool) public isSponsoredSelector;

    // ============ Events ============

    event TransactionSponsored(
        address indexed patient,
        bytes4 indexed selector,
        uint256 gasCost,
        EssentialTxType txType
    );
    
    event FundsDeposited(address indexed depositor, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == entryPoint, "Only EntryPoint");
        _;
    }

    // ============ Constructor ============

    constructor(address _entryPoint) {
        require(_entryPoint != address(0), "Invalid EntryPoint");
        entryPoint = _entryPoint;
        owner = msg.sender;
        
        // Register RaphaCoreRegistry function selectors as sponsored
        _registerSponsoredSelectors();
    }

    // ============ ERC-4337 Interface ============

    /**
     * @notice Validate if user operation should be sponsored
     * @param userOp The user operation to validate
     * @param userOpHash Hash of the user operation
     * @param maxCost Maximum cost of the operation
     * @return context Context for postOp
     * @return validationData 0 if valid, 1 if invalid
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external onlyEntryPoint returns (bytes memory context, uint256 validationData) {
        // Check if callData has valid selector
        require(userOp.callData.length >= 4, "Invalid callData");
        
        bytes4 selector = bytes4(userOp.callData[:4]);
        
        // Check if this is an Essential Patient Transaction
        if (!isSponsoredSelector[selector]) {
            // Return 1 to indicate validation failure (not sponsored)
            return ("", 1);
        }
        
        // Check gas limits
        uint256 estimatedGas = userOp.callGasLimit + 
                               userOp.verificationGasLimit + 
                               userOp.preVerificationGas;
        require(estimatedGas <= MAX_SPONSORED_GAS, "Gas too high for sponsorship");
        
        // Check daily limit
        uint256 today = block.timestamp / 1 days;
        uint256 dailyUsed = dailySpending[userOp.sender][today];
        require(dailyUsed + maxCost <= DAILY_LIMIT_PER_PATIENT, "Daily limit exceeded");
        
        // Update daily spending
        dailySpending[userOp.sender][today] = dailyUsed + maxCost;
        
        // Return context with transaction details
        context = abi.encode(userOp.sender, selector, maxCost);
        validationData = 0; // Valid
        
        return (context, validationData);
    }

    /**
     * @notice Called after user operation execution
     * @param mode 0 = success, 1 = revert with reason, 2 = out of gas
     * @param context Context from validatePaymasterUserOp
     * @param actualGasCost Actual gas cost of the operation
     */
    function postOp(
        uint8 mode,
        bytes calldata context,
        uint256 actualGasCost
    ) external onlyEntryPoint {
        if (context.length == 0) return;
        
        (address patient, bytes4 selector,) = abi.decode(
            context, 
            (address, bytes4, uint256)
        );
        
        EssentialTxType txType = sponsoredSelectors[selector];
        
        emit TransactionSponsored(patient, selector, actualGasCost, txType);
    }

    // ============ Deposit/Withdraw ============

    /**
     * @notice Deposit funds to sponsor transactions
     * @dev Anyone can deposit, but typically funded by research treasury
     */
    function deposit() external payable {
        require(msg.value > 0, "Must deposit > 0");
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw funds (owner only)
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
        emit FundsWithdrawn(to, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Check if a function selector is sponsored
     * @param selector 4-byte function selector
     * @return sponsored True if transactions with this selector are sponsored
     */
    function isEssentialPatientTx(bytes4 selector) external view returns (bool sponsored) {
        return isSponsoredSelector[selector];
    }

    /**
     * @notice Get remaining daily allowance for a patient
     * @param patient Patient address
     * @return remaining Remaining RAPHA for today
     */
    function getDailyAllowance(address patient) external view returns (uint256 remaining) {
        uint256 today = block.timestamp / 1 days;
        uint256 used = dailySpending[patient][today];
        if (used >= DAILY_LIMIT_PER_PATIENT) return 0;
        return DAILY_LIMIT_PER_PATIENT - used;
    }

    /**
     * @notice Get current balance available for sponsorship
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ============ Admin Functions ============

    /**
     * @notice Register a new sponsored selector
     * @param selector Function selector
     * @param txType Transaction type
     */
    function addSponsoredSelector(
        bytes4 selector, 
        EssentialTxType txType
    ) external onlyOwner {
        sponsoredSelectors[selector] = txType;
        isSponsoredSelector[selector] = true;
    }

    /**
     * @notice Remove a sponsored selector
     * @param selector Function selector to remove
     */
    function removeSponsoredSelector(bytes4 selector) external onlyOwner {
        delete sponsoredSelectors[selector];
        isSponsoredSelector[selector] = false;
    }

    /**
     * @notice Update EntryPoint address
     * @param newEntryPoint New EntryPoint contract
     */
    function setEntryPoint(address newEntryPoint) external onlyOwner {
        require(newEntryPoint != address(0), "Invalid address");
        entryPoint = newEntryPoint;
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    // ============ Internal Functions ============

    /**
     * @notice Register default sponsored selectors from RaphaCoreRegistry
     */
    function _registerSponsoredSelectors() internal {
        // RaphaCoreRegistry selectors
        // getRecord(bytes32)
        bytes4 getRecord = bytes4(keccak256("getRecord(bytes32)"));
        sponsoredSelectors[getRecord] = EssentialTxType.VIEW_RESULTS;
        isSponsoredSelector[getRecord] = true;
        
        // getPatientRecords(address)
        bytes4 getPatientRecords = bytes4(keccak256("getPatientRecords(address)"));
        sponsoredSelectors[getPatientRecords] = EssentialTxType.VIEW_RESULTS;
        isSponsoredSelector[getPatientRecords] = true;
        
        // updateCondition(bytes32,bytes32)
        bytes4 updateCondition = bytes4(keccak256("updateCondition(bytes32,bytes32)"));
        sponsoredSelectors[updateCondition] = EssentialTxType.UPDATE_CONDITION;
        isSponsoredSelector[updateCondition] = true;
        
        // deactivateRecord(bytes32)
        bytes4 deactivateRecord = bytes4(keccak256("deactivateRecord(bytes32)"));
        sponsoredSelectors[deactivateRecord] = EssentialTxType.DEACTIVATE_RECORD;
        isSponsoredSelector[deactivateRecord] = true;
        
        // registerRecordWithDualSignature(...)
        bytes4 registerWithDual = bytes4(keccak256(
            "registerRecordWithDualSignature(string,string,string,address,bytes32,bytes32,bytes,bytes)"
        ));
        sponsoredSelectors[registerWithDual] = EssentialTxType.REGISTER_RECORD;
        isSponsoredSelector[registerWithDual] = true;
    }

    // Accept RAPHA deposits
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}
