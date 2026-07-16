#!/bin/bash
set -e

# Backend container entrypoint

echo "Running database migrations..."
# Fix multiple head revisions by stamping the merge migration
cd backend

# Try to stamp the merge migration to resolve heads
python -c "
from alembic.config import Config
from alembic import command

config = Config('alembic.ini')
try:
    # Get current heads
    from alembic.runtime.migration import MigrationContext
    from alembic.operations import Operations
    
    # Try upgrade with heads (plural) - will apply all heads including merge
    command.upgrade(config, 'heads')
except Exception as e:
    print(f'Heads upgrade attempt: {e}')
    # If that fails, try individual stamp then upgrade
    try:
        print('Attempting to manually resolve heads...')
        command.upgrade(config, 'z9999_merge_heads')
    except Exception as e2:
        print(f'Merge stamp attempt: {e2}')
        print('Continuing despite migration error...')
" || echo "Alembic migration timed out or failed, continuing..."

echo "Starting FastAPI server..."
# Using exec ensures that uvicorn receives signals (like SIGTERM) directly.
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info --no-access-log --log-config /app/backend/uvicorn_logging.json
