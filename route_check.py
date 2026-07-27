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
    for r in sorted(app.routes, key=lambda r: r.path):
        print(' '.join(sorted(r.methods)), r.path)
except Exception:
    traceback.print_exc()
