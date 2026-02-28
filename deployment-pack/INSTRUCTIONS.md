# 🚀 Manual Deployment Guide (Polygon Mainnet)

Since the automated tools are having trouble connecting to the network, we will deploy the contracts manually using **Remix IDE**. This is the standard "fallback" method and is very reliable because it uses your browser wallet directly.

## Prerequisites
1.  Ensure you have **Polygon Mainnet** selected in your wallet (Metamask/Phantom).
2.  Ensure you have **POL** in your wallet (you do!).

---

## Step 1: Open Remix IDE
Go to: **[https://remix.ethereum.org](https://remix.ethereum.org)**

## Step 2: Deploy `MedicalRecordNFT`
1.  In Remix, looking at the **File Explorer** (left sidebar), click the **New File** icon (📄).
2.  Name it: `MedicalRecordNFT.sol`
3.  **Copy & Paste** the entire content of the file `MedicalRecordNFT.flat.sol` (from this folder) into Remix.
4.  Go to the **Solidity Compiler** tab (3rd icon on left).
    *   Select Compiler Version: `0.8.20`
    *   Click **Compile MedicalRecordNFT.sol**.
5.  Go to the **Deploy & Run Transactions** tab (4th icon on left).
    *   **Environment**: Select `Injected Provider - MetaMask` (or Phantom).
    *   **Contract**: Select `MedicalRecordNFT - src/MedicalRecordNFT.sol` from the dropdown.
    *   Click **Deploy**.
    *   Confirm the transaction in your wallet.
6.  **COPY THE ADDRESS**: Once deployed, look under "Deployed Contracts" at the bottom left. Copy the address (starts with `0x...`).
    *   **Save this address!** This is your `VITE_NFT_CONTRACT_ADDRESS`.

## Step 3: Deploy `MedicalRecordRegistry`
1.  Create another **New File** in Remix.
2.  Name it: `MedicalRecordRegistry.sol`
3.  **Copy & Paste** content from `MedicalRecordRegistry.flat.sol`.
4.  **Compile** it (same process).
5.  **Deploy** it (same process).
6.  **COPY THE ADDRESS**.
    *   **Save this address!** This is your `VITE_REGISTRY_CONTRACT_ADDRESS`.

---

## Step 4: Finish!
Reply to me with the **two addresses** you just copied. I will update your app configuration, and then your **rapha.ltd** website will be ready to launch!

**Example Reply:**
> NFT: 0x123...
> Registry: 0xabc...
