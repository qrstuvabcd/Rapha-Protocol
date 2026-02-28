package types

const (
	ModuleName = "labvault"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// EncryptedLabData represents encrypted lab results
type EncryptedLabData struct {
	DataID          string `json:"data_id"`
	PatientDID      string `json:"patient_did"`
	LabDID          string `json:"lab_did"`
	EncryptedData   []byte `json:"encrypted_data"`
	EncryptedAESKey []byte `json:"encrypted_aes_key"`
	DataHash        []byte `json:"data_hash"`
	StoredAt        int64  `json:"stored_at"`
	IsDeleted       bool   `json:"is_deleted"`
	DeletedAt       int64  `json:"deleted_at"`
	DeletionReason  string `json:"deletion_reason"`
	KeyVersion      int    `json:"key_version"`
}

func (m *EncryptedLabData) Reset()         { *m = EncryptedLabData{} }
func (m *EncryptedLabData) String() string { return "" }
func (m *EncryptedLabData) ProtoMessage()  {}

// AccessLog records data access events
type AccessLog struct {
	DataID       string `json:"data_id"`
	RequesterDID string `json:"requester_did"`
	Purpose      string `json:"purpose"`
	AccessedAt   int64  `json:"accessed_at"`
}

func (m *AccessLog) Reset()         { *m = AccessLog{} }
func (m *AccessLog) String() string { return "" }
func (m *AccessLog) ProtoMessage()  {}

// Params defines module parameters
type Params struct {
	RetentionPeriod int64 `json:"retention_period"` // in blocks
	AllowDeletion   bool  `json:"allow_deletion"`   // GDPR Art 17
}

func (p Params) Validate() error { return nil }

func DefaultParams() Params {
	return Params{RetentionPeriod: 0, AllowDeletion: true}
}

// GenesisState defines genesis
type GenesisState struct {
	Params  Params             `json:"params"`
	LabData []EncryptedLabData `json:"lab_data"`
}

func (m *GenesisState) Reset()         { *m = GenesisState{} }
func (m *GenesisState) String() string { return "" }
func (m *GenesisState) ProtoMessage()  {}
