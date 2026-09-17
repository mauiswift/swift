# SwiftPay Backend

> **Current state (17 September 2026):** The `korea` branch is deployed to Railway.
> Customer payment provider confirmations remain pending until a super admin approves
> them. Wallet crediting, fees, and downline commissions occur only during approval.

The FastAPI backend for SwiftPay's dashboard, Telegram bot, merchant checkout, payment
providers, wallet ledger, and approval workflows. It supports SQLite for local development
and PostgreSQL for production.

## 🏛️ Enterprise Specifications

- **Institutional Clearing**: Native multi-channel settlement for Maya Business, Security Bank, and global clearing partners.
- **Node Governance Engine**: Advanced backend protocols for managing industrial POS hardware and virtual merchant nodes.
- **Synchronous Ledger Sync**: Proprietary event-bus architecture for real-time atomic balance updates across the grid.
- **Multi-Currency Vaults**: Regulated PHP/USD/USDT (TRC-20) liquidity pools with automated clearing windows.
- **Cybersecurity Core**: Hardened JWT-MFA authentication, strict hardware-level device binding, and cryptographically verified webhooks.

## 📁 Mainnet Architecture

```
backend/
├── main.py                # Grid entry point & cluster lifespan management
├── core/
│   ├── config.py          # Institutional settings & Vault management
│   └── database.py        # High-concurrency async engine & pool manager
├── models/                # Immutable Ledger & Governance models
├── routers/               # Clearing endpoints (v1 Production)
├── services/              # Institutional logic (Clearing, POS, Liquidity)
├── schemas/               # Strict Pydantic protocol validation
├── alembic/               # Schema evolution & migrations
└── dependencies/          # Shared grid dependencies (Auth, DB)
```

## Deployment

### Configuration

```env
ENVIRONMENT=production
DATABASE_URL=postgresql+asyncpg://...
JWT_SECRET_KEY=...
TELEGRAM_BOT_TOKEN=...
```

### Local startup
```bash
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Railway deployment

The GitHub workflow deploys pushes to `main` and `korea`. The Korea project uses the
Railway project configured in `.github/workflows/deploy-railway.yml`. A valid
`RAILWAY_TOKEN` GitHub environment secret is required for automatic deployment.
The current deployed health check is:

```text
https://kr.swiftpay.site/health
```

---
*© 2024 xend Infrastructure Engineering*
