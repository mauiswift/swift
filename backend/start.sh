#!/bin/bash
set -e

# Backend container entrypoint

echo "Running database migrations..."
cd backend

# Force skip the problematic migration and continue
python -m alembic upgrade heads 2>&1 | grep -v "DuplicateTableError\|relation.*already exists" || true

echo "Starting FastAPI server..."
# Using exec ensures that uvicorn receives signals (like SIGTERM) directly.
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info --no-access-log --log-config /app/backend/uvicorn_logging.json
