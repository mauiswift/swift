from io import BytesIO
from pathlib import Path

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from schemas.auth import UserPermissions, UserResponse
from services.private_receipts import resolve_receipt_path, save_private_receipt
from routers.receipts import get_private_receipt


def _upload(content: bytes, content_type: str = "application/pdf") -> UploadFile:
    return UploadFile(
        filename="receipt.pdf",
        file=BytesIO(content),
        headers=Headers({"content-type": content_type}),
    )


@pytest.mark.asyncio
async def test_receipts_are_private_bounded_and_admin_only():
    reference = await save_private_receipt(_upload(b"%PDF-1.7\nproof"), max_size_mb=1)
    path = resolve_receipt_path(reference)
    assert path and path.is_file()
    assert "static" not in path.parts

    try:
        with pytest.raises(HTTPException) as size_error:
            await save_private_receipt(_upload(b"%PDF-1.7\nlarge proof"), max_size_mb=0.000005)
        assert size_error.value.status_code == 413

        with pytest.raises(HTTPException) as type_error:
            await save_private_receipt(_upload(b"<svg/>", "image/svg+xml"), max_size_mb=1)
        assert type_error.value.status_code == 400

        with pytest.raises(HTTPException) as access_error:
            await get_private_receipt(reference, UserResponse(id="merchant", email="merchant@example.test"), None)
        assert access_error.value.status_code == 403

        response = await get_private_receipt(
            reference,
            UserResponse(
                id="admin",
                email="admin@example.test",
                permissions=UserPermissions(is_super_admin=True),
            ),
            None,
        )
        assert Path(response.path).resolve() == path.resolve()
    finally:
        path.unlink(missing_ok=True)


@pytest.mark.asyncio
async def test_receipt_paths_are_not_served_by_spa_fallback():
    from main import catch_all_spa

    response = await catch_all_spa("uploads/bank-receipts/0123456789abcdef0123456789abcdef.pdf")
    assert response.status_code == 404

    response = await catch_all_spa("../.env.example")
    assert response.status_code == 404