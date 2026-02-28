package keeper

import (
	"fmt"

	"cosmossdk.io/log"
	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/rapha-chain/rapha/x/labvault/types"
)

// ConsentKeeper interface
type ConsentKeeper interface {
	RevokeConsent(ctx sdk.Context, recordID, patientDID string)
}

// Keeper of the labvault store
type Keeper struct {
	cdc           codec.BinaryCodec
	storeKey      storetypes.StoreKey
	consentKeeper ConsentKeeper
}

// NewKeeper creates a new labvault Keeper instance
func NewKeeper(cdc codec.BinaryCodec, storeKey storetypes.StoreKey, ck ConsentKeeper) Keeper {
	return Keeper{cdc: cdc, storeKey: storeKey, consentKeeper: ck}
}

// Logger returns a module-specific logger
func (k Keeper) Logger(ctx sdk.Context) log.Logger {
	return ctx.Logger().With("module", fmt.Sprintf("x/%s", types.ModuleName))
}

// Key prefixes
var (
	DataKeyPrefix   = []byte{0x01}
	AccessKeyPrefix = []byte{0x02}
)

// StoreData stores encrypted lab data
func (k Keeper) StoreData(ctx sdk.Context, data types.EncryptedLabData) error {
	data.StoredAt = ctx.BlockHeight()
	data.IsDeleted = false
	data.KeyVersion = 1

	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&data)
	store.Set(append(DataKeyPrefix, []byte(data.DataID)...), bz)

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("lab_data_stored",
			sdk.NewAttribute("data_id", data.DataID),
			sdk.NewAttribute("patient_did", data.PatientDID),
		),
	)
	return nil
}

// GetData retrieves encrypted lab data by ID
func (k Keeper) GetData(ctx sdk.Context, dataID string) (types.EncryptedLabData, bool) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(append(DataKeyPrefix, []byte(dataID)...))
	if bz == nil {
		return types.EncryptedLabData{}, false
	}
	var data types.EncryptedLabData
	k.cdc.MustUnmarshal(bz, &data)

	if data.IsDeleted {
		return types.EncryptedLabData{}, false
	}
	return data, true
}

// AccessData logs access to lab data
func (k Keeper) AccessData(ctx sdk.Context, dataID, requesterDID, purpose string) (types.EncryptedLabData, error) {
	data, found := k.GetData(ctx, dataID)
	if !found {
		return types.EncryptedLabData{}, fmt.Errorf("data not found")
	}

	// Log access
	access := types.AccessLog{
		DataID:       dataID,
		RequesterDID: requesterDID,
		Purpose:      purpose,
		AccessedAt:   ctx.BlockHeight(),
	}
	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("%s:%d", dataID, ctx.BlockHeight())
	bz := k.cdc.MustMarshal(&access)
	store.Set(append(AccessKeyPrefix, []byte(key)...), bz)

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("lab_data_accessed",
			sdk.NewAttribute("data_id", dataID),
			sdk.NewAttribute("requester", requesterDID),
		),
	)
	return data, nil
}

// DeleteData implements GDPR Article 17 Right to be Forgotten
func (k Keeper) DeleteData(ctx sdk.Context, dataID, patientDID string) error {
	data, found := k.GetData(ctx, dataID)
	if !found {
		return fmt.Errorf("data not found")
	}
	if data.PatientDID != patientDID {
		return fmt.Errorf("unauthorized: only patient can delete data")
	}

	// Mark as deleted, clear encrypted data
	data.IsDeleted = true
	data.EncryptedData = []byte{}
	data.EncryptedAESKey = []byte{}
	data.DeletedAt = ctx.BlockHeight()
	data.DeletionReason = "GDPR_ARTICLE_17"

	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&data)
	store.Set(append(DataKeyPrefix, []byte(data.DataID)...), bz)

	// Revoke all consent
	k.consentKeeper.RevokeConsent(ctx, dataID, patientDID)

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("lab_data_deleted",
			sdk.NewAttribute("data_id", dataID),
			sdk.NewAttribute("reason", "GDPR_ARTICLE_17"),
		),
	)
	return nil
}

// GetParams returns current module parameters
func (k Keeper) GetParams(ctx sdk.Context) types.Params {
	return types.DefaultParams()
}

// InitGenesis initializes the module state from genesis
func (k Keeper) InitGenesis(ctx sdk.Context, gs types.GenesisState) {
	for _, data := range gs.LabData {
		k.StoreData(ctx, data)
	}
}

// ExportGenesis exports the module state to genesis
func (k Keeper) ExportGenesis(ctx sdk.Context) *types.GenesisState {
	var dataList []types.EncryptedLabData
	store := ctx.KVStore(k.storeKey)
	iterator := sdk.KVStorePrefixIterator(store, DataKeyPrefix)
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var data types.EncryptedLabData
		k.cdc.MustUnmarshal(iterator.Value(), &data)
		if !data.IsDeleted {
			dataList = append(dataList, data)
		}
	}
	return &types.GenesisState{
		Params:  k.GetParams(ctx),
		LabData: dataList,
	}
}
