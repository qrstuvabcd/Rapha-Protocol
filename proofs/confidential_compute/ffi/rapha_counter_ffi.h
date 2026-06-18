#pragma once

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// Opaque enclave-owned counter handle. Callers must never dereference it.
typedef void *rapha_counter_handle_t;

// Opens or creates sealed counter state. The implementation must bind the
// sealed state to the SGX/TDX measurement so a copied file cannot be replayed
// into a different enclave identity.
rapha_counter_handle_t rapha_counter_open(const char *sealed_state_path);

// Atomically increments the monotonic processed-record counter.
// This is only for demo loaders that cannot expose stable record IDs.
// Production clinical workloads should call rapha_counter_observe_record.
// Returns 0 on success; non-zero values are fatal policy failures.
int rapha_counter_increment(rapha_counter_handle_t handle, uint64_t delta);

// Records a SHA-256 digest of a stable clinical record identifier.
// The enclave must maintain the unique set and increment the protected
// processed-record counter only the first time the digest is observed.
// `record_id_digest` must be exactly 32 bytes for SHA-256.
int rapha_counter_observe_record(
    rapha_counter_handle_t handle,
    const uint8_t *record_id_digest,
    size_t record_id_digest_len
);

// Atomically marks one completed full pass over the wrapped training loader.
// This supports optional compute rental pricing:
// cost = unique_records * price_per_record + epochs * price_per_compute_epoch.
int rapha_counter_mark_epoch(rapha_counter_handle_t handle);

// Reads the current counter value into out_value.
// Returns 0 on success; non-zero values are fatal policy failures.
int rapha_counter_read(rapha_counter_handle_t handle, uint64_t *out_value);

// Reads the completed epoch count into out_value.
// Returns 0 on success; non-zero values are fatal policy failures.
int rapha_counter_read_epochs(rapha_counter_handle_t handle, uint64_t *out_value);

// Flushes/seals state and releases enclave resources.
void rapha_counter_close(rapha_counter_handle_t handle);

#ifdef __cplusplus
}
#endif
