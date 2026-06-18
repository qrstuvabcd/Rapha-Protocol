"""Confidential-compute primitives for Rapha Protocol edge workloads."""

from .rapha_dataloader import CounterSnapshot, InProcessEnclaveCounter, RaphaDataLoader, SgxCounterBackend

__all__ = [
    "CounterSnapshot",
    "InProcessEnclaveCounter",
    "RaphaDataLoader",
    "SgxCounterBackend",
    "generate_attestation_receipt",
]


def generate_attestation_receipt(*args, **kwargs):
    """Lazy import keeps `python -m ...proof_generator` warning-free."""

    from .proof_generator import generate_attestation_receipt as _generate_attestation_receipt

    return _generate_attestation_receipt(*args, **kwargs)
