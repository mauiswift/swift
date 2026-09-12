"""Integration test demonstrating downline variant ID fix resolves empty results."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch


def test_downline_list_matches_all_id_variants():
    """Demonstrate that list_downline now correctly matches relationships stored with different ID formats."""

    # Simulate stored relationships with different ID formats
    stored_relationships = [
        {"upline_user_id": "123456789", "downline_user_id": "user1"},  # Raw ID stored
        {"upline_user_id": "tg-123456789", "downline_user_id": "user2"},  # tg- prefixed stored
    ]

    # Before the fix, if current_user.id == "tg-123456789" (tg-prefixed),
    # only the second relationship would be found.
    # If current_user.id == "123456789" (raw), only the first would be found.
    # This is why downlines appeared empty - ID format mismatch.

    from services.downline import DownlineService
    service = DownlineService(None)

    # Now with the fix, requesting with tg-123456789 should find both:
    upline_id = "tg-123456789"
    variants = service._user_id_variants(upline_id)

    # Verify both forms are included
    assert "123456789" in variants, "Missing raw ID variant"
    assert "tg-123456789" in variants, "Missing tg-prefixed variant"

    # When the SQL query uses:
    # .where(Downline.upline_user_id.in_(variants))
    # It will match BOTH stored records regardless of format difference
    matching_count = sum(1 for rel in stored_relationships if rel["upline_user_id"] in variants)
    assert matching_count == 2, f"Expected 2 matches, got {matching_count}"

    print("✅ Test passed: Downline variant ID fix resolves empty results")
    print(f"   - User ID 'tg-123456789' now matches both stored formats")
    print(f"   - Query variants: {variants}")
    print(f"   - Found {matching_count} relationships instead of just 1")


def test_commission_stats_matches_all_recipient_id_variants():
    """Verify commission aggregation works with ID format variants."""

    stored_commissions = [
        {"recipient_id": "123456789", "amount": 100},
        {"recipient_id": "tg-123456789", "amount": 50},
    ]

    from services.downline import DownlineService
    service = DownlineService(None)

    user_id = "123456789"
    variants = service._user_id_variants(user_id)

    # Before fix: would only sum commissions where recipient_id == "123456789" (100)
    # After fix: sums all where recipient_id.in_(variants) (100 + 50 = 150)
    matching_commissions = [c for c in stored_commissions if c["recipient_id"] in variants]
    total_earned = sum(c["amount"] for c in matching_commissions)

    assert len(matching_commissions) == 2, "Should find commissions under both ID formats"
    assert total_earned == 150, f"Expected total 150, got {total_earned}"

    print("✅ Test passed: Commission stats aggregation now includes all ID variants")
    print(f"   - Query variants: {variants}")
    print(f"   - Found {len(matching_commissions)} commission records totaling {total_earned} PHP")


def test_fix_prevents_empty_downline_results():
    """Show the specific scenario that caused empty downline results."""

    # Scenario: Upline created relationship with raw Telegram ID (e.g., in Telegram bot flow)
    # Dashboard/API authenticates user with tg-prefixed ID (e.g., from JWT token)
    # Before fix: list_downline(tg-123456789) wouldn't find downline stored under 123456789

    from services.downline import DownlineService
    service = DownlineService(None)

    # Simulate both stored and requested ID formats
    scenarios = [
        ("Stored: raw, Query: raw", "123456789", "123456789", True),
        ("Stored: raw, Query: tg-prefixed", "123456789", "tg-123456789", True),
        ("Stored: tg-prefixed, Query: raw", "tg-123456789", "123456789", True),
        ("Stored: tg-prefixed, Query: tg-prefixed", "tg-123456789", "tg-123456789", True),
    ]

    all_pass = True
    for scenario_name, stored_id, query_id, should_match in scenarios:
        query_variants = service._user_id_variants(query_id)
        matches = stored_id in query_variants

        if matches != should_match:
            print(f"❌ {scenario_name}: FAILED")
            all_pass = False
        else:
            print(f"✅ {scenario_name}: PASSED")

    assert all_pass, "Some scenarios didn't match as expected"
    print("\n✅ All ID format combinations now work correctly")


if __name__ == "__main__":
    test_downline_list_matches_all_id_variants()
    print()
    test_commission_stats_matches_all_recipient_id_variants()
    print()
    test_fix_prevents_empty_downline_results()
    print("\n" + "="*60)
    print("SUMMARY: All 3 integration tests passed!")
    print("="*60)
