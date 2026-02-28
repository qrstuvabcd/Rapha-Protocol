
const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const networkName = hre.network.name;
    console.log("Network:", networkName);

    // 1. Deploy RaphaToken
    const RaphaToken = await hre.ethers.getContractFactory("RaphaToken");
    const raphaToken = await RaphaToken.deploy();
    await raphaToken.waitForDeployment();
    const raphaTokenAddress = await raphaToken.getAddress();
    console.log("RaphaToken deployed to:", raphaTokenAddress);

    // 2. Deploy MockUSDC (Always deploy mock for now to ensure flow works without needing real funds)
    // In production, we would switch this based on network
    const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
    const usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();
    const usdcAddress = await usdc.getAddress();
    console.log("MockUSDC deployed to:", usdcAddress);

    // 3. Deploy Factory
    const treasury = deployer.address;
    const computeNode = deployer.address;

    const RaphaBountyFactory = await hre.ethers.getContractFactory("RaphaBountyFactory");
    const factory = await RaphaBountyFactory.deploy(
        usdcAddress,
        raphaTokenAddress,
        treasury,
        computeNode
    );
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("RaphaBountyFactory deployed to:", factoryAddress);

    // 4. Create Test Pool
    const bountyAmount = hre.ethers.parseUnits("100", 6); // 100 USDC
    const maxUsers = 10;
    const totalBudget = bountyAmount * BigInt(maxUsers);
    const duration = 7 * 24 * 60 * 60; // 7 days

    // Approve factory to spend USDC
    const approveTx = await usdc.approve(factoryAddress, totalBudget);
    await approveTx.wait();
    console.log("Approved Factory to spend USDC");

    const createTx = await factory.createPool(
        "bafkreigh2akiscaildcqmtciz7fhmkcmwd2bmn5ln7e5j2j5y3cknm25ze",
        bountyAmount,
        maxUsers,
        duration
    );
    const receipt = await createTx.wait();

    // Find PoolCreated event to get address
    // This is a bit complex to parse from logs without interface sometimes, 
    // but we can query open pools from factory
    const activePools = await factory.getActivePools();
    const testPoolAddress = activePools[0];
    console.log("Test Pool Deployed to:", testPoolAddress);

    // 5. Add Deployer as Keeper on the Pool (for testing)
    const RaphaBountyPool = await hre.ethers.getContractFactory("RaphaBountyPool");
    const pool = RaphaBountyPool.attach(testPoolAddress);

    // Check if deployer is keeper (should be owner by default logic if passed in constructor? 
    // Wait, in Factory::createPool -> new RaphaBountyPool(..., msg.sender, ...)
    // In Pool constructor -> Ownable(msg.sender) -> factory is msg.sender? 
    // NO. 
    // RaphaBountyPool.sol: 
    // constructor(..., address _startup, ...) Ownable(msg.sender)
    // If Factory deploys it, `msg.sender` in constructor is the Factory!
    // So Factory is the Owner.
    // We need to fix this in the contract or add a function in Factory to manage pools?
    // Let's check RaphaBountyPool.sol again.

    // RaphaBountyPool.sol:
    // contract RaphaBountyPool is ..., Ownable { ... }
    // factory = msg.sender;

    // If Factory is owner, we can't call `addKeeper` directly from backend/deployer unless Factory exposes it.
    // Or we should pass the startup/deployer as the initial owner?
    // The User wanted `addKeeper`... 
    // Let's modify RaphaBountyPool so `_startup` (the user who created it) is also an owner or admin?
    // Or simpler: transfer ownership to `_startup` in constructor?
    // `transferOwnership(_startup)`

    // We will output the addresses first.

    const deploymentInfo = {
        network: networkName,
        raphaToken: raphaTokenAddress,
        usdc: usdcAddress,
        factory: factoryAddress,
        testPool: testPoolAddress
    };

    fs.writeFileSync("bounty-deployment.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved to bounty-deployment.json");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
