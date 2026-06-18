const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Testing connection...");
    console.log("Account:", deployer.address);

    const provider = hre.ethers.provider;
    const network = await provider.getNetwork();
    console.log("Connected to chain ID:", network.chainId.toString());

    const balance = await provider.getBalance(deployer.address);
    console.log("Balance:", hre.ethers.formatEther(balance));

    const nonce = await provider.getTransactionCount(deployer.address);
    console.log("Nonce:", nonce);

    console.log("Sending self-transfer of 0.001 POL...");
    const tx = await deployer.sendTransaction({
        to: deployer.address,
        value: hre.ethers.parseEther("0.001")
    });
    console.log("Tx sent:", tx.hash);
    await tx.wait();
    console.log("Confirmed!");
}

main().catch(console.error);
