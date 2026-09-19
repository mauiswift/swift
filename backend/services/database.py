import logging
import os
import time

from core.database import db_manager
from sqlalchemy import Integer, select, text

logger = logging.getLogger(__name__)


async def check_database_health() -> bool:
    """Check if database is healthy"""
    start_time = time.time()
    logger.debug("[DB_OP] Starting database health check")
    try:
        if not db_manager.async_session_maker:
            return False

        async with db_manager.async_session_maker() as session:
            await session.execute(text("SELECT 1"))
            logger.debug(f"[DB_OP] Database health check completed in {time.time() - start_time:.4f}s - healthy: True")
            return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        logger.debug(f"[DB_OP] Database health check failed in {time.time() - start_time:.4f}s - healthy: False")
        return False


async def sync_database_sequences():
    """Synchronize PostgreSQL sequences with table max IDs to prevent unique constraint violations."""
    from core.config import settings
    if "postgresql" not in str(settings.database_url).lower():
        return

    logger.info("🔧 Synchronizing database sequences...")
    from core.database import Base

    tables = []
    for table in Base.metadata.sorted_tables:
        primary_key = next(
            (
                column
                for column in table.primary_key.columns
                if isinstance(column.type, Integer)
            ),
            None,
        )
        if primary_key is not None:
            tables.append((table.name, primary_key.name))

    async with db_manager.async_session_maker() as session:
        for table, primary_key in tables:
            try:
                # Check if table exists
                quoted_table = table.replace('"', '""')
                quoted_primary_key = primary_key.replace('"', '""')
                sequence_result = await session.execute(
                    text(
                        "SELECT pg_get_serial_sequence("
                        f"'\"{quoted_table}\"', '{quoted_primary_key}')"
                    )
                )
                sequence_name = sequence_result.scalar_one_or_none()
                if not sequence_name:
                    continue
                await session.execute(
                    text(
                        f'SELECT setval(:sequence_name, COALESCE((SELECT MAX("{quoted_primary_key}") '
                        f'FROM "{quoted_table}"), 1), true)'
                    ),
                    {"sequence_name": sequence_name},
                )
                logger.info(f"✅ Synchronized sequence for {table}")
            except Exception as e:
                logger.warning(f"⚠️ Could not sync sequence for {table}: {e}")
        await session.commit()


async def initialize_database():
    """Initialize database and create tables"""
    if "MGX_IGNORE_INIT_DB" in os.environ:
        logger.info("Ignore creating tables")
        return
    start_time = time.time()
    logger.debug("[DB_OP] Starting database initialization")
    try:
        # Ensure all models are registered with SQLAlchemy metadata
        try:
            import models.all
            logger.info("🔧 All models registered successfully")
        except ImportError as e:
            logger.error(f"❌ Failed to import all models: {e}")
            # Continue anyway, some tables might still be created or already exist

        logger.info("🔧 Starting database initialization...")
        await db_manager.init_db()
        logger.info("🔧 Database connection initialized, now creating tables if tables not exist...")
        await db_manager.create_tables()
        logger.info("🔧 Table creation completed")

        # FIX: Synchronize sequences after table creation/initialization
        try:
            await sync_database_sequences()
        except Exception as e:
            logger.warning(f"🔧 Sequence synchronization skipped or failed: {e}")

        logger.info("Database initialized successfully")
        logger.debug(f"[DB_OP] Database initialization completed in {time.time() - start_time:.4f}s")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def close_database():
    """Close database connections"""
    start_time = time.time()
    logger.debug("[DB_OP] Starting database close")
    try:
        await db_manager.close_db()
        logger.info("Database connections closed")
        logger.debug(f"[DB_OP] Database close completed in {time.time() - start_time:.4f}s")
    except Exception as e:
        logger.error(f"Error closing database: {e}")
        logger.debug(f"[DB_OP] Database close failed in {time.time() - start_time:.4f}s")
