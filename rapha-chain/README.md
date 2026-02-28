# Rapha Chain

> **Sovereign Medical-First Blockchain** — *No data flows without Proof of Consent*

Rapha Chain is a purpose-built blockchain for medical data sovereignty, implementing **Proof of Medical Consent (PoMC)** at the protocol level.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Rapha Chain Architecture                      │
├─────────────────────────────────────────────────────────────────┤
│  L1 Security    │ Ethereum Mainnet (Sentinel Checkpoints)       │
├─────────────────────────────────────────────────────────────────┤
│  Consensus      │ Tendermint BFT + PoA (3-Tier Validators)      │
├─────────────────────────────────────────────────────────────────┤
│  Ante Handler   │ PoMC Hook (PLONK Proof Verification)          │
├─────────────────────────────────────────────────────────────────┤
│  Native Modules │ x/consent  x/registry  x/taco  x/pharma       │
│                 │ x/labvault x/bounty                           │
├─────────────────────────────────────────────────────────────────┤
│  EVM Layer      │ Ethermint (Web3 Compatible)                   │
├─────────────────────────────────────────────────────────────────┤
│  Precompiles    │ 0x80: TACo  0x81: Pharma  0x8004: Paymaster   │
└─────────────────────────────────────────────────────────────────┘
```

## ⚡ Key Features

### Proof of Medical Consent (PoMC)
All medical data transactions require a **PLONK zero-knowledge proof** of patient consent. This is enforced at the consensus level—no consent, no transaction.

### Three-Tier Validator Set ("Circle of Trust")
| Tier | Validators | Role |
|------|------------|------|
| Academic | Edinburgh, HKU, CUHK | Block proposers (100 power each) |
| Regulatory/Industry | NHS Digital, Pharma Consortium | Audit & supply chain (50-75 power) |
| Patient Advocate | Wellcome Trust, Patient DAO | Privacy guardians (50-75 power) |

### Gasless Patient Transactions
Patient DIDs receive **free transactions** sponsored by the Research Treasury via the `RaphaPaymaster` precompile.

### Native Modules

| Module | Purpose |
|--------|---------|
| `x/consent` | PoMC core — consent records, PLONK verification |
| `x/registry` | Medical record indexing with dual-signature |
| `x/taco` | Threshold Access Control (Shamir t=2, n=3) |
| `x/pharma` | Drug provenance, cold chain monitoring |
| `x/labvault` | Encrypted lab data with Right to be Forgotten |
| `x/bounty` | Research bounties with 80/20 patient split |

## 💰 $RAPHA Tokenomics

| Allocation | Amount | Percentage |
|------------|--------|------------|
| Validator Rewards | 400M | 40% |
| Research Treasury (Paymaster) | 250M | 25% |
| Team/Foundation (3y vest) | 150M | 15% |
| Ecosystem Grants | 100M | 10% |
| Migrated Users Airdrop | 100M | 10% |
| **Total Supply** | **1B** | **100%** |

## 🚀 Quick Start

### Prerequisites
- Go 1.21+
- Make
- Docker (optional)

### Build
```bash
# Clone the repository
git clone https://github.com/rapha-chain/rapha.git
cd rapha

# Build the binary
make build

# Install to GOPATH
make install
```

### Initialize Local Node
```bash
# Initialize a test node
./scripts/init-chain.sh test-node rapha-test-1

# Start the node
./scripts/start-node.sh
```

### Connect with Web3
```javascript
const { ethers } = require('ethers');

// Connect to Rapha Chain
const provider = new ethers.JsonRpcProvider('http://localhost:8545');

// Check chain ID
const network = await provider.getNetwork();
console.log('Chain ID:', network.chainId); // 7861 (rapha-1)
```

## 📚 Documentation

### Module Guides
- [x/consent - Proof of Medical Consent](./x/consent/README.md)
- [x/registry - Medical Record Registry](./x/registry/README.md)
- [x/taco - Threshold Access Control](./x/taco/README.md)
- [x/pharma - Drug Provenance](./x/pharma/README.md)
- [x/labvault - Encrypted Lab Vault](./x/labvault/README.md)
- [x/bounty - Research Bounties](./x/bounty/README.md)

### Precompiles
| Address | Name | Purpose |
|---------|------|---------|
| `0x80` | TacoVerifier | Dual-signature verification |
| `0x81` | PharmaRegistry | Zero-gas batch registration |
| `0x82` | ConsentVerifier | PLONK proof verification |
| `0x8004` | Paymaster | Gasless patient transactions |

## 🔒 Security

### Sentinel (L1 Checkpoints)
Every 256 blocks (~10 minutes), a state checkpoint is submitted to Ethereum L1 via the `RaphaSentinel` contract. This provides:
- L1 data availability guarantee
- Fraud proof anchor for light clients
- Bridge security for $RAPHA ↔ ETH

### PLONK ZK Proofs
Consent proofs use **PLONK** with a universal trusted setup, enabling protocol evolution without new ceremonies.

## 🧪 Testing

```bash
# Run all tests
make test

# Run specific module tests
make test-consent
make test-pharma

# Run benchmarks
make bench
```

## 📦 Docker

```bash
# Build Docker image
make docker-build

# Run container
make docker-run
```

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

Apache 2.0 — See [LICENSE](./LICENSE)

---

**Rapha Chain** — *Healthcare data sovereignty, enforced by cryptography.*
