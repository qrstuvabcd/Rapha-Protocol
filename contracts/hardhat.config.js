require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            viaIR: true,
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        // Rapha Chain Local Development Network
        localhost: {
            url: "http://127.0.0.1:8545",
            chainId: 7777,
            accounts: {
                mnemonic: "test test test test test test test test test test test junk"
            }
        },
        // Rapha Chain simulated (uses Hardhat's built-in fork)
        hardhat: {
            chainId: 7777,
            accounts: {
                mnemonic: "test test test test test test test test test test test junk",
                count: 20,
                accountsBalance: "10000000000000000000000" // 10000 ETH/RAPHA per account
            }
        },
        amoy: {
            url: "https://rpc-amoy.polygon.technology",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 80002
        },
        polygon: {
            url: "https://polygon-bor.publicnode.com",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 137
        }
    },
    paths: {
        sources: "./src",
        artifacts: "./artifacts"
    }
};
