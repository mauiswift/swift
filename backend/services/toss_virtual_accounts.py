"""Helpers for provisioning deterministic TOSS virtual-account details."""

import hashlib
from typing import Dict


def create_toss_virtual_account(
    user_id: str,
    account_holder_name: str,
) -> Dict[str, str]:
    """Create stable account details for an approved user's TOSS account."""
    digest = hashlib.sha256(f"toss:{user_id}".encode("utf-8")).hexdigest()
    digits = "".join(character for character in digest if character.isdigit())
    account_number = (digits + "0" * 14)[:14]
    account_number = f"{account_number[:3]}-{account_number[3:7]}-{account_number[7:]}"
    holder = account_holder_name.strip() or "SwiftPay Merchant"
    return {
        "bank_name": "Toss Bank",
        "account_number": account_number,
        "account_holder_name": holder,
        "currency": "KRW",
        "account_type": "virtual_account",
        "status": "active",
    }
