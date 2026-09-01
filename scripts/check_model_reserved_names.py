#!/usr/bin/env python3
"""
Scan backend/models for reserved SQLAlchemy attribute names that cause
Declarative-time collisions (e.g. `metadata`).

Exit code:
- 0 : no problems
- 1 : violations found
"""
from __future__ import annotations
import ast
import sys
from pathlib import Path
from typing import List, Tuple

ROOT = Path(__file__).resolve().parents[1]  # repo root (scripts/..)
MODELS_DIR = ROOT / "backend" / "models"
RESERVED_NAMES = {"metadata"}  # names that will break SQLAlchemy Declarative
ALSO_WARN_IF_BOTH = ("metadata", "metadata_json")  # warn if both exist in same class


def find_violations(path: Path) -> List[Tuple[Path, str, int, str]]:
    """Return list of (file, class_name, lineno, message) for violations."""
    violations = []
    for p in sorted(MODELS_DIR.rglob("*.py")):
        try:
            src = p.read_text(encoding="utf-8")
        except Exception:
            continue
        try:
            mod = ast.parse(src, filename=str(p))
        except SyntaxError:
            # Skip files with syntax errors (not expected)
            continue

        for node in mod.body:
            if isinstance(node, ast.ClassDef):
                # collect simple class-level assignment targets
                attr_names = set()
                name_to_lineno = {}
                for stmt in node.body:
                    # handle simple Assign and AnnAssign
                    if isinstance(stmt, ast.Assign):
                        for t in stmt.targets:
                            if isinstance(t, ast.Name):
                                attr_names.add(t.id)
                                name_to_lineno[t.id] = getattr(t, "lineno", stmt.lineno)
                    elif isinstance(stmt, ast.AnnAssign):
                        t = stmt.target
                        if isinstance(t, ast.Name):
                            attr_names.add(t.id)
                            name_to_lineno[t.id] = getattr(t, "lineno", stmt.lineno)

                # check for reserved names
                for bad in RESERVED_NAMES:
                    if bad in attr_names:
                        lineno = name_to_lineno.get(bad, node.lineno)
                        msg = f"class '{node.name}' defines reserved attribute '{bad}'"
                        violations.append((p, node.name, lineno, msg))

                # warn if both metadata and metadata_json are present in same class
                if set(ALSO_WARN_IF_BOTH).issubset(attr_names):
                    lineno = min(name_to_lineno.get(name, node.lineno) for name in ALSO_WARN_IF_BOTH)
                    msg = f"class '{node.name}' defines both 'metadata' and 'metadata_json' (possible confusion)"
                    violations.append((p, node.name, lineno, msg))

    return violations


def main() -> int:
    if not MODELS_DIR.exists():
        print(f"models directory not found at {MODELS_DIR}, skipping check")
        return 0

    violations = find_violations(MODELS_DIR)
    if not violations:
        print("OK: no reserved-model-attribute violations found.")
        return 0

    print("ERROR: reserved-model-attribute violations found:")
    for path, cls, lineno, msg in violations:
        rel = path.relative_to(ROOT)
        print(f"- {rel}:{lineno} -> {msg}")

    print(
        "\nFix suggestion: rename the Python attribute (e.g. `metadata` -> `metadata_json`) "
        "and keep the DB column name using Column('metadata', JSON, ...)."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
