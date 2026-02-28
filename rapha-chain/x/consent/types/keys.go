package types

import (
	"github.com/cosmos/cosmos-sdk/codec"
	cdctypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/msgservice"
)

const (
	// ModuleName defines the module name
	ModuleName = "consent"

	// StoreKey defines the primary module store key
	StoreKey = ModuleName

	// RouterKey defines the module's message routing key
	RouterKey = ModuleName

	// MemStoreKey defines the in-memory store key
	MemStoreKey = "mem_consent"

	// PaymasterAccount is the module account for gasless patient transactions
	PaymasterAccount = "consent_paymaster"
)

// Key prefixes for the consent module store
var (
	// ConsentRecordKeyPrefix is the prefix for consent records
	ConsentRecordKeyPrefix = []byte{0x01}

	// ConsentBitKeyPrefix is the prefix for consent bits (quick lookups)
	ConsentBitKeyPrefix = []byte{0x02}

	// PatientDIDKeyPrefix is the prefix for registered patient DIDs
	PatientDIDKeyPrefix = []byte{0x03}

	// ParamsKey is the key for module parameters
	ParamsKey = []byte{0x04}
)

// ConsentRecordKey returns the store key for a consent record
func ConsentRecordKey(recordID string) []byte {
	return append(ConsentRecordKeyPrefix, []byte(recordID)...)
}

// ConsentBitKey returns the store key for a consent bit
func ConsentBitKey(recordID, requesterDID string) []byte {
	key := append(ConsentBitKeyPrefix, []byte(recordID)...)
	key = append(key, []byte("/")...)
	return append(key, []byte(requesterDID)...)
}

// PatientDIDKey returns the store key for a patient DID
func PatientDIDKey(patientDID string) []byte {
	return append(PatientDIDKeyPrefix, []byte(patientDID)...)
}

// RegisterCodec registers the necessary types for amino codec
func RegisterCodec(cdc *codec.LegacyAmino) {
	cdc.RegisterConcrete(&MsgGrantConsent{}, "consent/GrantConsent", nil)
	cdc.RegisterConcrete(&MsgRevokeConsent{}, "consent/RevokeConsent", nil)
	cdc.RegisterConcrete(&MsgRegisterPatientDID{}, "consent/RegisterPatientDID", nil)
}

// RegisterInterfaces registers the module's interface types
func RegisterInterfaces(registry cdctypes.InterfaceRegistry) {
	registry.RegisterImplementations((*sdk.Msg)(nil),
		&MsgGrantConsent{},
		&MsgRevokeConsent{},
		&MsgRegisterPatientDID{},
	)

	msgservice.RegisterMsgServiceDesc(registry, &_Msg_serviceDesc)
}

var (
	amino     = codec.NewLegacyAmino()
	ModuleCdc = codec.NewProtoCodec(cdctypes.NewInterfaceRegistry())
)
