Deployment notes
----------------

1) Alembic migration

- After pulling these changes, run the alembic migration to add the unique index:

```bash
cd backend
alembic upgrade head
```

- If your production DB contains duplicate `(service_name, config_key)` rows, the migration attempts to deduplicate by keeping the row with the highest `id`. Review and back up your DB before running migrations.

2) MASK_KEY env var

- The `config_value` field is now encrypted at rest using `core.mask_crypto`. Set a strong `MASK_KEY` in your environment for production, e.g.:

```bash
export MASK_KEY="$(openssl rand -base64 32)"
```

Without `MASK_KEY`, the code falls back to an internal key (not secure). Keep `MASK_KEY` secret and rotate as needed.

3) Running tests and CI

- A GitHub Actions workflow `.github/workflows/ci.yml` is included to build the frontend and run backend tests on PRs and pushes to `main`.

4) Post-deploy verification

- After deploying and running migrations, verify the admin API keys list in the Admin UI and confirm that values are masked.

5) Building a Docker image that builds the frontend and backend

- The backend Dockerfile in this repository is multi-stage: it first builds the React frontend (using pnpm) and then builds the Python backend image, copying the generated frontend artifacts into backend/static so the FastAPI app can serve the UI.

- Build the image from the repository root (so the frontend/ directory is in the Docker build context):

```bash
# run from the repository root
docker build -f backend/Dockerfile -t paybot:latest .
```

- To pass Vite build-time variables (e.g., Turnstile site key or Telegram bot username):

```bash
docker build \
  --build-arg VITE_TURNSTILE_SITE_KEY=your_turnstile_key \
  --build-arg VITE_TELEGRAM_BOT_USERNAME=your_bot_username \
  -f backend/Dockerfile -t paybot:latest .
```

- Local development alternative (rebuild frontend and copy into backend/static):

```bash
cd frontend
pnpm install --no-frozen-lockfile
pnpm build
# from repo root
cp -r frontend/dist/* backend/static/
```

- Note: If you build the Docker image using the backend/ directory as the build context (e.g., `docker build backend/`), the frontend/ sources will not be available and the Dockerfile's frontend build stage will fail. Build from the repo root or use the top-level Dockerfile which already contains the same multi-stage build.

---

