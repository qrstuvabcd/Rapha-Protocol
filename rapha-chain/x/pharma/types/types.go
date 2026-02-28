package types

const (
	ModuleName = "pharma"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// DrugBatch represents a pharmaceutical batch
type DrugBatch struct {
	BatchID        string `json:"batch_id"`
	NDC            string `json:"ndc"` // National Drug Code
	Manufacturer   string `json:"manufacturer"`
	ExpirationDate int64  `json:"expiration_date"`
	SerialNumbers  string `json:"serial_numbers"`
	RegisteredAt   int64  `json:"registered_at"`
	Status         string `json:"status"` // ACTIVE, RECALLED, EXPIRED
}

func (m *DrugBatch) Reset()         { *m = DrugBatch{} }
func (m *DrugBatch) String() string { return "" }
func (m *DrugBatch) ProtoMessage()  {}

// TemperatureRecord for cold chain monitoring
type TemperatureRecord struct {
	BatchID      string  `json:"batch_id"`
	Temperature  float64 `json:"temperature"`
	Location     string  `json:"location"`
	RecordedAt   int64   `json:"recorded_at"`
	SensorID     string  `json:"sensor_id"`
}

func (m *TemperatureRecord) Reset()         { *m = TemperatureRecord{} }
func (m *TemperatureRecord) String() string { return "" }
func (m *TemperatureRecord) ProtoMessage()  {}

// TransferRecord for custody tracking
type TransferRecord struct {
	BatchID       string `json:"batch_id"`
	FromFacility  string `json:"from_facility"`
	ToFacility    string `json:"to_facility"`
	TransferredAt int64  `json:"transferred_at"`
	Signature     []byte `json:"signature"`
}

func (m *TransferRecord) Reset()         { *m = TransferRecord{} }
func (m *TransferRecord) String() string { return "" }
func (m *TransferRecord) ProtoMessage()  {}

// Params defines module parameters
type Params struct {
	MinTemperature float64 `json:"min_temperature"`
	MaxTemperature float64 `json:"max_temperature"`
}

func (p Params) Validate() error { return nil }

func DefaultParams() Params {
	return Params{MinTemperature: 2.0, MaxTemperature: 8.0} // Celsius
}

// GenesisState defines genesis
type GenesisState struct {
	Params  Params      `json:"params"`
	Batches []DrugBatch `json:"batches"`
}

func (m *GenesisState) Reset()         { *m = GenesisState{} }
func (m *GenesisState) String() string { return "" }
func (m *GenesisState) ProtoMessage()  {}
