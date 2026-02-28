package consent

import (
	"encoding/json"

	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/codec"
	cdctypes "github.com/cosmos/cosmos-sdk/codec/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	"github.com/grpc-ecosystem/grpc-gateway/runtime"
	"github.com/spf13/cobra"

	"github.com/rapha-chain/rapha/x/consent/keeper"
	"github.com/rapha-chain/rapha/x/consent/types"
)

var (
	_ module.AppModule      = AppModule{}
	_ module.AppModuleBasic = AppModuleBasic{}
)

// ============================================
// AppModuleBasic
// ============================================

// AppModuleBasic defines the basic application module for the consent module
type AppModuleBasic struct {
	cdc codec.Codec
}

// Name returns the consent module's name
func (AppModuleBasic) Name() string {
	return types.ModuleName
}

// RegisterCodec registers the consent module's types for the given codec
func (AppModuleBasic) RegisterCodec(cdc *codec.LegacyAmino) {
	types.RegisterCodec(cdc)
}

// RegisterLegacyAminoCodec registers the amino codec for the module
func (AppModuleBasic) RegisterLegacyAminoCodec(cdc *codec.LegacyAmino) {
	types.RegisterCodec(cdc)
}

// RegisterInterfaces registers the module's interface types
func (a AppModuleBasic) RegisterInterfaces(reg cdctypes.InterfaceRegistry) {
	types.RegisterInterfaces(reg)
}

// DefaultGenesis returns default genesis state as raw bytes
func (AppModuleBasic) DefaultGenesis(cdc codec.JSONCodec) json.RawMessage {
	return cdc.MustMarshalJSON(types.DefaultGenesis())
}

// ValidateGenesis performs genesis state validation
func (AppModuleBasic) ValidateGenesis(cdc codec.JSONCodec, config client.TxEncodingConfig, bz json.RawMessage) error {
	var genState types.GenesisState
	if err := cdc.UnmarshalJSON(bz, &genState); err != nil {
		return err
	}
	return genState.Validate()
}

// RegisterGRPCGatewayRoutes registers the gRPC Gateway routes
func (AppModuleBasic) RegisterGRPCGatewayRoutes(clientCtx client.Context, mux *runtime.ServeMux) {
	// TODO: Register query routes
}

// GetTxCmd returns the transaction commands for the module
func (a AppModuleBasic) GetTxCmd() *cobra.Command {
	// TODO: Return TX commands
	return nil
}

// GetQueryCmd returns the query commands for the module
func (AppModuleBasic) GetQueryCmd() *cobra.Command {
	// TODO: Return query commands
	return nil
}

// ============================================
// AppModule
// ============================================

// AppModule implements an application module for the consent module
type AppModule struct {
	AppModuleBasic

	keeper keeper.Keeper
}

// NewAppModule creates a new AppModule object
func NewAppModule(cdc codec.Codec, keeper keeper.Keeper) AppModule {
	return AppModule{
		AppModuleBasic: AppModuleBasic{cdc: cdc},
		keeper:         keeper,
	}
}

// Name returns the consent module's name
func (AppModule) Name() string {
	return types.ModuleName
}

// RegisterInvariants registers the invariants of the module
func (am AppModule) RegisterInvariants(ir sdk.InvariantRegistry) {}

// RegisterServices registers a GRPC query service
func (am AppModule) RegisterServices(cfg module.Configurator) {
	// TODO: Register query and msg services
}

// InitGenesis performs genesis initialization for the consent module
func (am AppModule) InitGenesis(ctx sdk.Context, cdc codec.JSONCodec, data json.RawMessage) {
	var genState types.GenesisState
	cdc.MustUnmarshalJSON(data, &genState)
	am.keeper.InitGenesis(ctx, genState)
}

// ExportGenesis returns the exported genesis state as raw bytes
func (am AppModule) ExportGenesis(ctx sdk.Context, cdc codec.JSONCodec) json.RawMessage {
	genState := am.keeper.ExportGenesis(ctx)
	return cdc.MustMarshalJSON(genState)
}

// ConsensusVersion implements AppModule/ConsensusVersion
func (AppModule) ConsensusVersion() uint64 { return 1 }

// BeginBlock performs begin block logic
func (am AppModule) BeginBlock(ctx sdk.Context) {}

// EndBlock performs end block logic
func (am AppModule) EndBlock(ctx sdk.Context) {}

// IsOnePerModuleType implements the depinject.OnePerModuleType interface
func (am AppModule) IsOnePerModuleType() {}

// IsAppModule implements the appmodule.AppModule interface
func (am AppModule) IsAppModule() {}

// Module constants exported for other packages
const (
	ModuleName       = types.ModuleName
	StoreKey         = types.StoreKey
	PaymasterAccount = types.PaymasterAccount
)
