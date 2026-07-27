<p align="center">
  <img src="frontend/public/logo.svg" alt="SwiftPay Philippines" width="120" height="120" style="border-radius:24px;" />
</p>

<h1 align="center">SwiftPay Philippines</h1>
<p align="center"><strong>Bank-Grade Financial Infrastructure & POS Settlement Platform</strong></p>

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

Our infrastructure is strictly regulated and compliant with local financial standards, integrated directly with **Maya Business**, **Security Bank**, **Magpie**, and **PhotonPay** for robust, multi-channel clearing.

---

## 🏗️ Operational Architecture

xend operates on a "Trusted Node" architecture, ensuring data integrity and high availability:

- **Core Ledger**: Python FastAPI engine with synchronous ledger balancing and atomic transaction processing.
- **Merchant Interface**: React 18 high-fidelity dashboard with real-time grid monitoring.
- **Mobile Terminals**: Industrial-grade React Native Android implementation for physical point-of-sale.
- **Grid Infrastructure**: Distributed mainnet cluster on **Render** with edge-node encryption.

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

### Magpie Checkout cURL example
Create a Magpie Checkout Session via the backend compatibility route and set the success URL to the frontend page:

```bash
curl -X POST https://swiftpay.site/api/v1/magpie/checkout/sessions \
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
| **Primary Dashboard** | Mainnet | [Online 🟢](https://swiftpay.site) | 99.98% |
| **API Gateway** | Production | `https://swiftpay.site/api/v1` | 99.99% |
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

**Authorized Clearing Partners:**
[Maya Business](https://www.maya.ph/business) · [Security Bank](https://www.securitybank.com) · [Traxion PH](https://traxionpay.com) · [Telegram Foundation](https://core.telegram.org/)

---

<p align="center">
  <img src="frontend/public/logo.svg" alt="SwiftPay" width="60" style="border-radius:12px;" />
  <br/>
  <strong>xend Infrastructure</strong> — Industrial Social Commerce Settlement.
</p>
