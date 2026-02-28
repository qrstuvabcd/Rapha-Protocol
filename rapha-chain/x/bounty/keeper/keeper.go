package keeper

import (
	"fmt"

	"cosmossdk.io/log"
	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/rapha-chain/rapha/x/bounty/types"
)

// TacoKeeper interface
type TacoKeeper interface {
	TriggerDecryption(ctx sdk.Context, conditionID []byte, requesterDID, bountyID string) error
}

// BankKeeper interface
type BankKeeper interface {
	GetBalance(ctx sdk.Context, addr sdk.AccAddress, denom string) sdk.Coin
	SendCoins(ctx sdk.Context, from, to sdk.AccAddress, amt sdk.Coins) error
	SendCoinsFromAccountToModule(ctx sdk.Context, sAddr sdk.AccAddress, recipientModule string, amt sdk.Coins) error
}

// Keeper of the bounty store
type Keeper struct {
	cdc        codec.BinaryCodec
	storeKey   storetypes.StoreKey
	bankKeeper BankKeeper
	tacoKeeper TacoKeeper
}

// NewKeeper creates a new bounty Keeper instance
func NewKeeper(cdc codec.BinaryCodec, storeKey storetypes.StoreKey, bk BankKeeper, tk TacoKeeper) Keeper {
	return Keeper{cdc: cdc, storeKey: storeKey, bankKeeper: bk, tacoKeeper: tk}
}

// Logger returns a module-specific logger
func (k Keeper) Logger(ctx sdk.Context) log.Logger {
	return ctx.Logger().With("module", fmt.Sprintf("x/%s", types.ModuleName))
}

// Key prefixes
var (
	BountyKeyPrefix      = []byte{0x01}
	ParticipantKeyPrefix = []byte{0x02}
)

// CreateBounty creates a new research bounty
func (k Keeper) CreateBounty(ctx sdk.Context, bounty types.ResearchBounty) error {
	bounty.CreatedAt = ctx.BlockHeight()
	bounty.Status = "OPEN"

	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&bounty)
	store.Set(append(BountyKeyPrefix, []byte(bounty.BountyID)...), bz)

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("bounty_created",
			sdk.NewAttribute("bounty_id", bounty.BountyID),
			sdk.NewAttribute("sponsor", bounty.Sponsor),
		),
	)
	return nil
}

// GetBounty retrieves a bounty by ID
func (k Keeper) GetBounty(ctx sdk.Context, bountyID string) (types.ResearchBounty, bool) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(append(BountyKeyPrefix, []byte(bountyID)...))
	if bz == nil {
		return types.ResearchBounty{}, false
	}
	var bounty types.ResearchBounty
	k.cdc.MustUnmarshal(bz, &bounty)
	return bounty, true
}

// JoinBounty adds a patient to a bounty
func (k Keeper) JoinBounty(ctx sdk.Context, bountyID, patientDID string, conditionID []byte) error {
	bounty, found := k.GetBounty(ctx, bountyID)
	if !found {
		return fmt.Errorf("bounty not found")
	}
	if bounty.Status != "OPEN" {
		return fmt.Errorf("bounty not open")
	}

	participant := types.BountyParticipant{
		BountyID:    bountyID,
		PatientDID:  patientDID,
		ConditionID: conditionID,
		JoinedAt:    ctx.BlockHeight(),
		Paid:        false,
	}

	store := ctx.KVStore(k.storeKey)
	key := fmt.Sprintf("%s:%s", bountyID, patientDID)
	bz := k.cdc.MustMarshal(&participant)
	store.Set(append(ParticipantKeyPrefix, []byte(key)...), bz)

	bounty.CurrentParticipants++
	k.updateBounty(ctx, bounty)

	if bounty.CurrentParticipants >= bounty.TargetParticipants {
		bounty.Status = "FILLED"
		k.updateBounty(ctx, bounty)
	}

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("patient_joined_bounty",
			sdk.NewAttribute("bounty_id", bountyID),
			sdk.NewAttribute("patient_did", patientDID),
		),
	)
	return nil
}

// ExecuteBounty executes a filled bounty (80/20 split)
func (k Keeper) ExecuteBounty(ctx sdk.Context, bountyID, executor string) error {
	bounty, found := k.GetBounty(ctx, bountyID)
	if !found {
		return fmt.Errorf("bounty not found")
	}
	if bounty.Status != "FILLED" {
		return fmt.Errorf("bounty not ready for execution")
	}

	// Trigger decryption for all participants
	participants := k.getParticipants(ctx, bountyID)
	for _, p := range participants {
		k.tacoKeeper.TriggerDecryption(ctx, p.ConditionID, bounty.Sponsor, bountyID)
	}

	bounty.Status = "EXECUTED"
	bounty.ExecutedAt = ctx.BlockHeight()
	k.updateBounty(ctx, bounty)

	ctx.EventManager().EmitEvent(
		sdk.NewEvent("bounty_executed",
			sdk.NewAttribute("bounty_id", bountyID),
			sdk.NewAttribute("executor", executor),
		),
	)
	return nil
}

// GetParams returns current module parameters
func (k Keeper) GetParams(ctx sdk.Context) types.Params {
	return types.DefaultParams()
}

func (k Keeper) updateBounty(ctx sdk.Context, bounty types.ResearchBounty) {
	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&bounty)
	store.Set(append(BountyKeyPrefix, []byte(bounty.BountyID)...), bz)
}

func (k Keeper) getParticipants(ctx sdk.Context, bountyID string) []types.BountyParticipant {
	var participants []types.BountyParticipant
	store := ctx.KVStore(k.storeKey)
	prefix := append(ParticipantKeyPrefix, []byte(bountyID+":")...)
	iterator := sdk.KVStorePrefixIterator(store, prefix)
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var p types.BountyParticipant
		k.cdc.MustUnmarshal(iterator.Value(), &p)
		participants = append(participants, p)
	}
	return participants
}

// InitGenesis initializes the module state from genesis
func (k Keeper) InitGenesis(ctx sdk.Context, gs types.GenesisState) {
	for _, bounty := range gs.Bounties {
		k.CreateBounty(ctx, bounty)
	}
}

// ExportGenesis exports the module state to genesis
func (k Keeper) ExportGenesis(ctx sdk.Context) *types.GenesisState {
	var bounties []types.ResearchBounty
	store := ctx.KVStore(k.storeKey)
	iterator := sdk.KVStorePrefixIterator(store, BountyKeyPrefix)
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var bounty types.ResearchBounty
		k.cdc.MustUnmarshal(iterator.Value(), &bounty)
		bounties = append(bounties, bounty)
	}
	return &types.GenesisState{
		Params:   k.GetParams(ctx),
		Bounties: bounties,
	}
}
