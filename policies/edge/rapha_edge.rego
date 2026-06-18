package rapha.edge

import rego.v1

default allow_job := false

decision := {
	"allow": allow_job,
	"deny": deny,
	"policy": "rapha-edge-ipc-v1",
	"pilot": "single-edge-ipc-sgx-llm-lora",
}

allow_job if {
	count(deny) == 0
}

deny contains "request kind must be compute_job" if {
	input.kind != "compute_job"
}

deny contains "protocol must be rapha-protocol" if {
	input.protocol != "rapha-protocol"
}

deny contains "deployment must be single_edge_ipc" if {
	input.deployment != "single_edge_ipc"
}

deny contains "workload type is not approved" if {
	not allowed_workload_type(input.workload.type)
}

deny contains "workload image must come from GHCR" if {
	not startswith(input.workload.image, "ghcr.io/")
}

deny contains "workload image digest is required" if {
	not valid_sha256_digest(input.workload.image_digest)
}

deny contains "workload image signature must be verified before execution" if {
	input.workload.signature_verified != true
}

deny contains "TEE attestation must be verified before PHI execution" if {
	input.tee.required == true
	input.tee.attestation_verified != true
}

deny contains "TEE type must be sgx or tdx" if {
	not allowed_tee_type(input.tee.type)
}

deny contains "TEE measurement is required" if {
	input.tee.required == true
	not has_nonempty_string(input.tee.measurement)
}

deny contains "data must remain local to the edge IPC" if {
	input.data.residency != "local_edge_ipc"
}

deny contains "data purpose must be approved for this pilot" if {
	not allowed_data_purpose(object.get(job_data, "purpose", ""))
}

deny contains "minimum necessary attestation is required for PHI jobs" if {
	job_data.classification == "phi"
	object.get(job_data, "minimum_necessary_attested", false) != true
}

deny contains "dataset scope must be cohort_limited" if {
	object.get(job_data, "dataset_scope", "") != "cohort_limited"
}

deny contains "PHI retention days must be positive" if {
	object.get(job_data, "retention_days", -1) <= 0
}

deny contains "PHI retention exceeds approved pilot maximum" if {
	object.get(job_data, "retention_days", -1) > data.rapha.max_phi_retention_days
}

deny contains "data format is not approved" if {
	not allowed_data_format(input.data.format)
}

deny contains "minimum cohort size is too small for EHR text fine-tuning" if {
	input.data.min_cohort_size < data.rapha.min_cohort_size
}

deny contains "patient or institution consent must be verified" if {
	input.consent.required == true
	input.consent.verified != true
}

deny contains "ZK-TLS proof must be required" if {
	input.zktls.required != true
}

deny contains "ZK-TLS provider verification must pass" if {
	input.zktls.provider_verified != true
}

deny contains "ZK-TLS receipt verification must pass" if {
	object.get(zktls, "receipt_verified", false) != true
}

deny contains "ZK-TLS receipts must be anchored to Polygon Mainnet" if {
	object.get(zktls, "receipt_anchor_chain", "") != "polygon-mainnet"
}

deny contains "output schema must be LoRA adapter only" if {
	input.output.schema != "lora_adapter_only"
}

deny contains "raw PHI output is forbidden" if {
	input.output.raw_phi == true
}

deny contains "PHI-bearing logs are forbidden" if {
	input.output.allow_phi_logs == true
}

deny contains "requester identity is required" if {
	not has_nonempty_string(object.get(requester, "id", ""))
}

deny contains "requester role is not approved for PHI workload launch" if {
	not allowed_requester_role(object.get(requester, "role", ""))
}

deny contains "requester MFA must be verified" if {
	object.get(requester, "mfa_verified", false) != true
}

deny contains "requester security training must be current" if {
	object.get(requester, "training_current", false) != true
}

deny contains "HIPAA and NHS DSPT frameworks must both be enabled for this pilot" if {
	framework := data.rapha.required_regulatory_frameworks[_]
	not framework_enabled(framework)
}

deny contains "legal contract pack must be approved before PHI processing" if {
	object.get(contract, "status", "") != "approved"
}

deny contains "BAA or DPA must be executed before PHI processing" if {
	object.get(contract, "baa_or_dpa_executed", false) != true
}

deny contains "processing role must be a supported legal role" if {
	not allowed_processing_role(object.get(contract, "processing_role", ""))
}

deny contains "hospital policy pack id is required" if {
	not valid_non_placeholder_string(object.get(contract, "hospital_policy_pack_id", ""))
}

deny contains "signed legal contract evidence is required" if {
	not valid_evidence_uri(object.get(contract, "signed_contract_uri", ""))
}

deny contains "legal review owner is required" if {
	not valid_non_placeholder_string(object.get(contract, "reviewed_by", ""))
}

deny contains "legal review date is required" if {
	not valid_date_or_datetime(object.get(contract, "reviewed_at", ""))
}

deny contains msg if {
	control := data.rapha.required_legal_controls[_]
	not legal_control_approved(control.id)
	msg := sprintf("required legal control missing or not approved: %s (%s)", [control.id, control.citation])
}

deny contains msg if {
	some domain in input.egress.domains
	not allowed_egress_domain(domain)
	msg := sprintf("egress domain not allowed: %s", [domain])
}

deny contains msg if {
	some contract in input.egress.polygon_contracts
	not allowed_polygon_contract(lower(contract))
	msg := sprintf("polygon contract not allowed: %s", [contract])
}

deny contains msg if {
	some filename in input.output.files
	not allowed_output_file(filename)
	msg := sprintf("output file not allowed: %s", [filename])
}

allowed_tee_type(value) if {
	value == "sgx"
}

allowed_tee_type(value) if {
	value == "tdx"
}

allowed_egress_domain(domain) if {
	data.rapha.allowed_egress_domains[_] == lower(domain)
}

allowed_polygon_contract(contract) if {
	data.rapha.allowed_polygon_contracts[_] == contract
}

allowed_output_file(filename) if {
	data.rapha.allowed_output_files[_] == filename
}

allowed_data_purpose(purpose) if {
	data.rapha.allowed_data_purposes[_] == purpose
}

allowed_data_format(format) if {
	data.rapha.allowed_data_formats[_] == format
}

allowed_workload_type(workload_type) if {
	data.rapha.allowed_workload_types[_] == workload_type
}

allowed_requester_role(role) if {
	data.rapha.allowed_requester_roles[_] == role
}

allowed_processing_role(role) if {
	data.rapha.allowed_processing_roles[_] == role
}

framework_enabled(framework) if {
	compliance.frameworks[_] == framework
}

legal_control_approved(control_id) if {
	control := object.get(legal_controls, control_id, {})
	control.status == "approved"
	valid_evidence_uri(object.get(control, "evidence_uri", ""))
	valid_non_placeholder_string(object.get(control, "reviewed_by", ""))
	valid_date_or_datetime(object.get(control, "reviewed_at", ""))
}

valid_sha256_digest(value) if {
	is_string(value)
	regex.match("^sha256:[a-f0-9]{64}$", value)
}

has_nonempty_string(value) if {
	is_string(value)
	count(value) > 0
}

valid_non_placeholder_string(value) if {
	has_nonempty_string(value)
	not startswith(lower(value), "replace")
}

valid_evidence_uri(value) if {
	valid_non_placeholder_string(value)
	regex.match("^(rapha://|s3://|gs://|https://|ipfs://|file://).+", value)
}

valid_date_or_datetime(value) if {
	is_string(value)
	regex.match("^[0-9]{4}-[0-9]{2}-[0-9]{2}([tT][0-9]{2}:[0-9]{2}:[0-9]{2}(Z|[+-][0-9]{2}:[0-9]{2})?)?$", value)
}

compliance := object.get(input, "compliance", {})

contract := object.get(compliance, "contract", {})

legal_controls := object.get(compliance, "controls", {})

job_data := object.get(input, "data", {})

requester := object.get(input, "requester", {})

zktls := object.get(input, "zktls", {})
