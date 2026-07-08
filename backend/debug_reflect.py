import os
import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine
from services.mock_data import _reflect_table

os.environ.setdefault('ENVIRONMENT', 'test')
os.environ.setdefault('DATABASE_URL', 'sqlite+aiosqlite:///C:/Users/DELL/AppData/Local/Temp/test_paybot_reflect.db')
os.environ.setdefault('JWT_SECRET_KEY', 'test-secret-key-for-ci')
os.environ.setdefault('TELEGRAM_BOT_TOKEN', '123456:TEST_BOT_TOKEN')
os.environ.setdefault('TELEGRAM_ADMIN_IDS', '123456789')

async def main():
    engine = create_async_engine(os.environ['DATABASE_URL'], future=True)
    async with engine.begin() as conn:
        disb_table = await _reflect_table(conn, 'disbursements')
        print('disbursements columns:')
        for col in disb_table.columns:
            print(col.name, col.nullable, col.default, col.server_default, getattr(col.default, 'arg', None), getattr(col.server_default, 'arg', None), type(col.type).__name__)
        print('---')
        wallet_table = await _reflect_table(conn, 'wallets')
        print('wallet columns:')
        for col in wallet_table.columns:
            print(col.name, col.nullable, col.default, col.server_default, getattr(col.default, 'arg', None), getattr(col.server_default, 'arg', None), type(col.type).__name__)
    await engine.dispose()

asyncio.run(main())
