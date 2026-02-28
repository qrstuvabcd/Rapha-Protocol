package precompiles

import (
	"errors"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/vm"

	consentkeeper "github.com/rapha-chain/rapha/x/consent/keeper"
	tacokeeper "github.com/rapha-chain/rapha/x/taco/keeper"
	pharmakeeper "github.com/rapha-chain/rapha/x/pharma/keeper"
)

// Precompile addresses for Rapha Chain
var (
	// TacoVerifierAddress is the precompile for threshold signature verification
	// Address: 0x0000000000000000000000000000000000000080
	TacoVerifierAddress = common.HexToAddress("0x0000000000000000000000000000000000000080")

	// PharmaRegistryAddress is the precompile for zero-gas drug batch registration
	// Address: 0x0000000000000000000000000000000000000081
	PharmaRegistryAddress = common.HexToAddress("0x0000000000000000000000000000000000000081")

	// PaymasterAddress is the precompile for gasless patient transactions
	// Address: 0x8000000000000000000000000000000000000004
	PaymasterAddress = common.HexToAddress("0x8000000000000000000000000000000000000004")

	// ConsentVerifierAddress is the precompile for PLONK consent proof verification
	// Address: 0x0000000000000000000000000000000000000082
	ConsentVerifierAddress = common.HexToAddress("0x0000000000000000000000000000000000000082")
)

// RaphaPrecompiles returns the map of all Rapha Chain precompiles
func NewRaphaPrecompiles(
	consentKeeper consentkeeper.Keeper,
	tacoKeeper tacokeeper.Keeper,
	pharmaKeeper pharmakeeper.Keeper,
) map[common.Address]vm.PrecompiledContract {
	return map[common.Address]vm.PrecompiledContract{
		TacoVerifierAddress:    &TacoVerifierPrecompile{tacoKeeper: tacoKeeper},
		PharmaRegistryAddress:  &PharmaRegistryPrecompile{pharmaKeeper: pharmaKeeper},
		PaymasterAddress:       &PaymasterPrecompile{consentKeeper: consentKeeper},
		ConsentVerifierAddress: &ConsentVerifierPrecompile{consentKeeper: consentKeeper},
	}
}

// ============================================
// TacoVerifierPrecompile - Dual Signature Verification
// Address: 0x80
// ============================================

// TacoVerifierPrecompile verifies threshold signatures for medical data operations
// This is called by smart contracts to verify Lab + Patient dual signatures
type TacoVerifierPrecompile struct {
	tacoKeeper tacokeeper.Keeper
}

// RequiredGas returns the gas required to execute the precompile
func (p *TacoVerifierPrecompile) RequiredGas(input []byte) uint64 {
	// Signature verification is computationally expensive
	return 3000
}

// Run executes the precompile
// Input format: dataHash (32 bytes) + labSignature (65 bytes) + patientSignature (65 bytes) + threshold (1 byte)
// Output: 0x01 if valid, 0x00 if invalid
func (p *TacoVerifierPrecompile) Run(input []byte) ([]byte, error) {
	if len(input) < 163 { // 32 + 65 + 65 + 1
		return []byte{0x00}, errors.New("invalid input length for TacoVerifier")
	}

	dataHash := input[0:32]
	labSignature := input[32:97]
	patientSignature := input[97:162]
	threshold := input[162]

	// Verify both signatures using the TACo keeper
	valid := p.verifyDualSignature(dataHash, labSignature, patientSignature, threshold)

	if valid {
		return []byte{0x01}, nil
	}
	return []byte{0x00}, nil
}

// verifyDualSignature verifies both Lab and Patient threshold signatures
func (p *TacoVerifierPrecompile) verifyDualSignature(
	dataHash, labSig, patientSig []byte,
	threshold uint8,
) bool {
	// TODO: Implement actual BLS12-381 threshold signature verification
	// For now, return true for development
	
	// In production:
	// 1. Recover lab public key from labSig
	// 2. Recover patient public key from patientSig
	// 3. Verify both signed the same dataHash
	// 4. Check that threshold number of valid signatures exist
	
	return len(labSig) == 65 && len(patientSig) == 65
}

// ============================================
// PharmaRegistryPrecompile - Zero-Gas Drug Provenance
// Address: 0x81
// ============================================

// PharmaRegistryPrecompile enables zero-gas drug batch registration
type PharmaRegistryPrecompile struct {
	pharmaKeeper pharmakeeper.Keeper
}

// RequiredGas returns zero gas for pharma operations (sponsored by protocol)
func (p *PharmaRegistryPrecompile) RequiredGas(input []byte) uint64 {
	// Zero gas for pharmaceutical provenance tracking
	// This is sponsored by the protocol to encourage adoption
	return 0
}

// Run executes the precompile
// Input format: manufacturer (20 bytes) + batchId (32 bytes) + timestamp (8 bytes)
// Output: 0x01 if registered successfully
func (p *PharmaRegistryPrecompile) Run(input []byte) ([]byte, error) {
	if len(input) < 60 { // 20 + 32 + 8
		return []byte{0x00}, errors.New("invalid input length for PharmaRegistry")
	}

	// Parse input
	manufacturer := common.BytesToAddress(input[0:20])
	batchId := input[20:52]
	// timestamp := binary.BigEndian.Uint64(input[52:60])

	// Log the registration (actual registration happens in the native module)
	_ = manufacturer
	_ = batchId

	// Return success
	return []byte{0x01}, nil
}

// ============================================
// PaymasterPrecompile - Gasless Patient Transactions
// Address: 0x8000000000000000000000000000000000000004
// ============================================

// PaymasterPrecompile checks if a transaction should be sponsored
type PaymasterPrecompile struct {
	consentKeeper consentkeeper.Keeper
}

// RequiredGas returns the gas required
func (p *PaymasterPrecompile) RequiredGas(input []byte) uint64 {
	return 100 // Minimal gas for lookup
}

// Run checks if the origin is a registered Patient DID
// Input format: origin address (20 bytes)
// Output: 0x01 if patient (gasless), 0x00 if not
func (p *PaymasterPrecompile) Run(input []byte) ([]byte, error) {
	if len(input) < 20 {
		return []byte{0x00}, errors.New("invalid input length for Paymaster")
	}

	// Extract origin address
	origin := common.BytesToAddress(input[0:20])

	// Convert to cosmos address and check if it's a patient DID
	// Note: In a real implementation, we'd need the SDK context
	// This is a simplified version for the precompile interface
	_ = origin

	// TODO: Implement actual patient DID check using context
	// For now, return true for any valid address
	return []byte{0x01}, nil
}

// ============================================
// ConsentVerifierPrecompile - PLONK Proof Verification
// Address: 0x82
// ============================================

// ConsentVerifierPrecompile verifies PLONK proofs of consent
type ConsentVerifierPrecompile struct {
	consentKeeper consentkeeper.Keeper
}

// RequiredGas returns the gas required for PLONK verification
func (p *ConsentVerifierPrecompile) RequiredGas(input []byte) uint64 {
	// PLONK verification is expensive but constant-time
	return 50000
}

// Run verifies a PLONK proof of consent
// Input format: proof (variable) + publicInputs (variable)
// Output: 0x01 if valid, 0x00 if invalid
func (p *ConsentVerifierPrecompile) Run(input []byte) ([]byte, error) {
	if len(input) < 64 {
		return []byte{0x00}, errors.New("invalid input length for ConsentVerifier")
	}

	// TODO: Implement actual PLONK verification using gnark
	// 1. Deserialize proof from input
	// 2. Extract public inputs
	// 3. Get verification key from module params
	// 4. Verify proof using gnark PLONK verifier

	// For development, return valid
	return []byte{0x01}, nil
}

// ============================================
// ABI Definitions for Precompiles
// ============================================

// TacoVerifierABI is the ABI for the TacoVerifier precompile
var TacoVerifierABI = `[
	{
		"inputs": [
			{"name": "dataHash", "type": "bytes32"},
			{"name": "labSignature", "type": "bytes"},
			{"name": "patientSignature", "type": "bytes"}
		],
		"name": "verifyDualSignature",
		"outputs": [{"name": "valid", "type": "bool"}],
		"stateMutability": "view",
		"type": "function"
	}
]`

// PaymasterABI is the ABI for the Paymaster precompile
var PaymasterABI = `[
	{
		"inputs": [{"name": "origin", "type": "address"}],
		"name": "isPatientDID",
		"outputs": [{"name": "", "type": "bool"}],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{"name": "origin", "type": "address"},
			{"name": "gasUsed", "type": "uint256"}
		],
		"name": "sponsorGas",
		"outputs": [{"name": "sponsored", "type": "bool"}],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]`

// ConsentVerifierABI is the ABI for the ConsentVerifier precompile
var ConsentVerifierABI = `[
	{
		"inputs": [
			{"name": "proof", "type": "bytes"},
			{"name": "publicInputs", "type": "bytes"}
		],
		"name": "verifyConsentProof",
		"outputs": [{"name": "valid", "type": "bool"}],
		"stateMutability": "view",
		"type": "function"
	}
]`

// ParseABI parses an ABI string
func ParseABI(abiStr string) (abi.ABI, error) {
	return abi.JSON(strings.NewReader(abiStr))
}
