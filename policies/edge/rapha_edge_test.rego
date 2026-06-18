package rapha.edge

import rego.v1

test_allows_baseline_sgx_lora_job if {
	allow_job with input as baseline_job
}

test_denies_unverified_signature if {
	deny["workload image signature must be verified before execution"] with input as object.union(
		baseline_job,
		{"workload": object.union(baseline_job.workload, {"signature_verified": false})},
	)
}

test_denies_unapproved_egress if {
	deny["egress domain not allowed: attacker.example"] with input as object.union(
		baseline_job,
		{"egress": {"domains": ["polygon-bor.publicnode.com", "attacker.example"], "polygon_contracts": baseline_job.egress.polygon_contracts}},
	)
}

test_denies_raw_phi_output if {
	deny["raw PHI output is forbidden"] with input as object.union(
		baseline_job,
		{"output": object.union(baseline_job.output, {"raw_phi": true})},
	)
}

test_denies_missing_minimum_necessary_attestation if {
	deny["minimum necessary attestation is required for PHI jobs"] with input as object.union(
		baseline_job,
		{"data": object.union(baseline_job.data, {"minimum_necessary_attested": false})},
	)
}

test_denies_unapproved_contract_pack if {
	deny["legal contract pack must be approved before PHI processing"] with input as object.union(
		baseline_job,
		{"compliance": object.union(baseline_job.compliance, {"contract": object.union(baseline_job.compliance.contract, {"status": "pending_legal_review"})})},
	)
}

test_denies_unapproved_legal_control if {
	control_id := "HIPAA-SEC-164.312-B-AUDIT-CONTROLS"
	controls := object.union(
		approved_controls,
		{control_id: object.union(approved_controls[control_id], {"status": "pending"})},
	)
	deny["required legal control missing or not approved: HIPAA-SEC-164.312-B-AUDIT-CONTROLS (45 CFR 164.312(b))"] with input as object.union(
		baseline_job,
		{"compliance": object.union(baseline_job.compliance, {"controls": controls})},
	)
}

baseline_job := {
	"kind": "compute_job",
	"protocol": "rapha-protocol",
	"deployment": "single_edge_ipc",
	"requester": {
		"id": "hospital-security-officer-001",
		"role": "hospital_security_officer",
		"mfa_verified": true,
		"training_current": true,
	},
	"workload": {
		"type": "llm_lora",
		"image": "ghcr.io/rapha-protocol/rapha-llm-lora",
		"image_digest": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		"signature_verified": true,
	},
	"tee": {
		"required": true,
		"type": "sgx",
		"attestation_verified": true,
		"measurement": "mr_enclave_demo_replace_me",
	},
	"data": {
		"classification": "phi",
		"format": "ehr_text",
		"residency": "local_edge_ipc",
		"purpose": "clinical_text_lora_fine_tuning",
		"minimum_necessary_attested": true,
		"dataset_scope": "cohort_limited",
		"retention_days": 30,
		"min_cohort_size": 25,
	},
	"consent": {
		"required": true,
		"verified": true,
	},
	"zktls": {
		"required": true,
		"provider_verified": true,
		"receipt_verified": true,
		"receipt_anchor_chain": "polygon-mainnet",
	},
	"egress": {
		"domains": ["polygon-bor.publicnode.com", "api.reclaimprotocol.org"],
		"polygon_contracts": ["0xB27704CA8A01Bc151181D1d53E2F0eF11B39B32F"],
	},
	"output": {
		"schema": "lora_adapter_only",
		"raw_phi": false,
		"allow_phi_logs": false,
		"files": ["adapter_config.json", "adapter_model.safetensors", "training_metrics.json", "receipt.json"],
	},
	"compliance": {
		"frameworks": ["hipaa", "nhs_dspt"],
		"contract": {
			"status": "approved",
			"baa_or_dpa_executed": true,
			"processing_role": "business_associate",
			"hospital_policy_pack_id": "HOSPITAL-POLICY-PACK-2026-001",
			"signed_contract_uri": "rapha://evidence/contracts/baa-dpa-2026-001.pdf",
			"reviewed_by": "hospital-legal-and-security",
			"reviewed_at": "2026-05-18",
		},
		"controls": approved_controls,
	},
}

approved_controls := {control.id: {
	"status": "approved",
	"evidence_uri": sprintf("rapha://evidence/legal-controls/%s", [control.id]),
	"reviewed_by": "hospital-legal-and-security",
	"reviewed_at": "2026-05-18",
} | control := data.rapha.required_legal_controls[_]}
