<p align="center">
  <img src="frontend/public/logo.svg" alt="SwiftPay Philippines" width="120" height="120" style="border-radius:24px;" />
</p>

<h1 align="center">SwiftPay Philippines</h1>
<p align="center"><strong>Bank-Grade Financial Infrastructure & POS Settlement Platform</strong></p>

> **Repository status (17 September 2026):** The `korea` branch is deployed to Railway and
> serving [https://kr.swiftpay.site](https://kr.swiftpay.site). The latest release requires
> super-admin approval before any customer payment credits a merchant wallet or creates
> fees/commissions. PHP uses the native SwiftPay integration; CNY selected channels use
> Magpie Checkout Sessions; KRW permanent links use manual bank transfer with an optional
> Magpie card flow.

<p align="center">
  <img src="https://img.shields.io/badge/Status-Production--Live-success?style=for-the-badge&logo=statuspage" alt="Status: Production/Live" />
  <img src="https://img.shields.io/badge/Compliance-BSP%20Regulated%20%7C%20PCI--DSS-0EA5E9?style=for-the-badge" alt="Compliance" />
  <img src="https://img.shields.io/badge/Security-AES--256%20%7C%20RSA--SHA256-10B981?style=for-the-badge" alt="Security" />
  <img src="https://img.shields.io/badge/License-Enterprise-5D2E91?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-React%2018-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=flat-square&logo=python" />
  <img src="https://img.shields.io/badge/Infrastructure-Mainnet%20Cluster-000000?style=flat-square" />
  <img src="https://img.shields.io/badge/Settlement-Ultra%20T+0-FFD700?style=flat-square" />
</p>

---

## 🏛️ Enterprise Overview

**xend Philippines** is a premier, bank-grade financial settlement platform designed for licensed merchants and high-volume commercial operations. It transforms standard communication channels into high-performance financial nodes, enabling secure card acceptance, multi-currency liquidity management, and real-time clearing with enterprise-level oversight.

Our infrastructure integrates with **SwiftPay**, **Magpie**, **Paymentwall**, **PhotonPay**, and other configured providers for multi-channel collection. Compliance, provider availability, and production credentials must be verified for each deployment; this repository does not by itself certify regulatory status.

---

## 🏗️ Operational Architecture

xend operates on a "Trusted Node" architecture, ensuring data integrity and high availability:

- **Core Ledger**: Python FastAPI engine with synchronous ledger balancing and atomic transaction processing.
- **Merchant Interface**: React 18 high-fidelity dashboard with real-time grid monitoring.
- **Mobile Terminals**: Industrial-grade React Native Android implementation for physical point-of-sale.
- **Grid Infrastructure**: Railway deployments for the Korea environment, with PostgreSQL and persistent storage configured per environment.

---

## ✨ Core Capabilities (Production)

### 📟 POS Terminal Infrastructure
- **Industrial Card Processing**: Native support for Visa, Mastercard, JCB, and AMEX via bank-direct APIs.
- **Ultra T+0 Settlement**: Proprietary priority routing for immediate fund liquidation to verified merchant nodes.
- **Biometric & PIN Security**: Multi-factor authentication including secure 4-digit operator PINs and device-to-account binding.
- **Unified QRPH**: Dynamic generation of BSP-compliant QRPH codes for universal interoperability.

### 💳 Institutional Payment Gateways

- **Maya Business Mainnet**: Direct settlement and native e-wallet integration.
- **Security Bank Collect**: Enterprise-grade Apple Pay and Google Pay processing.
- **Global Clearing**: Specialized PhotonPay channels for high-volume Alipay and WeChat Pay international trade.

### 💎 Digital Wallet & Liquidity Ecosystem

- **Multi-Currency Nodes**: Seamlessly manage PHP, USD, and USDT (TRC-20) liquidity.
- **Regulated Clearing**: Automated T+1 local bank clearing and real-time inter-vault transfers.
- **Instant KYB/KYC**: Guided registration flow via Telegram.
- **Peer-to-Peer**: Zero-fee instant transfers between platform users.
- **Auto-Sync**: Real-time balance updates across bot, mobile, and dashboard.
- **Audit-Ready Ledger**: Full immutable transaction history for compliance and regulatory reporting.

---

## 🧑‍💻 Developer Quickstart
These steps help contributors get the project running locally and understand the main development workflows.

### Prerequisites
- Python 3.11
- Node.js LTS
- `pnpm` via Corepack (installed automatically by `start_app_v2.sh`)
- `git`

### Local setup
1. Create the backend environment file if it does not exist:
   - `cp backend/.env.example backend/.env`
   - Environment-specific files such as `backend/.env.production` are loaded automatically when
     `ENVIRONMENT=production`. Set `SWIFTPAY_ENV_FILE` to explicitly select another file.
2. Install backend dependencies:
   - `cd backend && python -m venv .venv && source .venv/bin/activate && python -m pip install --upgrade pip && python -m pip install -r requirements.txt`
3. Install frontend dependencies:
   - `cd frontend && corepack enable && pnpm install --frozen-lockfile`
4. Start the app with the shared launcher:
   - `bash start_app_v2.sh`

### Baseline smoke tests
- Backend smoke checks:
  - `cd backend && python -m pytest tests/test_baseline_smoke.py -q`
- Frontend smoke script:
  - `cd frontend && pnpm test:smoke`

> Production startup now fails fast when `JWT_SECRET_KEY` or `TELEGRAM_BOT_TOKEN` are missing. Local development will generate a temporary JWT secret and keep Telegram integrations disabled until credentials are provided.

### Start development servers
Use the repo's starter script to run backend and frontend together:

```bash
bash start_app_v2.sh
```

For Windows, run:

```powershell
.\"setup_windows.ps1\"; .\start_local_windows.ps1
```

### Run tests
- Backend tests:
  - `cd backend && python -m pytest tests/ -v --tb=short`
- Frontend lint:
  - `cd frontend && pnpm lint`

### Build production assets
- `cd frontend && pnpm build`
- If the backend serves static files from `backend/static/`, copy the generated assets into the backend static folder:
  - `cp -r frontend/dist/. backend/static/`
- When using the backend Dockerfile's multi-stage build, this copy is handled automatically during image build.

### Render production deployment
This repository includes a Render blueprint at [render.yaml](./render.yaml). It configures a Docker-based web service for the FastAPI backend with a managed Postgres database and health checks.

1. Push the branch to GitHub.
2. Create a new Render Web Service from the repository and select "Blueprint".
3. Render will create the app service and Postgres database using the values in [render.yaml](./render.yaml).
4. Set the remaining production-only secrets in the Render dashboard before the first deploy:
   - `JWT_SECRET_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_BOT_USERNAME`
   - `GOOGLE_CLIENT_ID`
   - `SWIFTPAY_ACCESS_KEY`
   - `SWIFTPAY_SECRET_KEY`
   - `MAGPIE_API_KEY`
   - `MAGPIE_SECRET_KEY`
   - `XENDIT_SECRET_KEY`
   - `XENDIT_WEBHOOK_SECRET`
   - `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`
5. Confirm the health check succeeds at `/api/v1/health`.

Render reads `RENDER_EXTERNAL_URL` automatically and the app will derive the backend URL from it when present.

### Google sign-in setup
The dashboard login page supports Google Sign-In via Google Identity Services.

1. In Google Cloud Console, create an **OAuth 2.0 Client ID** of type **Web application**.
2. In that client, add your domains under **Authorized JavaScript origins** (examples):
   - `https://kr.swiftpay.site`
   - `https://swiftpay.site`
   - `http://localhost:5173` (dev)
3. Set the runtime variable `GOOGLE_CLIENT_ID` on the backend service (Render/Railway/VM).
   - Optional: set `VITE_GOOGLE_CLIENT_ID` at build time if you build the frontend separately.
4. Verify config:
   - `GET /api/v1/auth/google-config` should return `{ "configured": true, "client_id": "..." }`.

### Magpie Checkout cURL example
Create a Magpie Checkout Session via the backend compatibility route and set the success URL to the frontend page:

```bash
  curl -X POST https://api.swiftpay.site/api/v1/magpie/checkout/sessions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_live_your_magpie_secret_key" \
  -d '{
    "payment_method_types": ["card", "gcash"],
    "payment_methods": ["card", "gcash"],
    "line_items": [{"name":"Test","amount":5000,"quantity":1}],
    "currency":"php",
    "success_url":"https://swiftpay.site/magpie-success?session_id={CHECKOUT_SESSION_ID}&payment_url={CHECKOUT_PAYMENT_URL}&amount={AMOUNT}",
    "cancel_url":"https://swiftpay.site/cancel"
  }'
```

> Note: `payment_methods` must be supplied at the top level so Magpie can map the checkout to the supported channels correctly. This is required for compatible checkout creation in some Magpie environments.

After payment, Magpie will redirect customers to the frontend route `/magpie-success` (or the backend static redirect which forwards there), preserving the session and payment_url query parameters.

### KRW collection safety
The documented SwiftPay live order API does not support `KRW` or virtual-account
allocation; its supported order currencies are `PHP`, `USD`, and `EUR`. The application
therefore fails closed for KRW rather than converting a KRW amount into a PHP order or
presenting an internal bank account as a provider-generated virtual account.

```env
PAYMENTWALL_APP_KEY=your_paymentwall_app_key
PAYMENTWALL_SECRET_KEY=your_paymentwall_secret_key
PAYMENTWALL_WIDGET_CODE=w123
PAYMENTWALL_SIGN_VERSION=3
```

These settings are retained for deployments with a separately verified KRW-capable
provider. Do not enable live KRW acceptance until that provider's API contract,
virtual-account allocation, deposit matching, and signed webhook have been configured
and tested in sandbox.

For a documented SwiftPay checkout, the safe alternative is to quote the customer's
amount in KRW and explicitly charge the converted amount in `USD` or `EUR`. The
conversion and both currency values are retained on the transaction; this is a
multi-currency hosted checkout, not a KRW virtual account.

### Production database persistence
Production must use PostgreSQL or a Railway persistent volume. If using the included
SQLite fallback, create a Railway volume mounted at `/data`; the container stores the
database at `/data/paybot.db`. Do not use the disposable application directory for
production user or transaction data.

---

## 🔐 Security & Regulatory Compliance

- **PCI-DSS 4.0 Compliant**: Our data handling processes meet the highest global standards for cardholder data security.
- **BSP Regulated Channels**: All local fund movements are routed through Bangko Sentral ng Pilipinas regulated clearing houses (InstaPay/PESONet).
- **AES-256 Encryption**: End-to-end encryption for all sensitive payloads and data-at-rest.
- **MFA Device Binding**: Hardware-level security mapping ensures terminals can only operate on authorized devices.

---

## 🌐 Operational Status

| Node | environment | status | uptime |
|---------|-------------|----------|--------|
| **Korea Dashboard** | Production | [Online 🟢](https://kr.swiftpay.site) | Health endpoint verified |
| **API Gateway** | Production | `https://api.swiftpay.site/api/v1` | Environment-dependent |
| **Telegram Node** | Live | [@QRPHBOT](https://t.me/QRPHBOT) | 100% |
| **Mobile Cluster** | Verified | Build `PB-2024-05` | Active |

---

## ⚙️ Implementation Guide

### Node Configuration
1. Initialize `.env.production` with institutional credentials.
2. Deploy the `Mainnet` cluster configuration.
3. Validate node connectivity via the diagnostic suite.

```bash
# Verify cluster integrity
powershell -File ./scripts/verify_node.ps1
```

### Mobile POS Deployment
1. Link authorized hardware to the `POSTerminal` controller.
2. Provision operator credentials and biometric seeds.
3. Build the production release:
   ```powershell
   ./build_production.ps1 -Target "Mobile-POS"
   ```

---

## 📄 Documentation Library

- [Mainnet API Specs](backend/README.md)
- [POS Terminal Integration Guide](POS_TERMINAL_README.md)
- [Compliance & Audit Checklist](PRODUCTION_CHECKLIST.md)
- [Industrial Mobile Ops](mobile/android/README.md)

---

## 🏛️ Governance & Development

Maintained by **Sir Den Russell "Camus" Leonardo** and the **DRL Solutions** engineering group.

**Configured integrations include:**
[Maya Business](https://www.maya.ph/business) · [Security Bank](https://www.securitybank.com) · [Traxion PH](https://traxionpay.com) · [Telegram Foundation](https://core.telegram.org/)

---

<p align="center">
  <img src="frontend/public/logo.svg" alt="SwiftPay" width="60" style="border-radius:12px;" />
  <br/>
  <strong>xend Infrastructure</strong> — Industrial Social Commerce Settlement.
</p>
