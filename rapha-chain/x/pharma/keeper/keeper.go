package keeper

import (
	"fmt"

	"cosmossdk.io/log"
	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/rapha-chain/rapha/x/pharma/types"
)

// Keeper of the pharma store
type Keeper struct {
	cdc      codec.BinaryCodec
	storeKey storetypes.StoreKey
}

// NewKeeper creates a new pharma Keeper instance
func NewKeeper(cdc codec.BinaryCodec, storeKey storetypes.StoreKey) Keeper {
	return Keeper{cdc: cdc, storeKey: storeKey}
}

// Logger returns a module-specific logger
func (k Keeper) Logger(ctx sdk.Context) log.Logger {
	return ctx.Logger().With("module", fmt.Sprintf("x/%s", types.ModuleName))
}

// Key prefixes
var (
	BatchKeyPrefix      = []byte{0x01}
	TransferKeyPrefix   = []byte{0x02}
	TempRecordKeyPrefix = []byte{0x03}
)

// RegisterBatch registers a new drug batch (zero-gas)
func (k Keeper) RegisterBatch(ctx sdk.Context, batch types.DrugBatch) error {
	batch.RegisteredAt = ctx.BlockHeight()
	batch.Status = "ACTIVE"

	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&batch)
	store.Set(append(BatchKeyPrefix, []byte(batch.BatchID)...), bz)

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("batch_registered",
			sdk.NewAttribute("batch_id", batch.BatchID),
			sdk.NewAttribute("ndc", batch.NDC),
		),
	)
	return nil
}

// GetBatch retrieves a drug batch by ID
func (k Keeper) GetBatch(ctx sdk.Context, batchID string) (types.DrugBatch, bool) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(append(BatchKeyPrefix, []byte(batchID)...))
	if bz == nil {
		return types.DrugBatch{}, false
	}
	var batch types.DrugBatch
	k.cdc.MustUnmarshal(bz, &batch)
	return batch, true
}

// RecordTemperature records a temperature reading for cold chain monitoring
func (k Keeper) RecordTemperature(ctx sdk.Context, record types.TemperatureRecord) error {
	batch, found := k.GetBatch(ctx, record.BatchID)
	if !found {
		return fmt.Errorf("batch not found: %s", record.BatchID)
	}

	params := k.GetParams(ctx)
	if record.Temperature < params.MinTemperature || record.Temperature > params.MaxTemperature {
		batch.Status = "TEMPERATURE_EXCURSION"
		k.updateBatch(ctx, batch)
		ctx.EventManager().EmitEvent(
			sdk.NewEvent("temperature_excursion",
				sdk.NewAttribute("batch_id", record.BatchID),
				sdk.NewAttribute("temperature", fmt.Sprintf("%.2f", record.Temperature)),
			),
		)
	}

	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("%s:%d", record.BatchID, ctx.BlockHeight())
	bz := k.cdc.MustMarshal(&record)
	store.Set(append(TempRecordKeyPrefix, []byte(key)...), bz)
	return nil
}

// RecordTransfer records a custody transfer
func (k Keeper) RecordTransfer(ctx sdk.Context, transfer types.TransferRecord) error {
	batch, found := k.GetBatch(ctx, transfer.BatchID)
	if !found {
		return fmt.Errorf("batch not found: %s", transfer.BatchID)
	}
	if batch.Status == "RECALLED" {
		return fmt.Errorf("cannot transfer recalled batch")
	}

	transfer.TransferredAt = ctx.BlockHeight()
	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("%s:%d", transfer.BatchID, ctx.BlockHeight())
	bz := k.cdc.MustMarshal(&transfer)
	store.Set(append(TransferKeyPrefix, []byte(key)...), bz)

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("custody_transfer",
			sdk.NewAttribute("batch_id", transfer.BatchID),
			sdk.NewAttribute("to", transfer.ToFacility),
		),
	)
	return nil
}

// InitiateRecall initiates a drug recall
func (k Keeper) InitiateRecall(ctx sdk.Context, batchID, reason, initiator string) error {
	batch, found := k.GetBatch(ctx, batchID)
	if !found {
		return fmt.Errorf("batch not found: %s", batchID)
	}
	batch.Status = "RECALLED"
	k.updateBatch(ctx, batch)

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("batch_recalled",
			sdk.NewAttribute("batch_id", batchID),
			sdk.NewAttribute("reason", reason),
		),
	)
	return nil
}

// GetParams returns current module parameters
func (k Keeper) GetParams(ctx sdk.Context) types.Params {
	return types.DefaultParams()
}

func (k Keeper) updateBatch(ctx sdk.Context, batch types.DrugBatch) {
	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&batch)
	store.Set(append(BatchKeyPrefix, []byte(batch.BatchID)...), bz)
}

// InitGenesis initializes the module state from genesis
func (k Keeper) InitGenesis(ctx sdk.Context, gs types.GenesisState) {
	for _, batch := range gs.Batches {
		k.RegisterBatch(ctx, batch)
	}
}

// ExportGenesis exports the module state to genesis
func (k Keeper) ExportGenesis(ctx sdk.Context) *types.GenesisState {
	var batches []types.DrugBatch
	store := ctx.KVStore(k.storeKey)
	iterator := sdk.KVStorePrefixIterator(store, BatchKeyPrefix)
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var batch types.DrugBatch
		k.cdc.MustUnmarshal(iterator.Value(), &batch)
		batches = append(batches, batch)
	}
	return &types.GenesisState{
		Params:  k.GetParams(ctx),
		Batches: batches,
	}
}
