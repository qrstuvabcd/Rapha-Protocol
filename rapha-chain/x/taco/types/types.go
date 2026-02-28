package types

const (
	ModuleName = "taco"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// Condition represents a TACo access condition
type Condition struct {
	ConditionID []byte `json:"condition_id"`
	PatientDID  string `json:"patient_did"`
	RecordID    string `json:"record_id"`
	Threshold   int    `json:"threshold"` // t in t-of-n
	TotalShares int    `json:"total_shares"` // n in t-of-n
	CreatedAt   int64  `json:"created_at"`
	IsActive    bool   `json:"is_active"`
}

func (m *Condition) Reset()         { *m = Condition{} }
func (m *Condition) String() string { return "" }
func (m *Condition) ProtoMessage()  {}

// KeyKeeper represents a threshold key holder
type KeyKeeper struct {
	Address    string `json:"address"`
	PublicKey  []byte `json:"public_key"`
	ShareIndex int    `json:"share_index"`
	IsActive   bool   `json:"is_active"`
}

func (m *KeyKeeper) Reset()         { *m = KeyKeeper{} }
func (m *KeyKeeper) String() string { return "" }
func (m *KeyKeeper) ProtoMessage()  {}

// Params defines module parameters
type Params struct {
	DefaultThreshold   int `json:"default_threshold"`
	DefaultTotalShares int `json:"default_total_shares"`
}

func (p Params) Validate() error { return nil }

func DefaultParams() Params {
	return Params{DefaultThreshold: 2, DefaultTotalShares: 3}
}

// GenesisState defines genesis
type GenesisState struct {
	Params     Params      `json:"params"`
	KeyKeepers []KeyKeeper `json:"key_keepers"`
	Conditions []Condition `json:"conditions"`
}

func (m *GenesisState) Reset()         { *m = GenesisState{} }
func (m *GenesisState) String() string { return "" }
func (m *GenesisState) ProtoMessage()  {}
