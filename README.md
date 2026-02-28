# Rapha Protocol

A sovereign medical blockchain for privacy-first health data management.

## Tech Stack

- **L2**: Polygon CDK (Validium Mode)
- **Encryption**: AES-256-GCM + Threshold TACo
- **Storage**: IPFS (Pinata)
- **Contracts**: Solidity + Foundry
- **Backend**: TypeScript + Node.js
- **Frontend**: React + Vite + Tailwind

## Quick Start

```bash
# Install dependencies
npm install

# Start CDK devnet (requires Docker)
npm run devnet:start

# Run contract tests
npm run test:contracts

# Start backend
npm run dev:backend

# Start frontend
npm run dev:frontend
```

## Project Structure

```
rapha-protocol/
├── contracts/         # Solidity smart contracts (Foundry)
├── cdk-node/          # Polygon CDK local devnet
├── backend-oracle/    # TypeScript SDK + encryption services
└── frontend-app/      # React patient/provider dashboard
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) for more details.

## License

This project is licensed under the [MIT License](LICENSE).
