import os
import json
import uuid
import pytest
import httpx
from pathlib import Path
from fastapi.testclient import TestClient

os.environ["ENVIRONMENT"] = "test"
import tempfile
_tmp_db_dir = Path(tempfile.gettempdir())
_os_db_path = _tmp_db_dir / f"test_paybot_{os.getpid()}.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_os_db_path.as_posix()}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-ci"
os.environ["TELEGRAM_BOT_TOKEN"] = "123456:TEST_BOT_TOKEN"
os.environ["TELEGRAM_ADMIN_IDS"] = "123456789"
os.environ["SWIFTPAY_ACCESS_KEY"] = "ABC123"
os.environ["SWIFTPAY_SECRET_KEY"] = "SECRET"
os.environ["SWIFTPAY_MODE"] = "sandbox"

from importlib import reload
import core.config as core_config
reload(core_config)
from main import app
from services.swiftpay_service import SwiftPayService


class DummyResponse:
    def __init__(self, status_code=200, json_data=None, text=None):
        self.status_code = status_code
        self._json_data = json_data or {}
        self.text = text if text is not None else json.dumps(self._json_data)

    def json(self):
        return self._json_data


class DummyClient:
    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, json=None, headers=None):
        return DummyResponse(status_code=200, json_data={"customerRedirectUrl": "https://pay.swiftpay.ph/redirect", "paymentId": "pay-123"})

    async def get(self, url, headers=None):
        return DummyResponse(status_code=200, json_data=[{"code": "GCASH", "name": "GCash"}])


@pytest.mark.asyncio
async def test_sign_and_verify_payload():
    os.environ.setdefault("SWIFTPAY_ACCESS_KEY", "ABC123")
    os.environ.setdefault("SWIFTPAY_SECRET_KEY", "SECRET")
    os.environ.setdefault("SWIFTPAY_MODE", "sandbox")
    svc = SwiftPayService()

    payload = {
        "x_access_key": svc.access_key,
        "x_reference_no": "ref-123",
        "x_amount": "100.00",
        "x_currency": "PHP",
        "details": {"customerName": "John Doe"},
        "generate_customer_redirect_url": True,
    }
    signature = svc._sign_payload(payload)
    assert svc.verify_signature(payload, signature)


@pytest.mark.asyncio
async def test_create_order_calls_swiftpay(monkeypatch):
    os.environ.setdefault("SWIFTPAY_ACCESS_KEY", "ABC123")
    os.environ.setdefault("SWIFTPAY_SECRET_KEY", "SECRET")
    os.environ.setdefault("SWIFTPAY_MODE", "sandbox")
    svc = SwiftPayService()
    monkeypatch.setattr(httpx, "AsyncClient", DummyClient)

    result = await svc.create_order(
        amount=123.45,
        reference_no="ref-456",
        details={"customerName": "Jane"},
    )
    assert result["success"] is True
    assert result["data"]["customerRedirectUrl"] == "https://pay.swiftpay.ph/redirect"


@pytest.mark.asyncio
async def test_payment_link_service_uses_documented_basic_auth_endpoints(monkeypatch):
    svc = SwiftPayService()
    requests = []

    class PaymentLinkClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, json=None, headers=None):
            requests.append(("POST", url, json, headers))
            return DummyResponse(json_data={"code": "PL-test", "paymentUrl": "https://pay.example/PL-test"})

        async def get(self, url, headers=None):
            requests.append(("GET", url, None, headers))
            return DummyResponse(json_data={"code": "PL-test", "linkStatus": "ACTIVE"})

        async def delete(self, url, headers=None):
            requests.append(("DELETE", url, None, headers))
            return DummyResponse(status_code=204, text="")

    monkeypatch.setattr(httpx, "AsyncClient", PaymentLinkClient)
    payload = {"amount": 100.5, "currency": "PHP", "referenceNo": "link-ref"}

    created = await svc.create_payment_link(payload)
    fetched = await svc.get_payment_link("PL/test")
    invalidated = await svc.invalidate_payment_link("PL-test")

    assert created == {
        "success": True,
        "data": {"code": "PL-test", "paymentUrl": "https://pay.example/PL-test"},
    }
    assert fetched["data"]["linkStatus"] == "ACTIVE"
    assert invalidated == {"success": True, "data": {}}
    assert requests[0][0:3] == ("POST", f"{svc.base_url}/api/payments/links", payload)
    assert requests[0][3]["Authorization"] == "Basic QUJDMTIzOlNFQ1JFVA=="
    assert requests[1][1] == f"{svc.base_url}/api/payments/links/PL%2Ftest"
    assert requests[2][1] == f"{svc.base_url}/api/payments/links/PL-test/invalidate"


def test_payment_link_routes_create_read_and_invalidate_with_local_ownership(monkeypatch):
    reference_no = f"test-link-{uuid.uuid4().hex}"
    code = f"PL-{uuid.uuid4().hex[:12]}"
    captured_payload = {}

    async def create_payment_link(payload):
        captured_payload.update(payload)
        return {
            "success": True,
            "data": {
                "code": code,
                "paymentUrl": f"https://pay.example/{code}",
                "linkStatus": "ACTIVE",
                "amount": payload["amount"],
                "currency": payload["currency"],
            },
        }

    async def get_payment_link(requested_code):
        assert requested_code == code
        return {"success": True, "data": {"code": code, "linkStatus": "ACTIVE"}}

    async def invalidate_payment_link(requested_code):
        assert requested_code == code
        return {"success": True, "data": {"code": code, "linkStatus": "INACTIVE"}}

    monkeypatch.setattr(SwiftPayService, "create_payment_link", create_payment_link)
    monkeypatch.setattr(SwiftPayService, "get_payment_link", get_payment_link)
    monkeypatch.setattr(SwiftPayService, "invalidate_payment_link", invalidate_payment_link)

    with TestClient(app) as client:
        empty_reference = client.post(
            "/api/v1/swiftpay/payment-links",
            json={"amount": 125.5, "currency": "PHP", "referenceNo": "   "},
        )
        assert empty_reference.status_code == 422

        created = client.post(
            "/api/v1/swiftpay/payment-links",
            json={
                "amount": 125.5,
                "currency": "PHP",
                "referenceNo": reference_no,
                "title": "Test link",
                "validUntil": "2030-01-02T03:04:05+02:00",
            },
        )
        assert created.status_code == 200
        assert created.json()["data"]["code"] == code
        assert captured_payload == {
            "amount": 125.5,
            "currency": "PHP",
            "referenceNo": reference_no,
            "title": "Test link",
            "validUntil": "2030-01-02T01:04:05Z",
        }

        fetched = client.get(f"/api/v1/swiftpay/payment-links/{code}")
        assert fetched.status_code == 200
        assert fetched.json()["data"]["linkStatus"] == "ACTIVE"

        invalidated = client.delete(f"/api/v1/swiftpay/payment-links/{code}")
        assert invalidated.status_code == 200
        assert invalidated.json()["data"]["linkStatus"] == "INACTIVE"

        not_owned = client.get("/api/v1/swiftpay/payment-links/not-owned")
        assert not_owned.status_code == 404


@pytest.mark.asyncio
async def test_get_disbursement_institutions_fetches_instapay_catalogue(monkeypatch):
    svc = SwiftPayService()
    requested = {}

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def get(self, url, headers=None):
            requested["url"] = url
            return DummyResponse(
                status_code=200,
                json_data=[
                    {"code": "GXCHPHM2XXX", "name": "G-Xchange, Inc. (GCash)"},
                    {"code": "PAPHPHM1XXX", "name": "MAYA PHILIPPINES, INC."},
                ],
            )

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    result = await svc.get_disbursement_institutions()

    assert requested["url"].endswith("/api/disbursements/institutions?channel=INSTAPAY")
    assert result == {
        "success": True,
        "data": [
            {"code": "GXCHPHM2XXX", "name": "G-Xchange, Inc. (GCash)"},
            {"code": "PAPHPHM1XXX", "name": "MAYA PHILIPPINES, INC."},
        ],
    }


@pytest.mark.asyncio
async def test_disbursement_institution_catalogue_rejects_invalid_channel():
    result = await SwiftPayService().get_disbursement_institutions("FAST")
    assert result == {
        "success": False,
        "error": "Disbursement channel must be INSTAPAY or PESONET",
    }


@pytest.mark.asyncio
async def test_create_order_retries_on_duplicate_reference(monkeypatch):
    os.environ.setdefault("SWIFTPAY_ACCESS_KEY", "ABC123")
    os.environ.setdefault("SWIFTPAY_SECRET_KEY", "SECRET")
    os.environ.setdefault("SWIFTPAY_MODE", "sandbox")
    svc = SwiftPayService()

    attempt_counter = {"count": 0}

    class DuplicateReferenceClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json=None, headers=None):
            attempt_counter["count"] += 1
            if attempt_counter["count"] == 1:
                return DummyResponse(status_code=400, json_data={"errorCode": "DUPLICATED_REFERENCE_NO", "errorMessage": "Non-unique reference no"})
            return DummyResponse(status_code=200, json_data={"customerRedirectUrl": "https://pay.swiftpay.ph/redirect", "paymentId": "pay-123"})

    monkeypatch.setattr(httpx, "AsyncClient", lambda *args, **kwargs: DuplicateReferenceClient(*args, **kwargs))

    result = await svc.create_order(
        amount=123.45,
        reference_no="ref-456",
        details={"customerName": "Jane"},
    )
    assert result["success"] is True
    assert result["reference_no"] != "ref-456"


@pytest.mark.asyncio
async def test_create_order_payload_structure(monkeypatch):
    svc = SwiftPayService()
    captured_payload = {}

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, json=None, **kwargs):
            nonlocal captured_payload
            captured_payload = json
            return DummyResponse(status_code=200, json_data={"customerRedirectUrl": "http://ok", "paymentId": "123"})

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    await svc.create_order(
        amount=100.0,
        reference_no="test-ref",
        details={"customerName": "John"},
        institution_code="BNORPHMMXXX",
    )

    assert captured_payload["x_currency"] == "PHP"
    # SwiftPay documents details as a JSON string.
    assert json.loads(captured_payload["details"])["customerName"] == "John"
    # x_ fields should be present
    assert "x_access_key" in captured_payload
    assert "x_amount" in captured_payload
    assert captured_payload["x_amount"] == "100.00"
    assert captured_payload["institution_code"] == "BDO"


@pytest.mark.asyncio
async def test_send_disbursement_does_not_retry_duplicate_reference_with_new_id(monkeypatch):
    svc = SwiftPayService()
    references = []
    lookups = []

    class DuplicateReferenceClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, json=None, headers=None):
            references.append(json["merchantReferenceNo"])
            return DummyResponse(
                status_code=400,
                json_data={
                    "errorCode": "DUPLICATE_MERCHANT_REFERENCE_NO",
                    "errorMessage": "Duplicate merchant reference no",
                },
            )

    monkeypatch.setattr(
        httpx,
        "AsyncClient",
        lambda *args, **kwargs: DuplicateReferenceClient(*args, **kwargs),
    )

    async def missing_disbursement(params):
        lookups.append(params)
        return {"success": True, "data": {"result": []}}

    monkeypatch.setattr(svc, "get_disbursements", missing_disbursement)
    result = await svc.send_disbursement(
        reference_no="disb-existing",
        amount=100,
        bank_code="BDO",
        account_number="1234567890",
        first_name="Jane",
        last_name="Doe",
        phone="09171234567",
    )

    assert result["success"] is False
    assert result["code"] == "DUPLICATE_MERCHANT_REFERENCE_NO"
    assert result["not_found"] is True
    assert result["submission_unknown"] is True
    assert result["already_submitted"] is True
    assert result["reference_no"] == "disb-existing"
    assert references == ["disb-existing"]
    assert lookups == [{"merchantReferenceNo": "disb-existing", "pageNo": 0, "pageSize": 10}]


@pytest.mark.asyncio
async def test_send_disbursement_retries_transport_error_with_same_reference(monkeypatch):
    svc = SwiftPayService()
    references = []

    class RetryClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, json=None, headers=None):
            references.append(json["merchantReferenceNo"])
            if len(references) == 1:
                raise httpx.ConnectError("connection reset")
            return DummyResponse(status_code=200, json_data={"id": "swiftpay-id-123"})

    monkeypatch.setattr(httpx, "AsyncClient", RetryClient)
    monkeypatch.setattr(
        svc,
        "get_disbursements",
        lambda params: pytest.fail("A successful same-reference retry should not need reconciliation"),
    )

    result = await svc.send_disbursement(
        reference_no="withdrawal-123",
        amount=100,
        bank_code="BDO",
        account_number="1234567890",
        account_name="Jane Doe",
    )

    assert result["success"] is True
    assert result["data"]["id"] == "swiftpay-id-123"
    assert result["reference_no"] == "withdrawal-123"
    assert references == ["withdrawal-123", "withdrawal-123"]


@pytest.mark.asyncio
async def test_send_disbursement_reconciles_duplicate_reference_to_provider_record(monkeypatch):
    svc = SwiftPayService()
    references = []
    provider_record = {
        "id": "swiftpay-id-existing",
        "merchantReferenceNo": "withdrawal-existing",
        "status": "PENDING",
    }

    class DuplicateReferenceClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, json=None, headers=None):
            references.append(json["merchantReferenceNo"])
            return DummyResponse(
                status_code=400,
                json_data={"errorCode": "DUPLICATE_MERCHANT_REFERENCE_NO"},
            )

    async def find_existing(params):
        assert params == {
            "merchantReferenceNo": "withdrawal-existing",
            "pageNo": 0,
            "pageSize": 10,
        }
        return {"success": True, "data": {"result": [provider_record]}}

    monkeypatch.setattr(httpx, "AsyncClient", DuplicateReferenceClient)
    monkeypatch.setattr(svc, "get_disbursements", find_existing)

    result = await svc.send_disbursement(
        reference_no="withdrawal-existing",
        amount=100,
        bank_code="BDO",
        account_number="1234567890",
        account_name="Jane Doe",
    )

    assert result["success"] is True
    assert result["already_submitted"] is True
    assert result["data"] == provider_record
    assert references == ["withdrawal-existing"]


@pytest.mark.asyncio
async def test_generate_qrph_generates_php_payload(monkeypatch):
    svc = SwiftPayService()
    captured_payload = {}

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, json=None, **kwargs):
            nonlocal captured_payload
            captured_payload = json
            return DummyResponse(status_code=200, json_data={"qrCode": "krw-qr"})

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    result = await svc.generate_qrph(
        amount=12500,
        reference_no="php-ref-1",
        currency="PHP",
    )

    assert result["success"] is True
    assert captured_payload["x_currency"] == "PHP"
    assert captured_payload["x_amount"] == "12500.00"
    assert captured_payload["signature"] == svc._sign_payload(captured_payload)


@pytest.mark.asyncio
async def test_generate_qrph_retries_duplicate_reference(monkeypatch):
    svc = SwiftPayService()
    references = []

    class RetryClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, json=None, **kwargs):
            references.append(json["x_reference_no"])
            if len(references) == 1:
                return DummyResponse(
                    status_code=400,
                    json_data={"errorCode": "DUPLICATED_REFERENCE_NO"},
                )
            return DummyResponse(status_code=200, json_data={"qrCode": "php-qr"})

    monkeypatch.setattr(httpx, "AsyncClient", RetryClient)

    result = await svc.generate_qrph(amount=1, reference_no="existing-ref", currency="PHP")

    assert result["success"] is True
    assert references[0] == "existing-ref"
    assert references[1] != references[0]
    assert result["reference_no"] == references[1]


@pytest.mark.asyncio
async def test_generate_qrph_converts_non_php_currency_to_php(monkeypatch):
    svc = SwiftPayService()
    captured_payload = {}

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, json=None, **kwargs):
            nonlocal captured_payload
            captured_payload = json
            return DummyResponse(status_code=200, json_data={"qrCode": "krw-qr"})

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    result = await svc.generate_qrph(
        amount=12500,
        reference_no="krw-ref-2",
        currency="KRW",
    )

    assert result["success"] is True
    # CRITICAL: SwiftPay QRPH only accepts PHP/USD/EUR for x_currency
    # Send PHP-converted amount with x_currency="PHP"
    assert captured_payload["x_currency"] == "PHP", "SwiftPay requires x_currency to be PHP (not KRW)"
    assert float(captured_payload["x_amount"]) > 0, "Should send positive PHP amount"
    # Response reflects what was sent to SwiftPay
    assert result["currency"] == "PHP", "Response should show PHP (what we sent to SwiftPay)"
    assert result["amount"] > 0, "Response should show positive PHP amount"
    # Plus original for tracking
    assert result["original_amount"] == 12500, "Original amount for user reference"
    assert result["original_currency"] == "KRW", "Original currency for user reference"


@pytest.mark.asyncio
async def test_send_disbursement_payload(monkeypatch):
    svc = SwiftPayService()
    captured_payload = {}

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, json=None, **kwargs):
            nonlocal captured_payload
            captured_payload = json
            return DummyResponse(status_code=200, text="") # Empty body means scheduled

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    res = await svc.send_disbursement(
        reference_no="DISB-123",
        amount=500.0,
        bank_code="GCASH",
        account_number="09123456789",
        phone="639556708019",
        first_name="Juan",
        last_name="Cruz",
        city="Manila",
        postal_code="1000",
    )

    assert res["success"] is True
    assert captured_payload["merchantReferenceNo"] == "DISB-123"
    assert captured_payload["institutionCode"] == "GXCHPHM2XXX"
    assert "externalBankCode" not in captured_payload
    assert captured_payload["recipientInformation"]["fullName"] == "Juan Cruz"
    assert captured_payload["recipientInformation"]["mobileNumber"] == "+63-95-567-08019"
    address = captured_payload["recipientInformation"]["address"]
    assert address["fullAddress"] is None
    assert address["line1"] == "N/A"
    assert address["city"] == "Manila"
    assert address["postalCode"] == "1000"
    assert captured_payload["creditInformation"]["amount"] == 500.0


@pytest.mark.asyncio
async def test_send_disbursement_uses_documented_institution_code(monkeypatch):
    svc = SwiftPayService()
    captured_payload = {}

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, json=None, **kwargs):
            captured_payload.update(json)
            return DummyResponse(status_code=200, text="")

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    result = await svc.send_disbursement(
        reference_no="DISB-BDO",
        amount=500.0,
        bank_code="BNORPHMMXXX",
        account_number="1234567890",
        first_name="Juan",
        last_name="Cruz",
    )

    assert result["success"] is True
    assert captured_payload["institutionCode"] == "BNORPHMMXXX"
    assert "externalBankCode" not in captured_payload


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("bank_code", "expected_institution_code"),
    [
        ("MAYA", "PAPHPHM1XXX"),
        ("PAYMAYA", "PAPHPHM1XXX"),
    ],
)
async def test_send_disbursement_normalizes_maya_alias_to_catalogue_code(
    monkeypatch,
    bank_code,
    expected_institution_code,
):
    svc = SwiftPayService()
    captured_payload = {}

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, json=None, **kwargs):
            captured_payload.update(json)
            return DummyResponse(status_code=200, text="")

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    result = await svc.send_disbursement(
        reference_no="DISB-MAYA",
        amount=500.0,
        bank_code=bank_code,
        account_number="639556708019",
        phone="639556708019",
    )

    assert result["success"] is True
    assert captured_payload["institutionCode"] == expected_institution_code
    assert "externalBankCode" not in captured_payload


@pytest.mark.asyncio
async def test_send_qr_p2m_disbursement_includes_documented_qr_fields(monkeypatch):
    svc = SwiftPayService()
    captured_payload = {}

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, json=None, **kwargs):
            captured_payload.update(json)
            return DummyResponse(status_code=200, text="")

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)
    merchant_information = {
        "merchantId": "MERCHANT123",
        "merchantCreditAccountNumber": "1234567890123",
        "proxyNotifyFlag": "Y",
        "merchantCategoryCode": "5812",
        "referenceLabel": "SALE-123",
    }

    result = await svc.send_disbursement(
        reference_no="QRPH-123",
        amount=250,
        bank_code="BNORPHMMXXX",
        account_number="1234567890123",
        full_name="Test Merchant",
        transfer_type="QR_P2M",
        merchant_information=merchant_information,
    )

    assert result["success"] is True
    assert captured_payload["type"] == "QR_P2M"
    assert captured_payload["channel"] == "INSTAPAY"
    assert captured_payload["institutionCode"] == "BNORPHMMXXX"
    assert captured_payload["recipientInformation"]["fullName"] == "Test Merchant"
    assert captured_payload["recipientInformation"]["merchantInformation"] == merchant_information


@pytest.mark.asyncio
async def test_send_disbursement_rejects_invalid_contract_values():
    svc = SwiftPayService()

    assert (await svc.send_disbursement(
        reference_no="DISB-INVALID",
        amount=0,
        bank_code="BDO",
        account_number="1234567890",
    ))["error"] == "Disbursement amount must be greater than zero"
    assert (await svc.send_disbursement(
        reference_no="DISB-INVALID",
        amount=100,
        bank_code="BDO",
        account_number="1234567890",
        channel="BANK",
    ))["error"] == "Disbursement channel must be INSTAPAY or PESONET"
    assert (await svc.send_disbursement(
        reference_no="DISB-INVALID",
        amount=100,
        bank_code="BDO",
        account_number="1234567890",
        transfer_type="QR_P2M",
    ))["error"] == (
        "QR_P2M disbursements require merchant category and proxy notification fields"
    )
    assert (await svc.send_disbursement(
        reference_no="x" * 51,
        amount=100,
        bank_code="BDO",
        account_number="1234567890",
    ))["error"] == "Disbursement reference must be 50 characters or fewer"


def test_normalize_external_bank_code_supports_legacy_bank_aliases():
    assert SwiftPayService.normalize_external_bank_code("BDO") == "BNOR"
    assert SwiftPayService.normalize_external_bank_code("BPI") == "BOPI"
    assert SwiftPayService.normalize_external_bank_code("UNIONBANK") == "UBPH"
    assert SwiftPayService.normalize_external_bank_code("Banco de Oro Unibank Inc (BDO)") == "BNOR"
    assert SwiftPayService.normalize_external_bank_code("PHVBPHMXXX") == "PHVB"


def test_normalize_collection_institution_code_converts_bic_catalog_values():
    assert SwiftPayService.normalize_collection_institution_code("BNORPHMXXX") == "BDO"
    assert SwiftPayService.normalize_collection_institution_code("BOPIPHMXXX") == "BPI"
    assert SwiftPayService.normalize_collection_institution_code("GCASH") == "GCASH"


def test_normalize_disbursement_institution_code_converts_aliases():
    assert SwiftPayService.normalize_disbursement_institution_code("BDO") == "BNORPHMMXXX"
    assert SwiftPayService.normalize_disbursement_institution_code("BPI") == "BOPIPHMMXXX"


def test_validate_external_bank_code_rejects_unknown_short_code():
    with pytest.raises(ValueError, match="Unsupported bank code"):
        SwiftPayService.validate_external_bank_code("ABC")


@pytest.mark.asyncio
async def test_send_disbursement_accepts_account_name_alias(monkeypatch):
    svc = SwiftPayService()
    captured_payload = {}

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def post(self, url, json=None, **kwargs):
            nonlocal captured_payload
            captured_payload = json
            return DummyResponse(status_code=200, text="")

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    res = await svc.send_disbursement(
        reference_no="DISB-456",
        amount=600.0,
        bank_code="BDO",
        account_number="1234567890",
        account_name="Maria Santos",
        note="Test payout",
    )

    assert res["success"] is True
    assert captured_payload["recipientInformation"]["fullName"] == "Maria Santos"


def test_disbursement_institutions_exclude_cards_and_duplicates():
    institutions = SwiftPayService._normalize_disbursement_institutions([
        {"code": "BDO", "name": "BDO Unibank"},
        {"code": "bdo", "name": "BDO Unibank, Inc."},
        {"code": "VISA", "name": "Visa"},
        {"code": "MC", "name": "Mastercard", "type": "card"},
    ])

    assert institutions == [{"code": "BDO", "name": "BDO Unibank"}]


def test_institution_catalog_preserves_payment_limits_and_enabled_state():
    institutions = SwiftPayService._normalize_disbursement_institutions([
        {
            "code": "BDO",
            "name": "BDO Unibank",
            "enabled": True,
            "minAmount": 100,
            "maxAmount": 50000,
        },
    ])

    assert institutions == [{
        "code": "BDO",
        "name": "BDO Unibank",
        "enabled": True,
        "minAmount": 100,
        "maxAmount": 50000,
    }]


def test_disbursement_institutions_keep_korean_banks_for_krw():
    institutions = SwiftPayService._normalize_disbursement_institutions([
        {"code": "KDB", "name": "KDB Bank"},
        {"code": "HANA", "name": "Hana Bank"},
        {"code": "VISA", "name": "Visa"},
    ], currency="KRW")

    assert institutions == [
        {"code": "KDB", "name": "KDB Bank"},
        {"code": "HANA", "name": "Hana Bank"},
    ]


def test_disbursement_institutions_exclude_philippine_banks_for_krw():
    institutions = SwiftPayService._normalize_disbursement_institutions([
        {"code": "BDO", "name": "BDO Unibank"},
        {"code": "KDB", "name": "KDB Bank"},
    ], currency="KRW")

    assert institutions == [
        {"code": "KDB", "name": "KDB Bank"},
    ]


def test_disbursement_institutions_fallback_to_korean_banks_for_krw():
    institutions = SwiftPayService._normalize_disbursement_institutions([], currency="KRW")

    assert institutions
    assert {item["name"] for item in institutions} >= {
        "KB Kookmin Bank",
        "Hana Bank",
        "KDB Bank",
    }
    assert institutions[0]["name"] == "KB Kookmin Bank"


@pytest.mark.asyncio
async def test_get_institutions_calls_swiftpay(monkeypatch):
    os.environ.setdefault("SWIFTPAY_ACCESS_KEY", "ABC123")
    os.environ.setdefault("SWIFTPAY_SECRET_KEY", "SECRET")
    os.environ.setdefault("SWIFTPAY_MODE", "sandbox")
    svc = SwiftPayService()
    monkeypatch.setattr(httpx, "AsyncClient", DummyClient)

    result = await svc.get_institutions()
    assert result["success"] is True
    assert isinstance(result["data"], list)


@pytest.mark.asyncio
async def test_get_institutions_passes_currency_to_swiftpay(monkeypatch):
    svc = SwiftPayService()
    requested_url = ""

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def get(self, url, headers=None):
            nonlocal requested_url
            requested_url = url
            return DummyResponse(status_code=200, json_data=[])

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    result = await svc.get_institutions(currency="php")

    assert result["success"] is True
    assert requested_url.endswith("/api/institutions?currency=PHP")


@pytest.mark.asyncio
async def test_get_collection_institutions_always_requests_php(monkeypatch):
    svc = SwiftPayService()
    requested_url = ""

    class CaptureClient:
        def __init__(self, *args, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): return False
        async def get(self, url, headers=None):
            nonlocal requested_url
            requested_url = url
            return DummyResponse(status_code=200, json_data=[])

    monkeypatch.setattr(httpx, "AsyncClient", CaptureClient)

    result = await svc.get_collection_institutions()

    assert result["success"] is True
    assert requested_url.endswith("/api/institutions?currency=PHP")


def test_swiftpay_webhook_accepts_form_encoded_payload():
    svc = SwiftPayService()
    payload = {
        "x_access_key": svc.access_key,
        "x_reference_no": "ref-form-123",
        "x_payment_status": "EXPIRED",
        "x_payment_id": "pay-form-123",
    }
    signature = svc._sign_payload(payload)
    payload["signature"] = signature

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/swiftpay/webhook",
            data=payload,
            headers={"content-type": "application/x-www-form-urlencoded"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["message"] == "no matching transaction"


def test_swiftpay_webhook_accepts_configured_legacy_get_url():
    svc = SwiftPayService()
    payload = {
        "x_access_key": svc.access_key,
        "x_reference_no": "PUBLIC-PAY-test",
        "x_payment_status": "EXECUTED",
        "x_payment_id": "pay-test",
    }
    signature = svc._sign_payload(payload)
    payload["signature"] = signature

    with TestClient(app) as client:
        response = client.get(
            "/api/v1/swiftpay/webhooks/swiftpay",
            params={**payload, "institution_reference_no": "801605057"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["message"] == "no matching transaction"
