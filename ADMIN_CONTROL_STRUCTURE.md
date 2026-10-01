# Swift Banking System - Admin Control Center

## System Overview

**Swift** is a multi-currency banking platform enabling merchants to manage wallets, process payments, and conduct settlements across multiple currencies (PHP, USDT, KRW, CNY).

---

## Admin Control Structure

The admin interface is now organized around **banking workflows** with 5 main sections:

### 🏦 Banking Operations
**Daily merchant and transaction management**

| Tab | Purpose | Icon |
|-----|---------|------|
| **Dashboard** | Overview of key metrics, recent transactions, system status | 📊 |
| **Merchants** | Merchant account management and owner information | 👥 |
| **Transactions** | Monitor and manage payment transactions | 📈 |
| **Settlements** | Manage settlement batches and reconciliation | 💵 |

### 💰 Financial Control
**Wallet and fund operations**

| Tab | Purpose | Icon |
|-----|---------|------|
| **Wallet Control** | Credit/debit wallets and manage account balances | 💳 |
| **Crypto Approvals** | Review and approve USDT top-up requests | ₿ |

### ⚙️ Payment Configuration
**Payment method setup and management**

| Tab | Purpose | Icon |
|-----|---------|------|
| **Payment Channels** | Enable/disable payment methods by currency and region | 🔌 |
| **Wallet Settings** | Configure wallet deposit currencies and receiving accounts | 🔧 |

### 🔐 Access & Governance
**User management and compliance**

| Tab | Purpose | Icon |
|-----|---------|------|
| **Users** | Platform user and role management | 👤 |
| **Team Invitations** | Manage pending team member invitations | ✉️ |
| **Team Members** | Manage team members and their permissions | 👫 |
| **Audit Logs** | Audit trail of all platform operations | 📋 |

### 🛠️ Platform Management
**System configuration and maintenance**

| Tab | Purpose | Icon |
|-----|---------|------|
| **Platform Settings** | System-wide settings and fee configuration | ⚙️ |
| **Operations** | Operational workflows and maintenance tasks | 🔄 |
| **Test Data Cleanup** | Clear test transactions and data | 🗑️ |

---

## Key Access Permissions

Permission checks are now aligned with banking operations:

```typescript
canAccessDashboard        → Dashboard overview
canAccessMerchants        → Merchant management
canAccessTransactions     → Payment monitoring & management
canAccessSettlements      → Settlement batch operations
canAccessWalletControl    → Wallet credit/debit operations
canAccessCryptoApprovals  → USDT approval workflow
canAccessPaymentChannels  → Payment method configuration
canAccessWalletSettings   → Wallet configuration
canAccessUserManagement   → Platform users
canAccessPlatformSettings → System configuration
canAccessOperations       → Operational workflows
canManageTeam             → Team invitations & members
canAccessGovernance       → Audit logs
```

---

## Default Entry Point

Admin users now land on the **Dashboard** which provides:
- Real-time system health status
- Transaction volume overview
- Settlement status
- Recent activity
- Key alerts and notifications

From there, they can navigate to specific operational areas based on their role and permissions.

---

## Next Steps

Each tab placeholder is ready to be implemented with:
1. Real data fetching and filtering
2. Specific banking operations
3. Error handling and validation
4. Audit logging
5. Real-time updates

Start with the Dashboard and Transactions tabs as they're the most frequently accessed.
