import os
import sys
import traceback

os.environ['JWT_SECRET_KEY'] = 'test'
os.environ['TELEGRAM_BOT_TOKEN'] = '123456:TEST'
os.environ['TELEGRAM_ADMIN_IDS'] = '123'

sys.path.insert(0, 'backend')

try:
    import main
    print('MAIN OK')
    app = main.app
    print('ROUTES', len(app.routes))
    print('---')
    for idx, r in enumerate(app.routes):
        print('ROUTE', idx, type(r).__name__)
        print('  repr:', repr(r))
        if hasattr(r, 'path'):
            print('  path:', r.path)
        if hasattr(r, 'methods'):
            print('  methods:', r.methods)
        if hasattr(r, 'name'):
            print('  name:', r.name)
        if hasattr(r, 'router'):
            print('  router:', r.router)
        if hasattr(r, 'routes'):
            print('  nested routes:', len(r.routes))
except Exception:
    traceback.print_exc()
