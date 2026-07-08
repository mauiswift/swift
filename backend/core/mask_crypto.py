"""Simple shim for mask encryption utilities used in local/dev environments.
This intentionally implements no-op encrypt/decrypt when no MASK_KEY is configured,
so the app can run without the production masking key.
"""
import os

MASK_KEY = os.getenv("MASK_KEY", "")


# Public prefix value used across the codebase. Tests and services import
# `key_prefix` expecting a string, so export it as such to avoid TypeErrors
# when calling `.startswith(key_prefix)` on strings.
key_prefix = "mask:" if MASK_KEY else ""


def encrypt_text(plain: str) -> str:
    # In production this should encrypt using a secure algorithm.
    # For local/dev, return the plain text.
    return plain


def decrypt_text(cipher: str) -> str:
    # In production this should decrypt using a secure algorithm.
    # For local/dev, return the input unchanged.
    return cipher
