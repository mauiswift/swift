import os
import sys
import traceback

os.environ['JWT_SECRET_KEY'] = 'test'
os.environ['TELEGRAM_BOT_TOKEN'] = '123456:TEST'
os.environ['TELEGRAM_ADMIN_IDS'] = '123'

sys.path.insert(0, 'backend')

import pkgutil
import routers

for _, modname, ispkg in pkgutil.walk_packages(routers.__path__, 'routers.'):
    if ispkg:
        continue
    try:
        print('IMPORT', modname)
        __import__(modname)
    except Exception:
        print('ERROR importing', modname)
        traceback.print_exc()
        print('-----')
