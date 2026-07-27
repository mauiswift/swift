import os
import asyncio
from sqlalchemy import select, func

os.environ.setdefault('ENVIRONMENT', 'test')
os.environ.setdefault('DATABASE_URL', 'sqlite+aiosqlite:///C:/Users/DELL/AppData/Local/Temp/test_paybot_debug.db')
os.environ.setdefault('JWT_SECRET_KEY', 'test-secret-key-for-ci')
os.environ.setdefault('TELEGRAM_BOT_TOKEN', '123456:TEST_BOT_TOKEN')
os.environ.setdefault('TELEGRAM_ADMIN_IDS', '123456789')
os.environ.setdefault('INITIALIZE_DEMO_DATA', '1')

from core.config import settings
from core.database import db_manager
from services.database import initialize_database
from services.mock_data import initialize_mock_data
from models.wallets import Wallets
from models.disbursements import Disbursements

print('settings environment=', settings.environment)
print('settings telegram_admin_ids=', settings.telegram_admin_ids)
print('settings database_url=', settings.database_url)

async def main():
    await initialize_database()
    await initialize_mock_data()
    async with db_manager.async_session_maker() as db:
        wallet_count = await db.scalar(select(func.count(Wallets.id)))
        disb_count = await db.scalar(select(func.count(Disbursements.id)))
        print('wallet_count', wallet_count)
        print('disbursement_count', disb_count)
        wrows = (await db.execute(select(Wallets).limit(5))).scalars().all()
        drows = (await db.execute(select(Disbursements).limit(5))).scalars().all()
        print('wallet_examples', [(r.id, r.user_id, r.balance) for r in wrows])
        print('disb_examples', [(r.id, r.user_id, r.amount, r.status) for r in drows])

asyncio.run(main())
