<div align="center">

# Rapha Protocol

### The Compute-to-Data API for Medical AI

[![PyPI](https://img.shields.io/pypi/v/rapha-ai?style=flat-square&color=06b6d4&label=rapha-ai)](https://pypi.org/project/rapha-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-zinc.svg?style=flat-square)](LICENSE)
[![Polygon Mainnet](https://img.shields.io/badge/Polygon-Mainnet-8247e5?style=flat-square&logo=polygon)](https://polygonscan.com/address/0x5468B7d5F4A52d00b4192874598b620e53a0CcA6)
[![Render](https://img.shields.io/badge/API-Live-10b981?style=flat-square)](https://api.rapha.ltd)

**Train AI on hospital data. Without moving the data.**

[Website](https://rapha.ltd) · [PyPI SDK](https://pypi.org/project/rapha-ai) · [Whitepaper](https://rapha.ltd/whitepaper) · [Escrow Contract](https://polygonscan.com/address/0x5468B7d5F4A52d00b4192874598b620e53a0CcA6)

</div>

---

## The Problem

AI models need high-quality clinical data. But HIPAA and GDPR make it **legally toxic** for hospitals to export patient records to centralized data centers. The result: the world's best healthcare data sits locked inside hospital firewalls, inaccessible to the AI models that need it most.

## The Solution

Rapha Protocol reverses the paradigm. Instead of moving data to the algorithm, **we move the algorithm to the data**.

We route encrypted AI training payloads directly into hospital firewalls using **Trusted Execution Environments (TEEs)** and verify model integrity using **ZK-TLS cryptography**. Payment is settled automatically via **USDC escrow on Polygon**.

> Zero data leaves the building. Zero HIPAA liability.

---

## Quickstart

```bash
pip install rapha-ai
```

```python
import rapha_ai

# Connect to Polygon Mainnet
client = rapha_ai.Client(
    api_key="sk_live_...",
    network="polygon-mainnet"
)

# Dispatch training into a hospital TEE
job = client.train(
    model="llama-3-base",
    target_node="tokyo_oncology_01",
    epochs=5
)

print(f"✓ ZK-Proof: {job.zk_receipt}")
# → Escrow settled: 250 USDC → tokyo_oncology_01.treasury
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     RAPHA PROTOCOL v2.0                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────┐ │
│  │  rapha-ai (SDK)   │───▶│ Enterprise Node  │───▶│  Polygon  │ │
│  │  PyPI Package     │    │  FastAPI + TEE   │    │  Escrow   │ │
│  │  Python 3.9+      │    │  Docker + SQLite │    │  USDC     │ │
│  └──────────────────┘    └──────────────────┘    └───────────┘ │
│         ▲                        │                      │       │
│         │                  ZK-SNARK Proof          Settlement   │
│    Researcher              of Training             on-chain     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

| Package | Description | Status |
|---------|------------|--------|
| [`rapha-ai-sdk/`](./rapha-ai-sdk) | Python SDK published on PyPI | [![PyPI](https://img.shields.io/pypi/v/rapha-ai?style=flat-square&color=06b6d4)](https://pypi.org/project/rapha-ai) |
| [`rapha-protocol-core/rapha-enterprise-node/`](./rapha-protocol-core/rapha-enterprise-node) | FastAPI compute node (deployed to hospital TEEs) | ![Live](https://img.shields.io/badge/Status-Live-10b981?style=flat-square) |
| [`rapha-protocol-core/rapha-smart-contracts/`](./rapha-protocol-core/rapha-smart-contracts) | Solidity escrow contracts on Polygon Mainnet | ![Deployed](https://img.shields.io/badge/Polygon-Deployed-8247e5?style=flat-square) |
| [`frontend-app/`](./frontend-app) | React + Vite + Tailwind frontend | ![Vercel](https://img.shields.io/badge/Vercel-Deployed-white?style=flat-square) |

---

## How It Works

1. **Researcher** installs `rapha-ai` and calls `client.train()` with a model architecture and target hospital node.
2. **SDK** encrypts the model weights and dispatches the payload over ZK-TLS to the hospital's enterprise node.
3. **Enterprise Node** (running inside a Docker TEE behind the hospital firewall) trains the model on local EHR data.
4. **ZK-SNARK Proof** is generated to cryptographically attest the training was executed faithfully.
5. **Polygon Escrow** verifies the proof on-chain and releases USDC payment to the hospital treasury.

---

## Smart Contract

**RaphaEscrow.sol** — Deployed to Polygon Mainnet

| Contract | Address |
|----------|---------|
| RaphaEscrow | [`0x5468B7d5F4A52d00b4192874598b620e53a0CcA6`](https://polygonscan.com/address/0x5468B7d5F4A52d00b4192874598b620e53a0CcA6) |

Settlement states: `FUNDED → TRAINING → SETTLEMENT`

---

## Team

Built at **Antler Inception Residency** (London, 2026).

---

## License

MIT © Rapha Protocol
