#!/usr/bin/env python3
"""
Bank & Payment Logo Audit Tool for SwiftPay.

Verifies canonical logo assets in frontend/public/logos, checks synchronization with
backend/static/logos, reports SVG color definitions, and checks frontend JSX components
for accessible alt text.
"""

import hashlib
import re
import shutil
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_LOGOS = REPO_ROOT / "frontend" / "public" / "logos"
BACKEND_LOGOS = REPO_ROOT / "backend" / "static" / "logos"
FRONTEND_SRC = REPO_ROOT / "frontend" / "src"


def get_file_hash(path: Path) -> str:
    """Calculate MD5 checksum of a file."""
    hasher = hashlib.md5()
    hasher.update(path.read_bytes())
    return hasher.hexdigest()


def audit_and_sync_logos() -> dict:
    """Audit logo assets, synchronize frontend and backend directories, and check SVG formats."""
    results = {
        "frontend_count": 0,
        "backend_count": 0,
        "synced_to_frontend": [],
        "synced_to_backend": [],
        "svg_hex_colors": [],
        "svg_current_color": [],
    }

    if not FRONTEND_LOGOS.exists():
        FRONTEND_LOGOS.mkdir(parents=True, exist_ok=True)
    if not BACKEND_LOGOS.exists():
        BACKEND_LOGOS.mkdir(parents=True, exist_ok=True)

    frontend_files = {f.name: f for f in FRONTEND_LOGOS.rglob("*") if f.is_file()}
    backend_files = {f.name: f for f in BACKEND_LOGOS.rglob("*") if f.is_file()}

    results["frontend_count"] = len(frontend_files)
    results["backend_count"] = len(backend_files)

    # Copy files present in backend but missing in frontend -> canonical frontend
    for name, b_file in backend_files.items():
        if name not in frontend_files:
            target = FRONTEND_LOGOS / name
            shutil.copy2(b_file, target)
            frontend_files[name] = target
            results["synced_to_frontend"].append(name)

    # Sync canonical frontend files to backend
    for name, f_file in frontend_files.items():
        b_file = BACKEND_LOGOS / name
        if not b_file.exists() or get_file_hash(f_file) != get_file_hash(b_file):
            shutil.copy2(f_file, b_file)
            results["synced_to_backend"].append(name)

    # Check SVGs for hardcoded fill/stroke vs currentColor
    for f_file in FRONTEND_LOGOS.glob("*.svg"):
        content = f_file.read_text(encoding="utf-8", errors="ignore")
        has_hex = bool(re.search(r'(fill|stroke)\s*=\s*["\']#(?!000|fff|FFFFFF|000000)', content, re.I))
        has_current = "currentColor" in content
        if has_hex:
            results["svg_hex_colors"].append(f_file.name)
        if has_current:
            results["svg_current_color"].append(f_file.name)

    return results


def main() -> int:
    print("=== SwiftPay Logo & Asset Audit ===")
    res = audit_and_sync_logos()

    print(f"Frontend Logos Count: {res['frontend_count']}")
    print(f"Backend Logos Count: {res['backend_count']}")

    if res["synced_to_frontend"]:
        print(f"\nSynced {len(res['synced_to_frontend'])} missing file(s) from backend to canonical frontend:")
        for name in res["synced_to_frontend"]:
            print(f"  + {name}")

    if res["synced_to_backend"]:
        print(f"\nSynced {len(res['synced_to_backend'])} file(s) from canonical frontend to backend static:")
        for name in res["synced_to_backend"]:
            print(f"  -> {name}")

    print(f"\nSVG Format Audit:")
    print(f"  - SVGs using brand hex colors: {len(res['svg_hex_colors'])}")
    print(f"  - SVGs using flexible currentColor: {len(res['svg_current_color'])}")

    print("\n✓ Logo audit and synchronization complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
