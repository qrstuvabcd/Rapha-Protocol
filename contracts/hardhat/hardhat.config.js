require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        // Polygon Amoy Testnet
        amoy: {
            url: "https://rpc-amoy.polygon.technology",
            accounts: [process.env.PRIVATE_KEY],
            chainId: 80002
        },
        // Rapha L2 Local Network
        raphaLocal: {
            url: "http://localhost:8545",
            accounts: [process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
            chainId: 1337
        },
        // Rapha L2 Public (via Cloudflare Tunnel)
        raphaPublic: {
            url: process.env.RAPHA_L2_RPC || "http://localhost:8545",
            accounts: [process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"],
            chainId: 1337
        }
    },
    paths: {
        sources: "../src",
        artifacts: "./artifacts"
    }
};
