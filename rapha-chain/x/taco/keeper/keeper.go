package keeper

import (
	"crypto/sha256"
	"fmt"

	"cosmossdk.io/log"
	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/rapha-chain/rapha/x/taco/types"
)

// ConsentKeeper interface
type ConsentKeeper interface {
	IsConsentActive(ctx sdk.Context, recordID, requesterDID string) bool
}

// Keeper of the taco store
type Keeper struct {
	cdc           codec.BinaryCodec
	storeKey      storetypes.StoreKey
	consentKeeper ConsentKeeper
}

// NewKeeper creates a new taco Keeper instance
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey storetypes.StoreKey,
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
	ConditionKeyPrefix         = []byte{0x01}
	KeyKeeperKeyPrefix         = []byte{0x02}
	DecryptionRequestKeyPrefix = []byte{0x03}
)

// RegisterCondition creates a new TACo access condition
func (k Keeper) RegisterCondition(ctx sdk.Context, condition types.Condition) error {
	if len(condition.ConditionID) == 0 {
		condition.ConditionID = k.generateConditionID(condition.PatientDID, condition.RecordID, ctx.BlockHeight())
	}
	condition.CreatedAt = ctx.BlockHeight()
	condition.IsActive = true

	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&condition)
	store.Set(append(ConditionKeyPrefix, condition.ConditionID...), bz)

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("condition_registered",
			sdk.NewAttribute("condition_id", fmt.Sprintf("%x", condition.ConditionID)),
			sdk.NewAttribute("patient_did", condition.PatientDID),
		),
	)
	return nil
}

// GetCondition retrieves a condition by ID
func (k Keeper) GetCondition(ctx sdk.Context, conditionID []byte) (types.Condition, bool) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(append(ConditionKeyPrefix, conditionID...))
	if bz == nil {
		return types.Condition{}, false
	}
	var condition types.Condition
	k.cdc.MustUnmarshal(bz, &condition)
	return condition, true
}

// VerifyDualSignature verifies Lab + Patient signatures
func (k Keeper) VerifyDualSignature(ctx sdk.Context, dataHash, labSig, patientSig []byte) bool {
	// Placeholder - return true for valid signature lengths
	return len(labSig) >= 65 && len(patientSig) >= 65
}

// TriggerDecryption initiates key share release for a bounty
func (k Keeper) TriggerDecryption(ctx sdk.Context, conditionID []byte, requesterDID, bountyID string) error {
	condition, found := k.GetCondition(ctx, conditionID)
	if !found {
		return fmt.Errorf("condition not found")
	}
	if !condition.IsActive {
		return fmt.Errorf("condition not active")
	}
	if !k.consentKeeper.IsConsentActive(ctx, condition.RecordID, requesterDID) {
		return fmt.Errorf("no active consent")
	}

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("decryption_triggered",
			sdk.NewAttribute("condition_id", fmt.Sprintf("%x", conditionID)),
			sdk.NewAttribute("requester", requesterDID),
		),
	)
	return nil
}

// GetParams returns current module parameters
func (k Keeper) GetParams(ctx sdk.Context) types.Params {
	return types.DefaultParams()
}

func (k Keeper) generateConditionID(patientDID, recordID string, blockHeight int64) []byte {
	data := fmt.Sprintf("%s:%s:%d", patientDID, recordID, blockHeight)
	hash := sha256.Sum256([]byte(data))
	return hash[:16]
}

// GetActiveKeyKeepers returns all active key keepers
func (k Keeper) GetActiveKeyKeepers(ctx sdk.Context) []types.KeyKeeper {
	var keepers []types.KeyKeeper
	store := ctx.KVStore(k.storeKey)
	iterator := sdk.KVStorePrefixIterator(store, KeyKeeperKeyPrefix)
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var keeper types.KeyKeeper
		k.cdc.MustUnmarshal(iterator.Value(), &keeper)
		if keeper.IsActive {
			keepers = append(keepers, keeper)
		}
	}
	return keepers
}

// InitGenesis initializes the module state from genesis
func (k Keeper) InitGenesis(ctx sdk.Context, gs types.GenesisState) {
	for _, keeper := range gs.KeyKeepers {
		store := ctx.KVStore(k.storeKey)
		bz := k.cdc.MustMarshal(&keeper)
		store.Set(append(KeyKeeperKeyPrefix, []byte(keeper.Address)...), bz)
	}
	for _, condition := range gs.Conditions {
		k.RegisterCondition(ctx, condition)
	}
}

// ExportGenesis exports the module state to genesis
func (k Keeper) ExportGenesis(ctx sdk.Context) *types.GenesisState {
	return &types.GenesisState{
		Params:     k.GetParams(ctx),
		KeyKeepers: k.GetActiveKeyKeepers(ctx),
	}
}
