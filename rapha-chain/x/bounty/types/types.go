package types

const (
	ModuleName = "bounty"
	StoreKey   = ModuleName
	RouterKey  = ModuleName
)

// ResearchBounty represents a research data bounty
type ResearchBounty struct {
	BountyID            string `json:"bounty_id"`
	Title               string `json:"title"`
	Description         string `json:"description"`
	Sponsor             string `json:"sponsor"`
	Reward              string `json:"reward"` // Amount in urapha
	TargetParticipants  int64  `json:"target_participants"`
	CurrentParticipants int64  `json:"current_participants"`
	CreatedAt           int64  `json:"created_at"`
	ExpiresAt           int64  `json:"expires_at"`
	ExecutedAt          int64  `json:"executed_at"`
	Status              string `json:"status"` // OPEN, FILLED, EXECUTED, EXPIRED
	DataRequirements    string `json:"data_requirements"`
}

func (m *ResearchBounty) Reset()         { *m = ResearchBounty{} }
func (m *ResearchBounty) String() string { return "" }
func (m *ResearchBounty) ProtoMessage()  {}

// BountyParticipant represents a patient in a bounty
type BountyParticipant struct {
	BountyID    string `json:"bounty_id"`
	PatientDID  string `json:"patient_did"`
	ConditionID []byte `json:"condition_id"`
	JoinedAt    int64  `json:"joined_at"`
	Paid        bool   `json:"paid"`
	PaidAmount  string `json:"paid_amount"`
}

func (m *BountyParticipant) Reset()         { *m = BountyParticipant{} }
func (m *BountyParticipant) String() string { return "" }
func (m *BountyParticipant) ProtoMessage()  {}

// Params defines module parameters
type Params struct {
	PatientRewardShare  int64 `json:"patient_reward_share"`  // Percentage (80 = 80%)
	TreasuryRewardShare int64 `json:"treasury_reward_share"` // Percentage (20 = 20%)
	MinBountyDuration   int64 `json:"min_bounty_duration"`   // In blocks
}

func (p Params) Validate() error { return nil }

func DefaultParams() Params {
	return Params{
		PatientRewardShare:  80,
		TreasuryRewardShare: 20,
		MinBountyDuration:   1000,
	}
}

// GenesisState defines genesis
type GenesisState struct {
	Params   Params           `json:"params"`
	Bounties []ResearchBounty `json:"bounties"`
}

func (m *GenesisState) Reset()         { *m = GenesisState{} }
func (m *GenesisState) String() string { return "" }
func (m *GenesisState) ProtoMessage()  {}
