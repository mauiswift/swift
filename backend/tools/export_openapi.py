import json
from pathlib import Path

from main import app

spec = app.openapi()
out = Path(__file__).resolve().parent.parent.parent / 'openapi.json'
out.write_text(json.dumps(spec, indent=2, ensure_ascii=False), encoding='utf-8')
print(f'Wrote {out} with {len(spec.get("paths", {}))} paths')
