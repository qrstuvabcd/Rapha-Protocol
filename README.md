# Rapha Protocol (v2.0)

<div align="center">
  <img src="https://via.placeholder.com/800x200/0f172a/38bdf8?text=RAPHA.LTD+-+COMPUTE+TO+DATA" alt="Rapha Protocol Banner" />

  **The Enterprise API for Decentralized Compute-to-Data** <br/>
  *Train AI on Clinical Data. Without Moving the Data.*

  [![Status](https://img.shields.io/badge/Status-Beta-emerald.svg)]()
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)]()
  [![PyPI](https://img.shields.io/badge/PyPI-rapha--ai-blueviolet)]()
  [![Website](https://img.shields.io/badge/Website-rapha.ltd-black)](https://rapha.ltd)
</div>

---

## 🛑 The Regulatory Data Trap

The current landscape of medical AI development is paralyzed by strict data sovereignty laws (HIPAA, GDPR). Moving raw, unanonymized patient data out of hospital silos to centralized AI data centers creates massive legal liability and procedural bottlenecks. 

**Rapha 2.0 reverses the vector.** Instead of moving regulated data out to the AI models, we route the AI models *into* the hospital to train natively. If the data never leaves the firewall, there is zero HIPAA liability.

## 🏗️ Architecture

Rapha Protocol consists of four interconnected layers:

1. **`rapha-enterprise-node` (Hospital Layer)**  
   A Dockerized FastAPI application deployed securely *behind* hospital firewalls. It creates a Trusted Execution Environment (TEE) where AI models can ingest and train on local EHR (Electronic Health Record) databases without exposing the raw data layer. 

2. **`rapha-ai-sdk` (Demand Layer)**  
   A PyPI package (`pip install rapha-ai`) that allows researchers to encrypt their model architectures, transmit them over the wire to the enterprise nodes, and receive mathematically proven gradient updates natively in Python.

3. **`rapha-smart-contracts` (Settlement Layer)**  
   Deployed on **Polygon Mainnet**, these smart contracts act as trustless escrow agents. Researchers lock USDC. Once the enterprise node returns a valid ZK-SNARK proving the compute was executed correctly on verifiable data, the USDC is instantly settled to the hospital's treasury.

4. **`frontend-app` (Network Dashboard)**  
   A Next.js, React, and Tailwind CSS portal that allows developers, hospitals, and medical "Keepers" (validators) to track network throughput, manage DIDs via Lit Protocol, and instantiate new AI compute bounties.

## 🚀 Quick Start (For AI Researchers)

Interacting with the Rapha network requires zero blockchain infrastructure knowledge.

### 1. Installation
```bash
pip install rapha-ai python-dotenv
```

### 2. Executing a Compute Job
```python
import os
import rapha_ai

# Initialize the ZK-TLS Connection
client = rapha_ai.Client(
    node="https://api.rapha.ltd", # Hospital's public Node IP 
    escrow="0xF1437ee28076B0A55B7D3CBB497A11D6D69362aC", # Polygon Escrow
    network="polygon",
    private_key=os.environ["ETH_PRIVATE_KEY"]
)

# Transmit Model into Hospital TEE
receipt = client.train(
    model='llama-3-8b-medical',
    dataset='stanford_med_ehr_v2',
    epochs=10
)

print(f"✅ Success! Escrow Settled. Proof: {receipt.zk_hash}")
```

## 🛠️ Monorepo Structure

```text
rapha-protocol-core/
├── rapha-enterprise-node/    # Python (FastAPI/SQLite/Docker)
├── rapha-ai-sdk/             # Python (PyPI Package)
├── rapha-smart-contracts/    # Solidity (Hardhat/Polygon deploy)
├── frontend-app/             # TypeScript (React/Vite/Tailwind)
└── rapha-edge-ios/           # Swift (Legacy Edge Mobile Client)
```

## 🤝 Contributing

We welcome contributions from cryptography engineers and AI researchers. Please read `CONTRIBUTING.md` before submitting pull requests regarding the ZK-TLS implementation.

---
*Built with ⚡️ by Rapha Research Labs, 2026. For enterprise pilot inquiries, contact pilots@rapha.ltd.*
