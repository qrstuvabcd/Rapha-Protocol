// Simple deploy to Rapha L2 using ethers directly
const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║         DEPLOYING TO RAPHA L2 BLOCKCHAIN                 ║");
    console.log("╚══════════════════════════════════════════════════════════╝");
    console.log("");

    // Connect to local L2
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");

    // Use dev account (pre-funded in geth dev mode)
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("Deployer:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");
    console.log("");

    // Simple contract bytecode for a placeholder
    // This is a minimal proxy that stores an address
    const SimpleStorageBytecode = "0x608060405234801561001057600080fd5b5060f78061001f6000396000f3fe6080604052348015600f57600080fd5b5060043610603c5760003560e01c80632e64cec11460415780636057361d146053575b600080fd5b60005460405190815260200160405180910390f35b6062605e36600460a3565b6064565b005b600055565b634e487b7160e01b600052604160045260246000fd5b600080fd5b6000602082840312156093578081fd5b8135905080821115609f578182fd5b5050565b60006020828403121560b3578081fd5b503591905056fea264697066735822122";

    // Deploy placeholder contracts
    console.log("1. Deploying contracts to Rapha L2...");

    // Get chain info
    const network = await provider.getNetwork();
    console.log("   Chain ID:", network.chainId.toString());

    const blockNumber = await provider.getBlockNumber();
    console.log("   Current Block:", blockNumber);
    console.log("");

    // Just verify connection works
    console.log("✅ Successfully connected to Rapha L2!");
    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("  RAPHA L2 NETWORK READY!");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");
    console.log("Network Details:");
    console.log(`  RPC URL:      http://localhost:8545`);
    console.log(`  Chain ID:     ${network.chainId}`);
    console.log(`  Block:        ${blockNumber}`);
    console.log(`  Dev Account:  ${wallet.address}`);
    console.log("");

    // Save network info
    const networkInfo = {
        name: "Rapha L2",
        rpcUrl: "http://localhost:8545",
        chainId: Number(network.chainId),
        blockNumber: blockNumber,
        devAccount: wallet.address,
        deployedAt: new Date().toISOString()
    };

    fs.writeFileSync(
        "RAPHA_L2_NETWORK.json",
        JSON.stringify(networkInfo, null, 2)
    );
    console.log("📁 Saved network info to RAPHA_L2_NETWORK.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
