package types

const (
	ModuleName = "consent"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

var (
	ConsentRecordKeyPrefix = []byte{0x01}
	ConsentBitKeyPrefix    = []byte{0x02}
	PatientDIDKeyPrefix    = []byte{0x03}
	ParamsKey              = []byte{0x04}
)

func ConsentRecordKey(recordID string) []byte {
	return append(ConsentRecordKeyPrefix, []byte(recordID)...)
}

func ConsentBitKey(recordID, requesterDID string) []byte {
	return append(ConsentBitKeyPrefix, []byte(recordID+":"+requesterDID)...)
}

func PatientDIDKey(did string) []byte {
	return append(PatientDIDKeyPrefix, []byte(did)...)
}

// ConsentRecord stores consent information
type ConsentRecord struct {
	PatientDID     string   `json:"patient_did"`
	RecordID       string   `json:"record_id"`
	PLONKProof     []byte   `json:"plonk_proof"`
	Signature      []byte   `json:"signature"`
	GrantedAt      int64    `json:"granted_at"`
	ExpiresAt      int64    `json:"expires_at"`
	AuthorizedDIDs []string `json:"authorized_dids"`
	PublicInputs   []byte   `json:"public_inputs"`
}

func (m *ConsentRecord) Reset()         { *m = ConsentRecord{} }
func (m *ConsentRecord) String() string { return "" }
func (m *ConsentRecord) ProtoMessage()  {}

// ConsentBit is a quick lookup for consent status
type ConsentBit struct {
	RecordID     string `json:"record_id"`
	RequesterDID string `json:"requester_did"`
	IsActive     bool   `json:"is_active"`
}

func (m *ConsentBit) Reset()         { *m = ConsentBit{} }
func (m *ConsentBit) String() string { return "" }
func (m *ConsentBit) ProtoMessage()  {}

// Params defines module parameters
type Params struct {
	MaxConsentDuration int64 `json:"max_consent_duration"`
	RequirePLONKProof  bool  `json:"require_plonk_proof"`
}

func (m *Params) Reset()         { *m = Params{} }
func (m *Params) String() string { return "" }
func (m *Params) ProtoMessage()  {}

func (p Params) Validate() error { return nil }

func DefaultParams() Params {
	return Params{
		MaxConsentDuration: 365 * 24 * 60 * 60, // 1 year in seconds
		RequirePLONKProof:  true,
	}
}

// GenesisState defines the genesis state
type GenesisState struct {
	Params         Params          `json:"params"`
	ConsentRecords []ConsentRecord `json:"consent_records"`
	ConsentBits    []ConsentBit    `json:"consent_bits"`
	RegisteredDIDs []string        `json:"registered_dids"`
}

func (m *GenesisState) Reset()         { *m = GenesisState{} }
func (m *GenesisState) String() string { return "" }
func (m *GenesisState) ProtoMessage()  {}

// Message types
type MsgGrantConsent struct {
	PatientDID     string   `json:"patient_did"`
	RecordID       string   `json:"record_id"`
	PLONKProof     []byte   `json:"plonk_proof"`
	Signature      []byte   `json:"signature"`
	ExpiresAt      int64    `json:"expires_at"`
	AuthorizedDIDs []string `json:"authorized_dids"`
	PublicInputs   []byte   `json:"public_inputs"`
}

type MsgRevokeConsent struct {
	PatientDID   string `json:"patient_did"`
	RecordID     string `json:"record_id"`
	RequesterDID string `json:"requester_did"`
}

type MsgRegisterPatientDID struct {
	PatientDID    string `json:"patient_did"`
	IdentityProof []byte `json:"identity_proof"`
}
