from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIST = REPO_ROOT / "frontend" / "dist"
BACKEND_STATIC = Path(__file__).resolve().parent / "static"


def sync_frontend_assets(frontend_dist: Path | str | None = None, static_dir: Path | str | None = None) -> bool:
    """Copy the built frontend into the backend static folder if a production build exists."""
    frontend_path = Path(frontend_dist) if frontend_dist is not None else FRONTEND_DIST
    static_path = Path(static_dir) if static_dir is not None else BACKEND_STATIC

    if not frontend_path.exists():
        return False

    static_path.mkdir(parents=True, exist_ok=True)
    shutil.copytree(frontend_path, static_path, dirs_exist_ok=True)
    return True


def build_frontend_if_needed() -> bool:
    """Build the frontend when the backend is missing a production index.html."""
    if FRONTEND_DIST.joinpath("index.html").exists():
        return sync_frontend_assets()

    frontend_dir = REPO_ROOT / "frontend"
    if not frontend_dir.exists():
        return False

    try:
        if shutil.which("pnpm"):
            subprocess.run(["pnpm", "install", "--frozen-lockfile"], cwd=frontend_dir, check=True, stdout=subprocess.DEVNULL)
            subprocess.run(["pnpm", "build"], cwd=frontend_dir, check=True, stdout=subprocess.DEVNULL)
        elif shutil.which("npm"):
            subprocess.run(["npm", "install"], cwd=frontend_dir, check=True, stdout=subprocess.DEVNULL)
            subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True, stdout=subprocess.DEVNULL)
        else:
            return False
    except (FileNotFoundError, subprocess.CalledProcessError):
        return False

    return sync_frontend_assets()
