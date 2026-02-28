package keeper

import (
	"fmt"

	"cosmossdk.io/log"
	storetypes "cosmossdk.io/store/types"
	"github.com/cosmos/cosmos-sdk/codec"
	sdk "github.com/cosmos/cosmos-sdk/types"

	"github.com/rapha-chain/rapha/x/consent/types"
)

// AccountKeeper interface for account operations
type AccountKeeper interface {
	GetAccount(ctx sdk.Context, addr sdk.AccAddress) sdk.AccountI
}

// Keeper of the consent store
// This is the core PoMC (Proof of Medical Consent) keeper
type Keeper struct {
	cdc           codec.BinaryCodec
	storeKey      storetypes.StoreKey
	accountKeeper AccountKeeper

	// Paymaster address for gasless patient transactions
	paymasterAddr sdk.AccAddress
}

// NewKeeper creates a new consent Keeper instance
func NewKeeper(
	cdc codec.BinaryCodec,
	storeKey storetypes.StoreKey,
	ak AccountKeeper,
) Keeper {
	// Derive paymaster address from module account
	// Using a deterministic address for the paymaster
	paymasterAddr := sdk.AccAddress([]byte("rapha_paymaster_____"))

	return Keeper{
		cdc:           cdc,
		storeKey:      storeKey,
		accountKeeper: ak,
		paymasterAddr: paymasterAddr,
	}
}

// Logger returns a module-specific logger
func (k Keeper) Logger(ctx sdk.Context) log.Logger {
	return ctx.Logger().With("module", fmt.Sprintf("x/%s", types.ModuleName))
}

// =========================================
// Consent Record Management
// =========================================

// SetConsentRecord stores a consent record
func (k Keeper) SetConsentRecord(ctx sdk.Context, record types.ConsentRecord) {
	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&record)
	store.Set(types.ConsentRecordKey(record.RecordID), bz)
}

// GetConsentRecord retrieves a consent record by record ID
func (k Keeper) GetConsentRecord(ctx sdk.Context, recordID string) (types.ConsentRecord, bool) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(types.ConsentRecordKey(recordID))
	if bz == nil {
		return types.ConsentRecord{}, false
	}

	var record types.ConsentRecord
	k.cdc.MustUnmarshal(bz, &record)
	return record, true
}

// DeleteConsentRecord removes a consent record
func (k Keeper) DeleteConsentRecord(ctx sdk.Context, recordID string) {
	store := ctx.KVStore(k.storeKey)
	store.Delete(types.ConsentRecordKey(recordID))
}

// =========================================
// Consent Bit Management (Quick Lookups)
// =========================================

// SetConsentBit sets the consent bit for a specific record/requester pair
func (k Keeper) SetConsentBit(ctx sdk.Context, bit types.ConsentBit) {
	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&bit)
	store.Set(types.ConsentBitKey(bit.RecordID, bit.RequesterDID), bz)
}

// GetConsentBit retrieves a consent bit
func (k Keeper) GetConsentBit(ctx sdk.Context, recordID, requesterDID string) (types.ConsentBit, bool) {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(types.ConsentBitKey(recordID, requesterDID))
	if bz == nil {
		return types.ConsentBit{}, false
	}

	var bit types.ConsentBit
	k.cdc.MustUnmarshal(bz, &bit)
	return bit, true
}

// IsConsentActive checks if consent is active for a specific requester
// This is the key function used by the PoMC ante handler
func (k Keeper) IsConsentActive(ctx sdk.Context, recordID, requesterDID string) bool {
	bit, found := k.GetConsentBit(ctx, recordID, requesterDID)
	if !found {
		return false
	}

	// Check if consent has expired
	record, found := k.GetConsentRecord(ctx, recordID)
	if !found {
		return false
	}

	if record.ExpiresAt > 0 && ctx.BlockHeight() > record.ExpiresAt {
		// Consent has expired - deactivate the bit
		bit.IsActive = false
		k.SetConsentBit(ctx, bit)
		return false
	}

	return bit.IsActive
}

// RevokeConsentBit deactivates consent for a specific requester
func (k Keeper) RevokeConsentBit(ctx sdk.Context, recordID, requesterDID string) {
	bit, found := k.GetConsentBit(ctx, recordID, requesterDID)
	if found {
		bit.IsActive = false
		k.SetConsentBit(ctx, bit)
	}
}

// RevokeConsent is for x/labvault - revokes all consent for a record
func (k Keeper) RevokeConsent(ctx sdk.Context, recordID, patientDID string) {
	record, found := k.GetConsentRecord(ctx, recordID)
	if !found {
		return
	}
	if record.PatientDID != patientDID {
		return
	}
	// Revoke all bits for this record
	for _, did := range record.AuthorizedDIDs {
		k.RevokeConsentBit(ctx, recordID, did)
	}
}

// =========================================
// Patient DID Management (Gasless Transactions)
// =========================================

// RegisterPatientDID registers a patient DID for gasless transactions
func (k Keeper) RegisterPatientDID(ctx sdk.Context, patientDID string) {
	store := ctx.KVStore(k.storeKey)
	store.Set(types.PatientDIDKey(patientDID), []byte{1})
}

// IsPatientDID checks if an address is a registered patient DID
func (k Keeper) IsPatientDID(ctx sdk.Context, did string) bool {
	store := ctx.KVStore(k.storeKey)
	return store.Has(types.PatientDIDKey(did))
}

// GetPaymasterAddress returns the paymaster address for gasless transactions
func (k Keeper) GetPaymasterAddress(ctx sdk.Context) sdk.AccAddress {
	return k.paymasterAddr
}

// =========================================
// Parameters Management
// =========================================

// GetParams returns the current module parameters
func (k Keeper) GetParams(ctx sdk.Context) types.Params {
	store := ctx.KVStore(k.storeKey)
	bz := store.Get(types.ParamsKey)
	if bz == nil {
		return types.DefaultParams()
	}

	var params types.Params
	k.cdc.MustUnmarshal(bz, &params)
	return params
}

// SetParams sets the module parameters
func (k Keeper) SetParams(ctx sdk.Context, params types.Params) error {
	if err := params.Validate(); err != nil {
		return err
	}

	store := ctx.KVStore(k.storeKey)
	bz := k.cdc.MustMarshal(&params)
	store.Set(types.ParamsKey, bz)
	return nil
}

// =========================================
// Message Handlers
// =========================================

// GrantConsent handles the MsgGrantConsent message
func (k Keeper) GrantConsent(ctx sdk.Context, msg *types.MsgGrantConsent) error {
	// Create consent record
	record := types.ConsentRecord{
		PatientDID:     msg.PatientDID,
		RecordID:       msg.RecordID,
		PLONKProof:     msg.PLONKProof,
		Signature:      msg.Signature,
		GrantedAt:      ctx.BlockHeight(),
		ExpiresAt:      msg.ExpiresAt,
		AuthorizedDIDs: msg.AuthorizedDIDs,
		PublicInputs:   msg.PublicInputs,
	}

	// Store consent record
	k.SetConsentRecord(ctx, record)

	// Set consent bits for all authorized DIDs
	for _, authorizedDID := range msg.AuthorizedDIDs {
		bit := types.ConsentBit{
			RecordID:     msg.RecordID,
			RequesterDID: authorizedDID,
			IsActive:     true,
		}
		k.SetConsentBit(ctx, bit)
	}

	// Emit event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			"consent_granted",
			sdk.NewAttribute("patient_did", msg.PatientDID),
			sdk.NewAttribute("record_id", msg.RecordID),
			sdk.NewAttribute("authorized_count", fmt.Sprintf("%d", len(msg.AuthorizedDIDs))),
		),
	)

	k.Logger(ctx).Info(
		"Consent granted via PLONK proof",
		"patient", msg.PatientDID,
		"record", msg.RecordID,
		"authorized", msg.AuthorizedDIDs,
	)

	return nil
}

// RevokeConsentMsg handles the MsgRevokeConsent message
func (k Keeper) RevokeConsentMsg(ctx sdk.Context, msg *types.MsgRevokeConsent) error {
	// Verify the patient owns this record
	record, found := k.GetConsentRecord(ctx, msg.RecordID)
	if !found {
		return fmt.Errorf("consent record not found: %s", msg.RecordID)
	}

	if record.PatientDID != msg.PatientDID {
		return fmt.Errorf("unauthorized: only patient can revoke consent")
	}

	// Revoke consent bit
	k.RevokeConsentBit(ctx, msg.RecordID, msg.RequesterDID)

	// Emit event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			"consent_revoked",
			sdk.NewAttribute("patient_did", msg.PatientDID),
			sdk.NewAttribute("record_id", msg.RecordID),
			sdk.NewAttribute("requester_did", msg.RequesterDID),
		),
	)

	k.Logger(ctx).Info(
		"Consent revoked",
		"patient", msg.PatientDID,
		"record", msg.RecordID,
		"requester", msg.RequesterDID,
	)

	return nil
}

// RegisterPatientDIDHandler handles the MsgRegisterPatientDID message
func (k Keeper) RegisterPatientDIDHandler(ctx sdk.Context, msg *types.MsgRegisterPatientDID) error {
	k.RegisterPatientDID(ctx, msg.PatientDID)

	// Emit event
	ctx.EventManager().EmitEvent(
		sdk.NewEvent(
			"patient_did_registered",
			sdk.NewAttribute("patient_did", msg.PatientDID),
		),
	)

	k.Logger(ctx).Info(
		"Patient DID registered for gasless transactions",
		"patient_did", msg.PatientDID,
	)

	return nil
}

// =========================================
// Genesis
// =========================================

// InitGenesis initializes the module state from genesis
func (k Keeper) InitGenesis(ctx sdk.Context, gs types.GenesisState) {
	k.SetParams(ctx, gs.Params)

	for _, record := range gs.ConsentRecords {
		k.SetConsentRecord(ctx, record)
	}

	for _, bit := range gs.ConsentBits {
		k.SetConsentBit(ctx, bit)
	}

	for _, did := range gs.RegisteredDIDs {
		k.RegisterPatientDID(ctx, did)
	}
}

// ExportGenesis exports the module state to genesis
func (k Keeper) ExportGenesis(ctx sdk.Context) *types.GenesisState {
	return &types.GenesisState{
		Params:         k.GetParams(ctx),
		ConsentRecords: k.getAllConsentRecords(ctx),
		ConsentBits:    k.getAllConsentBits(ctx),
		RegisteredDIDs: k.getAllPatientDIDs(ctx),
	}
}

// getAllConsentRecords returns all consent records
func (k Keeper) getAllConsentRecords(ctx sdk.Context) []types.ConsentRecord {
	var records []types.ConsentRecord
	store := ctx.KVStore(k.storeKey)
	iterator := sdk.KVStorePrefixIterator(store, types.ConsentRecordKeyPrefix)
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var record types.ConsentRecord
		k.cdc.MustUnmarshal(iterator.Value(), &record)
		records = append(records, record)
	}
	return records
}

// getAllConsentBits returns all consent bits
func (k Keeper) getAllConsentBits(ctx sdk.Context) []types.ConsentBit {
	var bits []types.ConsentBit
	store := ctx.KVStore(k.storeKey)
	iterator := sdk.KVStorePrefixIterator(store, types.ConsentBitKeyPrefix)
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		var bit types.ConsentBit
		k.cdc.MustUnmarshal(iterator.Value(), &bit)
		bits = append(bits, bit)
	}
	return bits
}

// getAllPatientDIDs returns all registered patient DIDs
func (k Keeper) getAllPatientDIDs(ctx sdk.Context) []string {
	var dids []string
	store := ctx.KVStore(k.storeKey)
	iterator := sdk.KVStorePrefixIterator(store, types.PatientDIDKeyPrefix)
	defer iterator.Close()

	for ; iterator.Valid(); iterator.Next() {
		// Extract DID from key
		key := iterator.Key()
		did := string(key[len(types.PatientDIDKeyPrefix):])
		dids = append(dids, did)
	}
	return dids
}
