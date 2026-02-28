package keeper

import (
	"fmt"

	"cosmossdk.io/log"
	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/rapha-chain/rapha/x/registry/types"
)

// ConsentKeeper interface
type ConsentKeeper interface {
	IsConsentActive(ctx sdk.Context, recordID, requesterDID string) bool
}

// Keeper of the registry store
type Keeper struct {
	cdc           codec.BinaryCodec
	storeKey      storetypes.StoreKey
	consentKeeper ConsentKeeper
}

// NewKeeper creates a new registry Keeper instance
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey storetypes.StoreKey,
	ak interface{},
	ck ConsentKeeper,
) Keeper {
	return Keeper{
		cdc:           cdc,
		storeKey:      storeKey,
		consentKeeper: ck,
	}
}

// Logger returns a module-specific logger
func (k Keeper) Logger(ctx sdk.Context) log.Logger {
	return ctx.Logger().With("module", fmt.Sprintf("x/%s", types.ModuleName))
}

// Key prefixes
var (
	RecordKeyPrefix       = []byte{0x01}
	OwnerIndexPrefix      = []byte{0x02}
	ProviderIndexPrefix   = []byte{0x03}
	RecordTypeIndexPrefix = []byte{0x04}
)

// RegisterRecord registers a new medical record
func (k Keeper) RegisterRecord(ctx sdk.Context, record types.MedicalRecord) error {
	params := k.GetParams(ctx)
	if params.RequireDualSignature {
		if len(record.LabSignature) == 0 || len(record.PatientSignature) == 0 {
			return fmt.Errorf("dual signature required")
		}
	}

	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&record)
	store.Set(append(RecordKeyPrefix, []byte(record.RecordID)...), bz)

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("record_registered",
			sdk.NewAttribute("record_id", record.RecordID),
			sdk.NewAttribute("owner", record.OwnerDID),
		),
	)
	return nil
}

// GetRecord retrieves a medical record by ID
func (k Keeper) GetRecord(ctx sdk.Context, recordID string) (types.MedicalRecord, bool) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(append(RecordKeyPrefix, []byte(recordID)...))
	if bz == nil {
		return types.MedicalRecord{}, false
	}
	var record types.MedicalRecord
	k.cdc.MustUnmarshal(bz, &record)
	return record, true
}

// GetParams returns the current module parameters
func (k Keeper) GetParams(ctx sdk.Context) types.Params {
	return types.DefaultParams()
}

// InitGenesis initializes the module state from genesis
func (k Keeper) InitGenesis(ctx sdk.Context, gs types.GenesisState) {
	for _, record := range gs.Records {
		k.RegisterRecord(ctx, record)
	}
}

// ExportGenesis exports the module state to genesis
func (k Keeper) ExportGenesis(ctx sdk.Context) *types.GenesisState {
	var records []types.MedicalRecord
	store := ctx.KVStore(k.storeKey)
	iterator := sdk.KVStorePrefixIterator(store, RecordKeyPrefix)
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var record types.MedicalRecord
		k.cdc.MustUnmarshal(iterator.Value(), &record)
		records = append(records, record)
	}

	return &types.GenesisState{
		Params:  k.GetParams(ctx),
		Records: records,
	}
}
