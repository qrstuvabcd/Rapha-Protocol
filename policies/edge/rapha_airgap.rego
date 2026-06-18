package rapha.airgap

import rego.v1

default allow := false

decision := {
	"allow": allow,
	"deny": deny,
	"policy": "rapha-airgap-v1",
}

allow if {
	count(deny) == 0
}

deny contains "phase must be training or proof_submission" if {
	phase := object.get(input, "phase", "")
	phase != "training"
	phase != "proof_submission"
}

deny contains "training phase must use container network_mode none" if {
	input.phase == "training"
	object.get(container, "network_mode", "") != "none"
}

deny contains "training phase blocks all outbound network requests" if {
	input.phase == "training"
	count(egress_requests) > 0
}

deny contains "proof submission must declare exactly one outbound request" if {
	input.phase == "proof_submission"
	count(egress_requests) != 1
}

deny contains msg if {
	input.phase == "proof_submission"
	some request in egress_requests
	lower(object.get(request, "url", "")) != allowed_polygon_rpc_endpoint
	msg := sprintf("proof submission egress must target approved Polygon RPC endpoint: %s", [allowed_polygon_rpc_endpoint])
}

deny contains "proof submission egress must use POST" if {
	input.phase == "proof_submission"
	some request in egress_requests
	upper(object.get(request, "method", "")) != "POST"
}

deny contains "hospital data mount is required at /mnt/hospital_data" if {
	not hospital_data_mount_present
}

deny contains msg if {
	some mount in mounts
	destination := object.get(mount, "destination", "")
	startswith(destination, "/mnt/hospital_data")
	object.get(mount, "readonly", false) != true
	msg := sprintf("hospital data mount must be read-only: %s", [destination])
}

hospital_data_mount_present if {
	some mount in mounts
	object.get(mount, "destination", "") == "/mnt/hospital_data"
}

allowed_polygon_rpc_endpoint := "https://polygon-bor.publicnode.com"

container := object.get(input, "container", {})

network := object.get(input, "network", {})

egress_requests := object.get(network, "egress_requests", [])

mounts := object.get(container, "mounts", [])
