"""Test downline variant ID matching to prevent empty downline results."""

import pytest
from services.downline import DownlineService


def test_user_id_variants_raw_id():
    """Test that _user_id_variants normalizes raw numeric IDs."""
    service = DownlineService(None)  # db is not used for this static method
    variants = service._user_id_variants("123456789")

    # Should return all three forms
    assert "123456789" in variants
    assert "tg-123456789" in variants
    assert len(variants) == 2  # No duplicates


def test_user_id_variants_tg_prefixed_id():
    """Test that _user_id_variants extracts raw ID from tg- prefix."""
    service = DownlineService(None)
    variants = service._user_id_variants("tg-987654321")

    # Should return all three forms without duplication
    assert "tg-987654321" in variants
    assert "987654321" in variants
    assert len(variants) == 2  # No duplicates


def test_user_id_variants_with_whitespace():
    """Test that _user_id_variants strips whitespace."""
    service = DownlineService(None)
    variants = service._user_id_variants("  tg-111222333  ")

    # Should be normalized
    assert "tg-111222333" in variants
    assert "111222333" in variants
    assert "  tg-111222333  " not in variants


def test_user_id_variants_preserves_order():
    """Test that variant order is stable (normalized form first)."""
    service = DownlineService(None)
    variants = service._user_id_variants("tg-555666777")

    # Normalized (tg- form) should come first
    assert variants[0] == "tg-555666777"
    assert variants[1] == "555666777"


def test_user_id_variants_no_duplicates_on_re_add():
    """Test that variants with duplicate raw forms only appear once."""
    service = DownlineService(None)
    # When raw ID happens to match after removing tg-, no duplicate
    variants = service._user_id_variants("tg-999888777")

    # dict.fromkeys() prevents duplicates, so should have exactly 2
    assert len(variants) == 2
    assert variants.count("tg-999888777") == 1
    assert variants.count("999888777") == 1
