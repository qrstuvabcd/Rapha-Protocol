package types

const (
	ModuleName = "registry"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// MedicalRecord represents a medical record
type MedicalRecord struct {
	RecordID         string `json:"record_id"`
	OwnerDID         string `json:"owner_did"`
	ProviderDID      string `json:"provider_did"`
	RecordType       string `json:"record_type"`
	EncryptedDataCID string `json:"encrypted_data_cid"`
	MetadataHash     []byte `json:"metadata_hash"`
	LabSignature     []byte `json:"lab_signature"`
	PatientSignature []byte `json:"patient_signature"`
	RegisteredAt     int64  `json:"registered_at"`
	UpdatedAt        int64  `json:"updated_at"`
	IsActive         bool   `json:"is_active"`
}

func (m *MedicalRecord) Reset()         { *m = MedicalRecord{} }
func (m *MedicalRecord) String() string { return "" }
func (m *MedicalRecord) ProtoMessage()  {}

// Params defines module parameters
type Params struct {
	RequireDualSignature bool `json:"require_dual_signature"`
}

func (p Params) Validate() error { return nil }

func DefaultParams() Params {
	return Params{RequireDualSignature: true}
}

// GenesisState defines genesis
type GenesisState struct {
	Params  Params          `json:"params"`
	Records []MedicalRecord `json:"records"`
}

func (m *GenesisState) Reset()         { *m = GenesisState{} }
func (m *GenesisState) String() string { return "" }
func (m *GenesisState) ProtoMessage()  {}
