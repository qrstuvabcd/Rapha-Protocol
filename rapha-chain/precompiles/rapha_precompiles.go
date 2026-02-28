package precompiles

import (
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/vm"
)

// RaphaPrecompiles returns all Rapha native precompiles
func RaphaPrecompiles() map[common.Address]vm.PrecompiledContract {
	return map[common.Address]vm.PrecompiledContract{
		common.HexToAddress("0x0000000000000000000000000000000000000080"): &TacoVerifierPrecompile{},
		common.HexToAddress("0x0000000000000000000000000000000000000081"): &PharmaRegistryPrecompile{},
		common.HexToAddress("0x0000000000000000000000000000000000000082"): &ConsentVerifierPrecompile{},
		common.HexToAddress("0x0000000000000000000000000000000000008004"): &PaymasterPrecompile{},
	}
}

// TacoVerifierPrecompile - 0x80
type TacoVerifierPrecompile struct{}

func (p *TacoVerifierPrecompile) RequiredGas(input []byte) uint64 { return 50000 }
func (p *TacoVerifierPrecompile) Run(input []byte) ([]byte, error) {
	// Placeholder - verify dual signatures
	return []byte{1}, nil
}

// PharmaRegistryPrecompile - 0x81
type PharmaRegistryPrecompile struct{}

func (p *PharmaRegistryPrecompile) RequiredGas(input []byte) uint64 { return 0 }
func (p *PharmaRegistryPrecompile) Run(input []byte) ([]byte, error) {
	// Zero gas for pharma operations
	return []byte{1}, nil
}

// ConsentVerifierPrecompile - 0x82
type ConsentVerifierPrecompile struct{}

func (p *ConsentVerifierPrecompile) RequiredGas(input []byte) uint64 { return 100000 }
func (p *ConsentVerifierPrecompile) Run(input []byte) ([]byte, error) {
	// Placeholder - verify PLONK proof
	return []byte{1}, nil
}

// PaymasterPrecompile - 0x8004
type PaymasterPrecompile struct{}

func (p *PaymasterPrecompile) RequiredGas(input []byte) uint64 { return 21000 }
func (p *PaymasterPrecompile) Run(input []byte) ([]byte, error) {
	// Gasless patient transaction handling
	return []byte{1}, nil
}
