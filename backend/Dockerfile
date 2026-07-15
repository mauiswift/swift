# ── Stage 1: Build the React frontend ───────────────────────────────────────
FROM cgr.dev/chainguard/node:latest-dev AS frontend-builder

USER root

WORKDIR /app/frontend

ARG VITE_TURNSTILE_SITE_KEY=""
ARG VITE_TELEGRAM_BOT_USERNAME=""
ENV VITE_TURNSTILE_SITE_KEY=${VITE_TURNSTILE_SITE_KEY}
ENV VITE_TELEGRAM_BOT_USERNAME=${VITE_TELEGRAM_BOT_USERNAME}

# Warning if turnstile key is missing (CAPTCHA will not work)
RUN if [ -z "$VITE_TURNSTILE_SITE_KEY" ]; then echo "WARNING: VITE_TURNSTILE_SITE_KEY build arg is not set. CAPTCHA features will be disabled."; fi

# Enable and pin the exact pnpm version declared in package.json
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

# Install dependencies first (cached layer)
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the frontend source and build
COPY frontend/ .
RUN pnpm build

# ── Stage 2: Python backend ──────────────────────────────────────────────────
ARG PY_BASE_IMAGE=public.ecr.aws/docker/library/python:3.11-slim
FROM ${PY_BASE_IMAGE}

WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    zbar-tools \
    libffi-dev \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file and install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy all backend source files
COPY backend/ .

# Copy the freshly built frontend assets into the static directory
COPY --from=frontend-builder /app/frontend/dist/ ./static/

# Expose port 8000
EXPOSE 8000

# Environment
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production
ENV LOG_LEVEL=info

# Start the server with migrations attempt first
CMD ["sh", "-c", "timeout 35 python -m alembic upgrade head || echo 'Alembic migration timed out or failed, continuing...' ; exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level info --no-access-log"]
