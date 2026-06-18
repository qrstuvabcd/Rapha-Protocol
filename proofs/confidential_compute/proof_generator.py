"""Generate a Rapha confidential-compute audit receipt.

This module intentionally separates the PHI boundary from settlement metadata.
It signs only job metadata and counter values, never raw rows, prompts, labels,
or model inputs.

Important: this module is not a production settlement oracle. Its HMAC output is
an edge-side audit receipt only. Polygon mainnet settlement must use the Rapha
attestation verifier, which checks SGX/DCAP + TPM evidence and signs the
RaphaClearingVault proof digest with the trusted ECDSA attestor key.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import re
import time
from pathlib import Path
from typing import Any

WALLET_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")


def canonical_json(value: dict[str, Any]) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return "0x" + digest.hexdigest()


def _load_hmac_key(allow_simulated: bool) -> bytes:
    raw = os.getenv("RAPHA_ATTESTATION_HMAC_KEY_HEX")
    if raw:
        try:
            key = bytes.fromhex(raw.removeprefix("0x"))
        except ValueError as exc:
            raise RuntimeError("RAPHA_ATTESTATION_HMAC_KEY_HEX must be hex encoded") from exc
        if len(key) < 32:
            raise RuntimeError("RAPHA_ATTESTATION_HMAC_KEY_HEX must contain at least 32 bytes")
        return key

    if allow_simulated or os.getenv("RAPHA_ALLOW_SIMULATED_ATTESTATION", "").lower() == "true":
        return hashlib.sha256(b"rapha-protocol-local-simulated-attestation-key").digest()

    raise RuntimeError(
        "Missing RAPHA_ATTESTATION_HMAC_KEY_HEX. Set it, or pass --allow-simulated only for local demos."
    )


def _estimated_cost_usdc_6dp(
    *,
    processed_records_count: int,
    epochs_completed: int,
    price_per_record_usdc_6dp: int | None,
    price_per_compute_epoch_usdc_6dp: int | None,
) -> int | None:
    if price_per_record_usdc_6dp is None:
        return None
    compute_price = price_per_compute_epoch_usdc_6dp or 0
    return (int(processed_records_count) * int(price_per_record_usdc_6dp)) + (
        int(epochs_completed) * int(compute_price)
    )


def generate_attestation_receipt(
    *,
    job_id: str,
    ai_company_wallet: str,
    processed_records_count: int,
    epochs_completed: int = 0,
    price_per_record_usdc_6dp: int | None = None,
    price_per_compute_epoch_usdc_6dp: int | None = None,
    attestation_quote_path: str | Path | None = None,
    allow_simulated: bool = False,
) -> dict[str, Any]:
    if not job_id:
        raise ValueError("job_id is required")
    if not WALLET_RE.match(ai_company_wallet):
        raise ValueError("ai_company_wallet must be an EVM address")
    if processed_records_count <= 0:
        raise ValueError("processed_records_count must be positive")
    if epochs_completed < 0:
        raise ValueError("epochs_completed must be non-negative")
    if price_per_record_usdc_6dp is not None and price_per_record_usdc_6dp <= 0:
        raise ValueError("price_per_record_usdc_6dp must be positive when provided")
    if price_per_compute_epoch_usdc_6dp is not None and price_per_compute_epoch_usdc_6dp < 0:
        raise ValueError("price_per_compute_epoch_usdc_6dp must be non-negative when provided")

    quote_sha256 = None
    if attestation_quote_path:
        quote_sha256 = sha256_file(Path(attestation_quote_path))

    payload = {
        "protocol": "rapha-protocol",
        "version": "confidential-compute-receipt-v2",
        "job_id": job_id,
        "ai_company_wallet": ai_company_wallet,
        "processed_records_count": int(processed_records_count),
        "epochs_completed": int(epochs_completed),
        "settlement_formula": "cost_usdc_6dp=(processed_records_count*price_per_record_usdc_6dp)+(epochs_completed*price_per_compute_epoch_usdc_6dp)",
        "price_per_record_usdc_6dp": price_per_record_usdc_6dp,
        "price_per_compute_epoch_usdc_6dp": price_per_compute_epoch_usdc_6dp,
        "estimated_cost_usdc_6dp": _estimated_cost_usdc_6dp(
            processed_records_count=processed_records_count,
            epochs_completed=epochs_completed,
            price_per_record_usdc_6dp=price_per_record_usdc_6dp,
            price_per_compute_epoch_usdc_6dp=price_per_compute_epoch_usdc_6dp,
        ),
        "raw_phi_exported": False,
        "quote_sha256": quote_sha256,
        "issued_at_unix": int(time.time()),
    }
    payload_bytes = canonical_json(payload)
    payload_hash = "0x" + hashlib.sha256(payload_bytes).hexdigest()
    key = _load_hmac_key(allow_simulated=allow_simulated)
    signature = "0x" + hmac.new(key, payload_bytes, hashlib.sha256).hexdigest()

    return {
        "payload": payload,
        "payload_hash_sha256": payload_hash,
        "proof_type": (
            "audit-only-simulated-sgx-dcap-hmac-sha256"
            if quote_sha256 is None
            else "audit-only-sgx-dcap-quote-hmac-sha256"
        ),
        "cryptographic_signature": signature,
        "settlement_eligible": False,
        "required_settlement_oracle": "rapha-attestation-verifier",
        "contract_note": (
            "RaphaClearingVault.sol expects an Ethereum ECDSA attestor signature over the on-chain proof digest. "
            "This HMAC receipt is audit-only and must not be submitted to mainnet settlement. Send SGX/DCAP "
            "and TPM evidence to the production Rapha attestation verifier, then submit its ABI-encoded proof."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a Rapha Protocol confidential-compute receipt.")
    parser.add_argument("--job-id", required=True)
    parser.add_argument("--ai-company-wallet", required=True)
    parser.add_argument("--processed-records-count", type=int, required=True)
    parser.add_argument("--epochs-completed", type=int, default=0)
    parser.add_argument(
        "--price-per-record-usdc-6dp",
        type=int,
        help="Optional record price in USDC six-decimal base units. Example: 500000 = 0.5 USDC.",
    )
    parser.add_argument(
        "--price-per-compute-epoch-usdc-6dp",
        type=int,
        help="Optional compute epoch price in USDC six-decimal base units.",
    )
    parser.add_argument("--attestation-quote", help="Optional Intel SGX DCAP / TDX quote bytes.")
    parser.add_argument("--allow-simulated", action="store_true", help="Permit deterministic local-demo HMAC key.")
    parser.add_argument("--out", help="Write receipt JSON to this path instead of stdout.")
    args = parser.parse_args()

    receipt = generate_attestation_receipt(
        job_id=args.job_id,
        ai_company_wallet=args.ai_company_wallet,
        processed_records_count=args.processed_records_count,
        epochs_completed=args.epochs_completed,
        price_per_record_usdc_6dp=args.price_per_record_usdc_6dp,
        price_per_compute_epoch_usdc_6dp=args.price_per_compute_epoch_usdc_6dp,
        attestation_quote_path=args.attestation_quote,
        allow_simulated=args.allow_simulated,
    )
    rendered = json.dumps(receipt, indent=2, sort_keys=True)
    if args.out:
        Path(args.out).write_text(rendered + "\n", encoding="utf-8")
    else:
        print(rendered)


if __name__ == "__main__":
    main()
