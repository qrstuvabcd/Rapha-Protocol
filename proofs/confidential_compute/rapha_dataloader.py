"""RaphaDataLoader: a confidential-compute turnstile for PyTorch batches.

Payment accounting is based on unique data consumption:

    cost = unique_records * price_per_record + epochs_completed * price_per_compute_epoch

The DataLoader therefore tracks two protected values before settlement:
1. unique records released to the model; and
2. completed full passes over the wrapped loader.

In production, both counters must be managed by an SGX/TDX enclave or an
enclave-linked shared object. Python code receives read-only snapshots; it must
not own the mutable settlement state.
"""

from __future__ import annotations

import ctypes
import hashlib
import threading
from collections.abc import Callable, Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterator, Protocol


RecordIdExtractor = Callable[[Any], Iterable[str]]


class CounterBackend(Protocol):
    """Interface implemented by simulated and SGX-backed accounting backends."""

    def observe_record_ids(self, record_ids: Iterable[str]) -> int:
        """Record observed IDs and return the unique processed-record count."""

    def increment(self, delta: int) -> int:
        """Fallback monotonic increment for non-unique local demos."""

    def mark_epoch_completed(self) -> int:
        """Atomically mark one complete loader pass."""

    def read(self) -> int:
        """Read unique processed-record count."""

    def read_epochs(self) -> int:
        """Read completed epoch count."""


@dataclass(frozen=True)
class CounterSnapshot:
    """Auditable counter state returned to receipt/proof generation."""

    processed_records_count: int
    epochs_completed: int
    backend: str
    isolation_level: str


class InProcessEnclaveCounter:
    """Thread-safe simulation of enclave-owned accounting state.

    This backend is deterministic and useful for tests. It is not a production
    security boundary because Python process memory is not isolated from model
    code. Production PHI workloads must use `SgxCounterBackend` or equivalent.
    """

    __slots__ = ("_epochs_completed", "_lock", "_seen_record_hashes", "_value")

    def __init__(self, initial_value: int = 0, initial_epochs: int = 0) -> None:
        if initial_value < 0 or initial_epochs < 0:
            raise ValueError("initial counters must be non-negative")
        self._lock = threading.Lock()
        self._value = int(initial_value)
        self._epochs_completed = int(initial_epochs)
        self._seen_record_hashes: set[bytes] = set()

    def observe_record_ids(self, record_ids: Iterable[str]) -> int:
        hashes = [_record_id_hash(record_id) for record_id in record_ids]
        if not hashes:
            raise ValueError("at least one record id is required")

        with self._lock:
            for digest in hashes:
                if digest not in self._seen_record_hashes:
                    self._seen_record_hashes.add(digest)
                    self._value += 1
            return self._value

    def increment(self, delta: int) -> int:
        if delta <= 0:
            raise ValueError("delta must be positive")
        with self._lock:
            self._value += int(delta)
            return self._value

    def mark_epoch_completed(self) -> int:
        with self._lock:
            self._epochs_completed += 1
            return self._epochs_completed

    def read(self) -> int:
        with self._lock:
            return self._value

    def read_epochs(self) -> int:
        with self._lock:
            return self._epochs_completed


class SgxCounterBackend:
    """ctypes binding for the enclave counter C ABI.

    The shared object should implement the ABI in
    `ffi/rapha_counter_ffi.h`. Python only receives an opaque handle. The
    unique-record set, epoch counter, sealing key, and attested measurement
    remain inside the trusted boundary.
    """

    __slots__ = ("_handle", "_lib")

    def __init__(self, shared_object_path: str | Path, sealed_state_path: str | Path) -> None:
        self._lib = ctypes.CDLL(str(shared_object_path))
        self._configure_abi()

        handle = self._lib.rapha_counter_open(str(sealed_state_path).encode("utf-8"))
        if not handle:
            raise RuntimeError("rapha_counter_open failed")
        self._handle = handle

    def _configure_abi(self) -> None:
        self._lib.rapha_counter_open.argtypes = [ctypes.c_char_p]
        self._lib.rapha_counter_open.restype = ctypes.c_void_p
        self._lib.rapha_counter_increment.argtypes = [ctypes.c_void_p, ctypes.c_uint64]
        self._lib.rapha_counter_increment.restype = ctypes.c_int
        self._lib.rapha_counter_observe_record.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_size_t]
        self._lib.rapha_counter_observe_record.restype = ctypes.c_int
        self._lib.rapha_counter_mark_epoch.argtypes = [ctypes.c_void_p]
        self._lib.rapha_counter_mark_epoch.restype = ctypes.c_int
        self._lib.rapha_counter_read.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint64)]
        self._lib.rapha_counter_read.restype = ctypes.c_int
        self._lib.rapha_counter_read_epochs.argtypes = [ctypes.c_void_p, ctypes.POINTER(ctypes.c_uint64)]
        self._lib.rapha_counter_read_epochs.restype = ctypes.c_int
        self._lib.rapha_counter_close.argtypes = [ctypes.c_void_p]
        self._lib.rapha_counter_close.restype = None

    def observe_record_ids(self, record_ids: Iterable[str]) -> int:
        observed = 0
        for record_id in record_ids:
            digest = _record_id_hash(record_id)
            digest_buffer = ctypes.create_string_buffer(digest, len(digest))
            rc = self._lib.rapha_counter_observe_record(
                self._handle,
                ctypes.cast(digest_buffer, ctypes.c_void_p),
                ctypes.c_size_t(len(digest)),
            )
            if rc != 0:
                raise RuntimeError(f"rapha_counter_observe_record failed: rc={rc}")
            observed += 1
        if observed == 0:
            raise ValueError("at least one record id is required")
        return self.read()

    def increment(self, delta: int) -> int:
        if delta <= 0:
            raise ValueError("delta must be positive")
        rc = self._lib.rapha_counter_increment(self._handle, ctypes.c_uint64(delta))
        if rc != 0:
            raise RuntimeError(f"rapha_counter_increment failed: rc={rc}")
        return self.read()

    def mark_epoch_completed(self) -> int:
        rc = self._lib.rapha_counter_mark_epoch(self._handle)
        if rc != 0:
            raise RuntimeError(f"rapha_counter_mark_epoch failed: rc={rc}")
        return self.read_epochs()

    def read(self) -> int:
        return self._read_uint64(self._lib.rapha_counter_read)

    def read_epochs(self) -> int:
        return self._read_uint64(self._lib.rapha_counter_read_epochs)

    def _read_uint64(self, fn) -> int:
        out = ctypes.c_uint64(0)
        rc = fn(self._handle, ctypes.byref(out))
        if rc != 0:
            raise RuntimeError(f"counter read failed: rc={rc}")
        return int(out.value)

    def close(self) -> None:
        if getattr(self, "_handle", None):
            self._lib.rapha_counter_close(self._handle)
            self._handle = None

    def __del__(self) -> None:
        try:
            self.close()
        except Exception:
            pass


class RaphaDataLoader:
    """Wrap a PyTorch DataLoader and account for unique records before access.

    By default, the wrapper fails closed unless every batch exposes stable
    record IDs under `record_id`/`record_ids`/`id` or via a custom extractor.
    This is intentional: settlement should count unique records, not ambiguous
    tensor rows, when clinical data value is priced per record.
    """

    __slots__ = (
        "__auto_count_epochs",
        "__counter_backend",
        "__record_id_extractor",
        "__require_record_ids",
        "__wrapped",
    )

    def __init__(
        self,
        wrapped_loader: Iterable[Any],
        counter_backend: CounterBackend | None = None,
        record_id_extractor: RecordIdExtractor | None = None,
        require_record_ids: bool = True,
        auto_count_epochs: bool = True,
    ) -> None:
        self.__wrapped = wrapped_loader
        self.__counter_backend = counter_backend or InProcessEnclaveCounter()
        self.__record_id_extractor = record_id_extractor
        self.__require_record_ids = require_record_ids
        self.__auto_count_epochs = auto_count_epochs

    @property
    def processed_records_count(self) -> int:
        """Read-only unique processed-record count."""

        return self.__counter_backend.read()

    @property
    def epochs_completed(self) -> int:
        """Read-only completed epoch count."""

        return self.__counter_backend.read_epochs()

    def mark_epoch_completed(self) -> int:
        """Manually mark one completed training epoch."""

        return self.__counter_backend.mark_epoch_completed()

    def snapshot(self) -> CounterSnapshot:
        backend_name = type(self.__counter_backend).__name__
        isolation = "simulated-process-lock"
        if isinstance(self.__counter_backend, SgxCounterBackend):
            isolation = "sgx-tdx-ffi-opaque-handle"
        return CounterSnapshot(
            processed_records_count=self.processed_records_count,
            epochs_completed=self.epochs_completed,
            backend=backend_name,
            isolation_level=isolation,
        )

    def __iter__(self) -> Iterator[Any]:
        completed = False
        try:
            for batch in self.__wrapped:
                record_ids = extract_record_ids(batch, self.__record_id_extractor)
                if record_ids:
                    self.__counter_backend.observe_record_ids(record_ids)
                elif self.__require_record_ids:
                    raise ValueError("RaphaDataLoader requires stable record IDs for pay-per-record settlement")
                else:
                    self.__counter_backend.increment(infer_batch_record_count(batch))
                yield batch
            completed = True
        finally:
            if completed and self.__auto_count_epochs:
                self.__counter_backend.mark_epoch_completed()

    def __len__(self) -> int:
        if hasattr(self.__wrapped, "__len__"):
            return len(self.__wrapped)  # type: ignore[arg-type]
        raise TypeError("wrapped_loader does not expose __len__")


def extract_record_ids(batch: Any, extractor: RecordIdExtractor | None = None) -> list[str]:
    if extractor is not None:
        return _normalize_record_ids(extractor(batch))

    if isinstance(batch, dict):
        for key in ("record_id", "record_ids", "id", "ids"):
            if key in batch:
                return _normalize_record_ids(batch[key])
        return []

    if isinstance(batch, tuple) and len(batch) >= 2:
        candidate = batch[-1]
        if isinstance(candidate, dict):
            return extract_record_ids(candidate)
        if _is_explicit_record_id_sequence(candidate):
            return _normalize_record_ids(candidate)
        return []

    if isinstance(batch, list) and batch and all(isinstance(item, dict) for item in batch):
        ids = []
        for item in batch:
            for key in ("record_id", "id"):
                if key in item:
                    ids.append(str(item[key]))
                    break
        return ids

    return []


def infer_batch_record_count(batch: Any) -> int:
    """Infer the number of rows when non-unique local demo accounting is enabled."""

    if batch is None:
        raise ValueError("batch cannot be None")

    if isinstance(batch, dict):
        for key in ("input_ids", "labels", "attention_mask"):
            if key in batch:
                return _positive_len(batch[key])
        for value in batch.values():
            try:
                return _positive_len(value)
            except TypeError:
                continue
        return 1

    if isinstance(batch, tuple):
        if not batch:
            raise ValueError("empty batch cannot be counted")
        return infer_batch_record_count(batch[0])

    if isinstance(batch, list):
        if not batch:
            raise ValueError("empty batch cannot be counted")
        return len(batch)

    try:
        return _positive_len(batch)
    except TypeError:
        return 1


def _normalize_record_ids(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, bytes):
        return [value.hex()]
    if hasattr(value, "tolist"):
        value = value.tolist()
    if isinstance(value, Sequence):
        return [str(item) for item in value]
    raise TypeError("record ids must be a scalar or sequence")


def _is_explicit_record_id_sequence(value: Any) -> bool:
    if isinstance(value, (str, bytes)):
        return True
    if hasattr(value, "tolist"):
        value = value.tolist()
    if not isinstance(value, Sequence):
        return False
    return all(isinstance(item, (str, bytes)) for item in value)


def _positive_len(value: Any) -> int:
    if hasattr(value, "shape") and len(value.shape) > 0:
        size = int(value.shape[0])
    else:
        size = len(value)
    if size <= 0:
        raise ValueError("batch dimension must be positive")
    return size


def _record_id_hash(record_id: str) -> bytes:
    if not record_id:
        raise ValueError("record id cannot be empty")
    return hashlib.sha256(str(record_id).encode("utf-8")).digest()
