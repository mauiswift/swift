import httpx
import pytest

from services.bitgo_service import BitGoRequestError, _bitgo_request


@pytest.mark.asyncio
async def test_bitgo_ip_restriction_error_is_actionable(monkeypatch):
    class Response:
        status_code = 401
        text = '{"error":"Attempt to use IP-restricted token from an unauthorized IP address","requestId":"req-123"}'

        def json(self):
            return {
                "error": "Attempt to use IP-restricted token from an unauthorized IP address",
                "requestId": "req-123",
            }

        def raise_for_status(self):
            raise httpx.HTTPStatusError("unauthorized", request=httpx.Request("GET", "https://bitgo.test"), response=self)

    class Client:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def request(self, *args, **kwargs):
            return Response()

    monkeypatch.setattr(httpx, "AsyncClient", Client)

    class Db:
        pass

    from services import bitgo_service

    async def config(_db):
        return {"enabled": True, "configured": True, "base_url": "https://bitgo.test"}

    async def setting(_db, key):
        return "token" if "access_token" in key else "wallet"

    monkeypatch.setattr(bitgo_service, "get_bitgo_config", config)
    monkeypatch.setattr(bitgo_service, "_get_setting", setting)

    with pytest.raises(BitGoRequestError, match="outbound IP"):
        await _bitgo_request(Db(), "GET", "/health")
