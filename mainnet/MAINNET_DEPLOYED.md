# Rapha Protocol 2.0 - Polygon Mainnet Deployment

## Contract Addresses

| Contract | Address | Polygonscan |
|----------|---------|-------------|
| MedicalRecordNFT | `0x6f0b9088350EBD347eFecA8D387c9FfEc63DB9F3` | [View](https://polygonscan.com/address/0x6f0b9088350EBD347eFecA8D387c9FfEc63DB9F3) |
| MedicalRecordRegistry | `0x2c9d0B6069998c9c88a25105817bE5eF25033fE0` | [View](https://polygonscan.com/address/0x2c9d0B6069998c9c88a25105817bE5eF25033fE0) |
| RaphaMarket | `0xA46a07FbbD6F24E8Ea178aE150118a9B425B0947` | [View](https://polygonscan.com/address/0xA46a07FbbD6F24E8Ea178aE150118a9B425B0947) |
| RaphaBountyFactory | `0xD12F32169d9a32789a36A53c6F1436D28E8d03Bd` | [View](https://polygonscan.com/address/0xD12F32169d9a32789a36A53c6F1436D28E8d03Bd) |
| Public proof anchor contract | `0xB27704CA8A01Bc151181D1d53E2F0eF11B39B32F` | [View](https://polygonscan.com/address/0xB27704CA8A01Bc151181D1d53E2F0eF11B39B32F) |
| RaphaNodeNFT | `0x19432C08a4806f961D0ec589c6B68fe258E34d07` | [View](https://polygonscan.com/address/0x19432C08a4806f961D0ec589c6B68fe258E34d07) |
| RaphaClearingVault | `0x952F6d72fA210C73A9e1A9bf171B27488cF6Aa3C` | [View](https://polygonscan.com/address/0x952F6d72fA210C73A9e1A9bf171B27488cF6Aa3C) |

## Network Details

- Network: Polygon Mainnet
- Chain ID: 137
- RPC: `https://polygon-bor.publicnode.com`
- USDC: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`
- RAPHA token: `0xB534d54a7c2cb2925926E0ee24654979167E61aA`
- Deployer/treasury: `0xc8F8e014d202D8D1377F4DDBA9eed23BF16180D3`
- Trusted attestor for RaphaClearingVault: `0x4Fee2A43e3c9A898dbFDC895C6965609205fD543`
- Rapha Protocol treasury for 5% protocol route: `0x0C15430793e4a458f7Aa8C7608F9a96707FEb5C5`

## Module 2 Settlement Model

The active v2 settlement path is `RaphaClearingVault`, not the legacy simple-tollbooth reference.

1. AI company calls native Polygon USDC `approve(clearingVault, escrowAmount)`.
2. AI company calls `depositEscrow(nodeTokenId, escrowAmount)`.
3. Hospital compute starts only after escrow is locked against an active `RaphaNodeNFT`.
4. The Network Orchestration Hub verifies SGX/DCAP + TPM evidence and signs the proof digest with the trusted attestor key.
5. `submitProofAndSettle(bytes proof)` verifies the signature and splits the escrow:

```text
70% hospital treasury
20% current RaphaNodeNFT owner
5% node promoter / onboarder
5% Rapha Protocol treasury
```

No PHI, DICOM pixel data, FHIR payload, Apple Health export, or raw training input belongs on-chain.

## Verified Locally

On-chain bytecode and basic read methods were checked against Polygon Mainnet for the addresses above.
