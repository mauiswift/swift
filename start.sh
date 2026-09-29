#!/bin/bash
set -e

echo 'Installing Python dependencies...'
pip install -r backend/requirements.txt

echo 'Running database migrations...'
cd backend
alembic upgrade heads

echo 'Starting FastAPI application...'
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}