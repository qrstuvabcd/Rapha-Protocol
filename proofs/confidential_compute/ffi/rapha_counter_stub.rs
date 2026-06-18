//! Rust C-ABI stub for the Rapha enclave counter.
//!
//! This file is not a full SGX/TDX implementation. It documents the exact ABI
//! consumed by `SgxCounterBackend` and provides a local build target for enclave
//! teams to replace with sealed monotonic storage and DCAP/TDX measurement
//! binding. Do not use this stub as a production PHI boundary.

use std::ffi::CStr;
use std::os::raw::c_char;
use std::ptr;
use std::slice;
use std::collections::HashSet;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

#[repr(C)]
struct RaphaCounter {
    epochs_completed: AtomicU64,
    seen_record_digests: Mutex<HashSet<[u8; 32]>>,
    value: AtomicU64,
}

#[no_mangle]
pub extern "C" fn rapha_counter_open(sealed_state_path: *const c_char) -> *mut RaphaCounter {
    if sealed_state_path.is_null() {
        return ptr::null_mut();
    }

    // Force C string validation now. A production enclave would use this path
    // to unseal measurement-bound counter state.
    let path = unsafe { CStr::from_ptr(sealed_state_path) };
    if path.to_bytes().is_empty() {
        return ptr::null_mut();
    }

    Box::into_raw(Box::new(RaphaCounter {
        epochs_completed: AtomicU64::new(0),
        seen_record_digests: Mutex::new(HashSet::new()),
        value: AtomicU64::new(0),
    }))
}

#[no_mangle]
pub extern "C" fn rapha_counter_increment(handle: *mut RaphaCounter, delta: u64) -> i32 {
    if handle.is_null() || delta == 0 {
        return 1;
    }
    let counter = unsafe { &*handle };
    counter.value.fetch_add(delta, Ordering::SeqCst);
    0
}

#[no_mangle]
pub extern "C" fn rapha_counter_observe_record(
    handle: *mut RaphaCounter,
    record_id_digest: *const u8,
    record_id_digest_len: usize,
) -> i32 {
    if handle.is_null() || record_id_digest.is_null() || record_id_digest_len != 32 {
        return 1;
    }

    let counter = unsafe { &*handle };
    let digest_bytes = unsafe { slice::from_raw_parts(record_id_digest, record_id_digest_len) };
    let mut digest = [0_u8; 32];
    digest.copy_from_slice(digest_bytes);

    let Ok(mut seen) = counter.seen_record_digests.lock() else {
        return 2;
    };
    if seen.insert(digest) {
        counter.value.fetch_add(1, Ordering::SeqCst);
    }
    0
}

#[no_mangle]
pub extern "C" fn rapha_counter_mark_epoch(handle: *mut RaphaCounter) -> i32 {
    if handle.is_null() {
        return 1;
    }
    let counter = unsafe { &*handle };
    counter.epochs_completed.fetch_add(1, Ordering::SeqCst);
    0
}

#[no_mangle]
pub extern "C" fn rapha_counter_read(handle: *mut RaphaCounter, out_value: *mut u64) -> i32 {
    if handle.is_null() || out_value.is_null() {
        return 1;
    }
    let counter = unsafe { &*handle };
    unsafe {
        *out_value = counter.value.load(Ordering::SeqCst);
    }
    0
}

#[no_mangle]
pub extern "C" fn rapha_counter_read_epochs(handle: *mut RaphaCounter, out_value: *mut u64) -> i32 {
    if handle.is_null() || out_value.is_null() {
        return 1;
    }
    let counter = unsafe { &*handle };
    unsafe {
        *out_value = counter.epochs_completed.load(Ordering::SeqCst);
    }
    0
}

#[no_mangle]
pub extern "C" fn rapha_counter_close(handle: *mut RaphaCounter) {
    if !handle.is_null() {
        unsafe {
            drop(Box::from_raw(handle));
        }
    }
}
