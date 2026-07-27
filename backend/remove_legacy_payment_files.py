from pathlib import Path

base = Path(__file__).resolve().parent
paths = [
    base / "routers" / "magpie.py",
    base / "routers" / "magpie_webhook.py",
    base / "routers" / "magpie_admin.py",
    base / "services" / "magpie_service.py",
    base / "routers" / "zip.py",
    base / "services" / "zip_service.py",
]
log_path = base / "remove_legacy_payment_files.log"
with log_path.open("w", encoding="utf-8") as log:
    for path in paths:
        if path.exists():
            try:
                path.unlink()
                log.write(f"removed {path}\n")
            except Exception as exc:
                log.write(f"error removing {path}: {exc}\n")
        else:
            log.write(f"missing {path}\n")
print(f"wrote {log_path}")
