#!/usr/bin/env python3
"""Test Magpie API directly with production credentials"""
import requests
import json
from datetime import datetime

api_key = "sk_live_BEvi0L0MtY0v96dbq4Z0iy"
base_url = "https://api.magpie.im"

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-API-Key": api_key,
    "Authorization": f"Bearer {api_key}"
}

payload = {
    "amount": 1.0,
    "description": "Test Magpie payment",
    "external_id": f"test-{datetime.now().timestamp()}",
    "currency": "php",
    "metadata": {
        "source": "magpie",
        "test": True
    }
}

print(f"Testing Magpie API at {datetime.now().isoformat()}")
print(f"API Key (first 20 chars): {api_key[:20]}...")
print(f"Endpoint: {base_url}/v1/payments/checkout")
print(f"Payload: {json.dumps(payload, indent=2)}")
print("\nSending request...\n")

try:
    response = requests.post(
        f"{base_url}/v1/payments/checkout",
        json=payload,
        headers=headers,
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"\nJSON Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code >= 400:
        print("\n❌ API Error!")
    else:
        print("\n✅ API Success!")
        
except Exception as e:
    print(f"❌ Exception: {e}")
    import traceback
    traceback.print_exc()
