<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield.svg" width="80" alt="Rapha Protocol Logo" />
  <h1>Rapha Protocol</h1>
  <p><strong>Decentralized Compute-to-Data API for Healthcare AI</strong></p>

  <p>
    <img src="https://img.shields.io/badge/PyPI-v0.1.0-blue?style=for-the-badge&logo=pypi" alt="PyPI - v0.1.0" />
    <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License - MIT" />
    <img src="https://img.shields.io/badge/Network-Polygon_Mainnet-8247E5?style=for-the-badge&logo=polygon" alt="Network - Polygon Mainnet" />
  </p>
</div>

---

## 🚀 The Vision

Modern AI requires access to high-quality, proprietary data (clinical records, genomics). However, regulatory frameworks like HIPAA and GDPR rightly prevent this data from leaving hospital firewalls.

**Rapha solves the Regulatory Data Trap.** Instead of moving the data to the algorithm, we route the algorithm to the data.

## ⚡ Installation & Quickstart

Install the Rapha SDK via pip:

```bash
pip install rapha-ai
```

### Basic Usage

Define your training job and dispatch it to a secure clinical node:

```python
import rapha_ai

# Initialize the Compute-to-Data client
client = rapha_ai.Client(
    api_key="sk_rapha_...",
    network="polygon-mainnet"
)

# Dispatch training job to a secure hospital enclave
job = client.train(
    model="resnet50",
    dataset="tokyo_oncology_01",
    epochs=10,
    proof_type="zk-snark"
)

# Wait for cryptographic verification and fetch the updated weights
result = job.wait_and_verify()

print(f"Status: {result.status}")
print(f"Merkle Root: {result.merkle_root}")
```

## 🏗 Architecture Map

Rapha utilizes a zero-trust, cryptographic architecture to guarantee data privacy and execution accuracy:

```mermaid
graph TD
    subgraph "Researcher Environment"
        A[Rapha PyPI SDK] -->|Model Definition| B(API Gateway)
        G[Updated Weights] <--|Decrypted securely| A
    end

    subgraph "Polygon Mainnet"
        B -->|Escrow Locked| C{Smart Contract Escrow}
        C -->|Unlocks Payment & Verifies Proof| D[ZK-Verifier Contract]
    end

    subgraph "Hospital Infrastructure (Firewalled)"
        C -.->|Initiate| E[Enterprise Node: Dockerized TEE]
        E -->|Executes Training on| F[(Local Raw Data)]
        E -->|Generates ZK-SNARK| D
        E -->|Encrypted Model Sync| G
    end

    style A fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff
    style C fill:#8b5cf6,stroke:#6d28d9,stroke-width:2px,color:#fff
    style E fill:#10b981,stroke:#047857,stroke-width:2px,color:#fff
    style F fill:#3f3f46,stroke:#27272a,stroke-width:2px,color:#fff
```

### 1. The SDK (`rapha_ai`)
The developer entry-point. Handles model containerization, cryptographic key generation, and interactions with the decentralized network.

### 2. The Enterprise Node (TEE)
A lightweight client deployed behind hospital firewalls. It spins up Trusted Execution Environments (TEEs) that securely ingest the model definition and local data, training the AI without exposing the raw inputs.

### 3. Escrow Smart Contracts
Deployed on the **Polygon Mainnet**, these contracts act as a trustless clearinghouse. Compute payments are held in escrow and only released when a valid ZK-SNARK is submitted, proving mathematically that the training was completed successfully and accurately.

## 🛡️ License

This projected is licensed under the [MIT License](LICENSE).
