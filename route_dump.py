import os
import sys
import traceback
from typing import Iterable

os.environ['JWT_SECRET_KEY'] = 'test'
os.environ['TELEGRAM_BOT_TOKEN'] = '123456:TEST'
os.environ['TELEGRAM_ADMIN_IDS'] = '123'

sys.path.insert(0, 'backend')

from fastapi.routing import APIRoute


def flatten_routes(routes):
    for r in routes:
        cls_name = r.__class__.__name__
        if hasattr(r, 'routes'):
            yield from flatten_routes(getattr(r, 'routes'))
        elif hasattr(r, 'router') and hasattr(r.router, 'routes'):
            yield from flatten_routes(r.router.routes)
        elif hasattr(r, 'path') and hasattr(r, 'methods'):
            yield r
        else:
            yield r

try:
    import main
    app = main.app
    actual_routes = []
    for r in flatten_routes(app.routes):
        if hasattr(r, 'path') and hasattr(r, 'methods'):
            actual_routes.append((r.path, sorted(r.methods), getattr(r, 'name', '')))
        else:
            actual_routes.append(('UNKNOWN', type(r).__name__, repr(r)))
    for path, methods, name in sorted(actual_routes, key=lambda x: (str(x[0]), str(x[1]))):
        print(path, methods, name)
except Exception:
    traceback.print_exc()
