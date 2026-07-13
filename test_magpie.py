#!/usr/bin/env python3
"""Test Magpie API connectivity and diagnose 500 errors."""

import asyncio
import sys
import os
import json
import httpx

# Add backend to path
sys.path.insert(0, "/workspaces/paybot/backend")

from core.config import settings


async def test_magpie():
    print("=" * 60)
    print("MAGPIE API DIAGNOSTIC TEST")
    print("=" * 60)

    # Check configuration
    print("MAGPIE diagnostic retired — Magpie integration removed.")
return

    # Test 1: Simple health check via GET
    print(f"\n🔍 Test 1: Health Check (GET /health)")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {
                "X-API-Key": api_key,
                "Content-Type": "application/json",
            }
            resp = await client.get(f"{base_url}/health", headers=headers)
            print(f"  Status: {resp.status_code}")
            print(f"  Response: {resp.text}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    # Test 2: Create test checkout
    print(f"\n🔍 Test 2: Create Test Checkout")
    test_payload = {
        "amount": 100.00,
        "description": "Test payment from diagnostic",
        "external_id": f"test-{asyncio.get_event_loop().time()}",
        "customer_name": "Test Customer",
        "customer_email": "test@example.com",
        "metadata": {"test": True},
    }
    print(f"  Payload: {json.dumps(test_payload, indent=2)}")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {
                "X-API-Key": api_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            resp = await client.post(
                f"{base_url}/v1/payments/checkout",
                json=test_payload,
                headers=headers,
            )
            print(f"  Status: {resp.status_code}")
            print(f"  Response: {resp.text}")
            if resp.status_code >= 400:
                print(f"  ❌ ERROR: {resp.status_code} {resp.text}")
            else:
                print(f"  ✅ SUCCESS!")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    # Test 3: Check balance/account info
    print(f"\n🔍 Test 3: Get Account Info")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {
                "X-API-Key": api_key,
                "Content-Type": "application/json",
            }
            resp = await client.get(f"{base_url}/v1/account", headers=headers)
            print(f"  Status: {resp.status_code}")
            print(f"  Response: {resp.text}")
    except Exception as e:
        print(f"  ❌ Error: {e}")

    print("\n" + "=" * 60)
    print("END DIAGNOSTIC TEST")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_magpie())
