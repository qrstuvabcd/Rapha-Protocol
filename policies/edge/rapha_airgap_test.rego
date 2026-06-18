package rapha.airgap_test

import rego.v1

import data.rapha.airgap.allow
import data.rapha.airgap.deny

test_allows_airgapped_training if {
	allow with input as training_input
}

test_denies_training_egress if {
	deny["training phase blocks all outbound network requests"] with input as object.union(
		training_input,
		{"network": {"egress_requests": [{"url": "https://polygon-bor.publicnode.com", "method": "POST"}]}},
	)
}

test_denies_writable_hospital_mount if {
	deny["hospital data mount must be read-only: /mnt/hospital_data"] with input as object.union(
		training_input,
		{"container": {"network_mode": "none", "mounts": [{"destination": "/mnt/hospital_data", "readonly": false}]}},
	)
}

test_allows_single_polygon_proof_submission if {
	allow with input as proof_submission_input
}

test_denies_unapproved_proof_endpoint if {
	deny["proof submission egress must target approved Polygon RPC endpoint: https://polygon-bor.publicnode.com"] with input as object.union(
		proof_submission_input,
		{"network": {"egress_requests": [{"url": "https://attacker.example", "method": "POST"}]}},
	)
}

training_input := {
	"phase": "training",
	"container": {
		"network_mode": "none",
		"mounts": [{"destination": "/mnt/hospital_data", "readonly": true}],
	},
	"network": {"egress_requests": []},
}

proof_submission_input := {
	"phase": "proof_submission",
	"container": {
		"network_mode": "bridge",
		"mounts": [{"destination": "/mnt/hospital_data", "readonly": true}],
	},
	"network": {
		"egress_requests": [{"url": "https://polygon-bor.publicnode.com", "method": "POST"}],
	},
}
