import re
import uuid
from pathlib import Path
from typing import Optional

from fastapi import HTTPException, UploadFile


BACKEND_DIR = Path(__file__).resolve().parents[1]
PRIVATE_RECEIPTS_DIR = BACKEND_DIR / "private_uploads" / "receipts"
LEGACY_UPLOADS_DIR = BACKEND_DIR / "static" / "uploads"
DEFAULT_MAX_RECEIPT_SIZE_MB = 10
_PRIVATE_RECEIPT_REF = re.compile(r"^private-receipt:([0-9a-f]{32})\.(pdf|jpg|png|webp)$")
_LEGACY_RECEIPT_REF = re.compile(r"^/uploads/(bank-receipts|usdt-receipts)/([0-9a-f]{32}\.[a-zA-Z0-9]{1,8})$")
_RECEIPT_TYPES = {
    "application/pdf": (".pdf", b"%PDF-"),
    "image/jpeg": (".jpg", b"\xff\xd8\xff"),
    "image/png": (".png", b"\x89PNG\r\n\x1a\n"),
}


def _receipt_format(content: bytes, claimed_type: str) -> tuple[str, str]:
    if claimed_type == "image/webp" and len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return ".webp", "image/webp"
    details = _RECEIPT_TYPES.get(claimed_type)
    if not details or not content.startswith(details[1]):
        raise HTTPException(status_code=400, detail="Receipt must be a valid PDF, JPEG, PNG, or WebP file")
    return details[0], claimed_type


async def save_private_receipt(upload: UploadFile, max_size_mb: Optional[float] = None) -> str:
    configured_limit = float(max_size_mb or 0)
    effective_limit_mb = configured_limit if configured_limit > 0 else DEFAULT_MAX_RECEIPT_SIZE_MB
    max_bytes = int(effective_limit_mb * 1024 * 1024)
    content = await upload.read(max_bytes + 1)
    if not content:
        raise HTTPException(status_code=400, detail="Receipt file is empty")
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Receipt file must be {effective_limit_mb:g} MB or smaller")

    extension, _ = _receipt_format(content, (upload.content_type or "").split(";", 1)[0].strip().lower())
    file_id = uuid.uuid4().hex
    PRIVATE_RECEIPTS_DIR.mkdir(parents=True, exist_ok=True)
    (PRIVATE_RECEIPTS_DIR / f"{file_id}{extension}").write_bytes(content)
    return f"private-receipt:{file_id}{extension}"


def resolve_receipt_path(receipt_ref: str) -> Optional[Path]:
    private_match = _PRIVATE_RECEIPT_REF.fullmatch(receipt_ref or "")
    if private_match:
        path = PRIVATE_RECEIPTS_DIR / f"{private_match.group(1)}.{private_match.group(2)}"
        return path if path.is_file() else None

    legacy_match = _LEGACY_RECEIPT_REF.fullmatch(receipt_ref or "")
    if not legacy_match:
        return None
    path = LEGACY_UPLOADS_DIR / legacy_match.group(1) / legacy_match.group(2)
    resolved = path.resolve()
    if LEGACY_UPLOADS_DIR.resolve() not in resolved.parents or not resolved.is_file():
        return None
    return resolved