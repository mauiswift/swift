import os
import sys
import importlib
from pathlib import Path

os.environ['JWT_SECRET_KEY'] = 'test'
os.environ['TELEGRAM_BOT_TOKEN'] = '123456:TEST'
os.environ['TELEGRAM_ADMIN_IDS'] = '123'

sys.path.insert(0, 'backend')

import main

print('MAIN FILE', main.__file__)
print('APP ROUTES:', len(main.app.routes))

for idx, route in enumerate(main.app.routes[:50]):
    cls = type(route).__name__
    print('\nINDEX', idx, 'CLASS', cls)
    print('PATH', getattr(route, 'path', None), 'NAME', getattr(route, 'name', None))
    print('METHODS', getattr(route, 'methods', None))
    if cls == '_IncludedRouter':
        print('DIR keys', [k for k in dir(route) if not k.startswith('_')])
        print('HAS original_router', hasattr(route, 'original_router'))
        print('HAS include_context', hasattr(route, 'include_context'))
        print('HAS routes', hasattr(route, 'routes'))
        print('original_router', getattr(route, 'original_router', None))
        ic = getattr(route, 'include_context', None)
        if ic is not None:
            print('include_context prefix', getattr(ic, 'prefix', None))
            print('include_context default_response_class', getattr(ic, 'default_response_class', None))
        orig = getattr(route, 'original_router', None)
        if orig is not None:
            try:
                print('orig routes len', len(getattr(orig, 'routes', [])))
                for j, child in enumerate(getattr(orig, 'routes', [])[:20]):
                    print(' CHILD', j, type(child).__name__, getattr(child, 'path', None), getattr(child, 'name', None), getattr(child, 'methods', None))
            except Exception as e:
                print(' orig inspect error', e)

print('\nAPP ROUTER ROUTES:', len(main.app.router.routes))
for idx, route in enumerate(main.app.router.routes[:50]):
    print('RINDEX', idx, type(route).__name__, getattr(route, 'path', None), getattr(route, 'name', None), getattr(route, 'methods', None))
