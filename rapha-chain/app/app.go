package app

import (
	"encoding/json"
	"io"
	"os"

	"cosmossdk.io/log"
	storetypes "cosmossdk.io/store/types"
	abci "github.com/cometbft/cometbft/abci/types"
	tmjson "github.com/cometbft/cometbft/libs/json"
	tmos "github.com/cometbft/cometbft/libs/os"
	dbm "github.com/cosmos/cosmos-db"
	"github.com/cosmos/cosmos-sdk/baseapp"
	"github.com/cosmos/cosmos-sdk/client"
	"github.com/cosmos/cosmos-sdk/codec"
	"github.com/cosmos/cosmos-sdk/codec/types"
	"github.com/cosmos/cosmos-sdk/server/api"
	"github.com/cosmos/cosmos-sdk/server/config"
	servertypes "github.com/cosmos/cosmos-sdk/server/types"
	sdk "github.com/cosmos/cosmos-sdk/types"
	"github.com/cosmos/cosmos-sdk/types/module"
	"github.com/cosmos/cosmos-sdk/x/auth"
	authkeeper "github.com/cosmos/cosmos-sdk/x/auth/keeper"
	authtypes "github.com/cosmos/cosmos-sdk/x/auth/types"
	"github.com/cosmos/cosmos-sdk/x/bank"
	bankkeeper "github.com/cosmos/cosmos-sdk/x/bank/keeper"
	banktypes "github.com/cosmos/cosmos-sdk/x/bank/types"
	"github.com/cosmos/cosmos-sdk/x/staking"
	stakingkeeper "github.com/cosmos/cosmos-sdk/x/staking/keeper"
	stakingtypes "github.com/cosmos/cosmos-sdk/x/staking/types"

	// Rapha native modules
	consentkeeper "github.com/rapha-chain/rapha/x/consent/keeper"
	consenttypes "github.com/rapha-chain/rapha/x/consent/types"
	registrykeeper "github.com/rapha-chain/rapha/x/registry/keeper"
	registrytypes "github.com/rapha-chain/rapha/x/registry/types"
	tacokeeper "github.com/rapha-chain/rapha/x/taco/keeper"
	tacotypes "github.com/rapha-chain/rapha/x/taco/types"
	pharmakeeper "github.com/rapha-chain/rapha/x/pharma/keeper"
	pharmatypes "github.com/rapha-chain/rapha/x/pharma/types"
	labvaultkeeper "github.com/rapha-chain/rapha/x/labvault/keeper"
	labvaulttypes "github.com/rapha-chain/rapha/x/labvault/types"
	bountykeeper "github.com/rapha-chain/rapha/x/bounty/keeper"
	bountytypes "github.com/rapha-chain/rapha/x/bounty/types"
)

const AppName = "raphad"

var (
	// DefaultNodeHome default home directories for the application daemon
	DefaultNodeHome string

	// ModuleBasics defines the module BasicManager
	ModuleBasics = module.NewBasicManager(
		auth.AppModuleBasic{},
		bank.AppModuleBasic{},
		staking.AppModuleBasic{},
	)
)

func init() {
	userHomeDir, err := os.UserHomeDir()
	if err != nil {
		panic(err)
	}
	DefaultNodeHome = userHomeDir + "/.rapha"

	// Set address prefixes
	config := sdk.GetConfig()
	config.SetBech32PrefixForAccount("rapha", "raphapub")
	config.SetBech32PrefixForValidator("raphavaloper", "raphavaloperpub")
	config.SetBech32PrefixForConsensusNode("raphavalcons", "raphavalconspub")
	config.Seal()
}

// RaphaApp extends the Cosmos SDK baseapp
type RaphaApp struct {
	*baseapp.BaseApp
	legacyAmino       *codec.LegacyAmino
	appCodec          codec.Codec
	interfaceRegistry types.InterfaceRegistry

	// Store keys
	keys    map[string]*storetypes.KVStoreKey
	tkeys   map[string]*storetypes.TransientStoreKey
	memKeys map[string]*storetypes.MemoryStoreKey

	// === Cosmos SDK Core Keepers ===
	AccountKeeper authkeeper.AccountKeeper
	BankKeeper    bankkeeper.Keeper
	StakingKeeper *stakingkeeper.Keeper

	// === Rapha Native Module Keepers ===
	ConsentKeeper  consentkeeper.Keeper  // PoMC - Proof of Medical Consent
	RegistryKeeper registrykeeper.Keeper // Medical Record Registry
	TacoKeeper     tacokeeper.Keeper     // Threshold Access Control
	PharmaKeeper   pharmakeeper.Keeper   // Drug Provenance
	LabVaultKeeper labvaultkeeper.Keeper // Encrypted Lab Data
	BountyKeeper   bountykeeper.Keeper   // Research Bounty Pools

	// Module manager
	mm *module.Manager
}

// NewRaphaApp returns a new RaphaApp instance
func NewRaphaApp(
	logger log.Logger,
	db dbm.DB,
	traceStore io.Writer,
	loadLatest bool,
	appOpts servertypes.AppOptions,
	baseAppOptions ...func(*baseapp.BaseApp),
) *RaphaApp {
	// Setup codecs
	interfaceRegistry := types.NewInterfaceRegistry()
	appCodec := codec.NewProtoCodec(interfaceRegistry)
	legacyAmino := codec.NewLegacyAmino()

	// Create base app
	bApp := baseapp.NewBaseApp(AppName, logger, db, nil, baseAppOptions...)
	bApp.SetVersion("1.0.0")
	bApp.SetInterfaceRegistry(interfaceRegistry)

	// Define store keys
	keys := sdk.NewKVStoreKeys(
		authtypes.StoreKey, banktypes.StoreKey, stakingtypes.StoreKey,
		consenttypes.StoreKey, registrytypes.StoreKey, tacotypes.StoreKey,
		pharmatypes.StoreKey, labvaulttypes.StoreKey, bountytypes.StoreKey,
	)
	tkeys := sdk.NewTransientStoreKeys(stakingtypes.TStoreKey)
	memKeys := sdk.NewMemoryStoreKeys()

	// Create the app
	app := &RaphaApp{
		BaseApp:           bApp,
		legacyAmino:       legacyAmino,
		appCodec:          appCodec,
		interfaceRegistry: interfaceRegistry,
		keys:              keys,
		tkeys:             tkeys,
		memKeys:           memKeys,
	}

	// Initialize keepers
	app.initKeepers()

	// Mount stores
	app.MountKVStores(keys)
	app.MountTransientStores(tkeys)
	app.MountMemoryStores(memKeys)

	// Set InitChainer
	app.SetInitChainer(app.InitChainer)
	app.SetBeginBlocker(app.BeginBlocker)
	app.SetEndBlocker(app.EndBlocker)

	// Load latest state
	if loadLatest {
		if err := app.LoadLatestVersion(); err != nil {
			tmos.Exit(err.Error())
		}
	}

	return app
}

// initKeepers initializes all module keepers
func (app *RaphaApp) initKeepers() {
	// Auth keeper
	app.AccountKeeper = authkeeper.NewAccountKeeper(
		app.appCodec,
		app.keys[authtypes.StoreKey],
		authtypes.ProtoBaseAccount,
		map[string][]string{},
		"rapha",
		authtypes.NewModuleAddress("gov").String(),
	)

	// Bank keeper
	app.BankKeeper = bankkeeper.NewBaseKeeper(
		app.appCodec,
		app.keys[banktypes.StoreKey],
		app.AccountKeeper,
		map[string]bool{},
		authtypes.NewModuleAddress("gov").String(),
	)

	// ===== Rapha Native Module Keepers =====

	// Consent keeper (PoMC)
	app.ConsentKeeper = consentkeeper.NewKeeper(
		app.appCodec,
		app.keys[consenttypes.StoreKey],
		app.AccountKeeper,
	)

	// Registry keeper
	app.RegistryKeeper = registrykeeper.NewKeeper(
		app.appCodec,
		app.keys[registrytypes.StoreKey],
		app.AccountKeeper,
		app.ConsentKeeper,
	)

	// TACo keeper
	app.TacoKeeper = tacokeeper.NewKeeper(
		app.appCodec,
		app.keys[tacotypes.StoreKey],
		app.ConsentKeeper,
	)

	// Pharma keeper
	app.PharmaKeeper = pharmakeeper.NewKeeper(
		app.appCodec,
		app.keys[pharmatypes.StoreKey],
	)

	// LabVault keeper
	app.LabVaultKeeper = labvaultkeeper.NewKeeper(
		app.appCodec,
		app.keys[labvaulttypes.StoreKey],
		app.ConsentKeeper,
	)

	// Bounty keeper
	app.BountyKeeper = bountykeeper.NewKeeper(
		app.appCodec,
		app.keys[bountytypes.StoreKey],
		app.BankKeeper,
		app.TacoKeeper,
	)
}

// InitChainer initializes the chain from genesis
func (app *RaphaApp) InitChainer(ctx sdk.Context, req abci.RequestInitChain) abci.ResponseInitChain {
	var genesisState map[string]json.RawMessage
	if err := tmjson.Unmarshal(req.AppStateBytes, &genesisState); err != nil {
		panic(err)
	}
	return app.mm.InitGenesis(ctx, app.appCodec, genesisState)
}

// BeginBlocker runs at the beginning of each block
func (app *RaphaApp) BeginBlocker(ctx sdk.Context, req abci.RequestBeginBlock) abci.ResponseBeginBlock {
	return app.mm.BeginBlock(ctx, req)
}

// EndBlocker runs at the end of each block
func (app *RaphaApp) EndBlocker(ctx sdk.Context, req abci.RequestEndBlock) abci.ResponseEndBlock {
	return app.mm.EndBlock(ctx, req)
}

// RegisterAPIRoutes registers API routes
func (app *RaphaApp) RegisterAPIRoutes(apiSvr *api.Server, apiConfig config.APIConfig) {
	clientCtx := apiSvr.ClientCtx
	_ = clientCtx
}

// GetKey returns a store key
func (app *RaphaApp) GetKey(storeKey string) *storetypes.KVStoreKey {
	return app.keys[storeKey]
}

// AppCodec returns the app codec
func (app *RaphaApp) AppCodec() codec.Codec {
	return app.appCodec
}

// LegacyAmino returns the legacy amino codec
func (app *RaphaApp) LegacyAmino() *codec.LegacyAmino {
	return app.legacyAmino
}

// Name returns the app name
func (app *RaphaApp) Name() string { return AppName }

// ExportAppStateAndValidators exports app state for genesis
func (app *RaphaApp) ExportAppStateAndValidators(
	forZeroHeight bool,
	jailAllowedAddrs []string,
	modulesToExport []string,
) (servertypes.ExportedApp, error) {
	ctx := app.NewContext(true, abci.Header{Height: app.LastBlockHeight()})
	genState := app.mm.ExportGenesis(ctx, app.appCodec)
	appState, err := json.MarshalIndent(genState, "", "  ")
	if err != nil {
		return servertypes.ExportedApp{}, err
	}
	return servertypes.ExportedApp{
		AppState: appState,
	}, nil
}

// RegisterTxService implements the Application.RegisterTxService method
func (app *RaphaApp) RegisterTxService(clientCtx client.Context) {}

// RegisterTendermintService implements the Application.RegisterTendermintService method
func (app *RaphaApp) RegisterTendermintService(clientCtx client.Context) {}
