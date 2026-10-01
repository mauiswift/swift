# Swift Banking System - Project Definition

## Project Overview
**Swift** is a multi-currency banking and payment processing platform designed to manage merchant accounts, process payments, handle settlements, and provide financial controls for a network of merchants and financial operators.

## Core Business Model

### Key Entities
1. **Merchants/Owners** - Primary customers managing wallets and conducting transactions
2. **Wallets** - Multi-currency account balances (PHP, USDT, KRW, CNY)
3. **Transactions** - Payment operations and fund transfers
4. **Settlements** - Periodic reconciliation and fund distribution
5. **Team Members** - Staff with granular permissions managing merchant accounts
6. **Platform Operators** - System admins controlling platform operations

### Supported Currencies & Integrations
- **Fiat**: PHP (Philippine Peso), KRW (Korean Won)
- **Crypto**: USDT (via BitGo, Tatum)
- **Payment Channels**: BDO, Metrobank, various digital payment methods
- **Regional Support**: Philippines, Korea, Multi-country capable

## Core Workflows

### 1. Merchant Operations
- Merchant account creation and onboarding
- KYC/verification management
- Wallet balance management across multiple currencies
- Deposit and withdrawal requests
- Transaction history and reporting

### 2. Payment Processing
- Checkout integration for merchants
- Multi-currency payment support
- Currency conversion and fee calculation
- Real-time payment status tracking
- Payment channel selection (bank transfer, crypto, etc.)

### 3. Financial Management
- Wallet credit/debit operations
- Settlement batch processing
- Fee calculation and distribution
- Crypto top-up request approvals
- Account freezing for compliance

### 4. Team & Access Control
- Team member invitation and onboarding
- Granular permission system (move away from role-based)
- Audit logging of all operations
- Team member lifecycle management

### 5. Operational Control
- Platform maintenance mode (pause public access)
- Payment channel enable/disable
- Wallet settings configuration
- Checkout design customization
- Database maintenance and test data cleanup

## Admin Control Requirements

### Critical Monitoring Needs
- Real-time transaction volume and status
- Settlement reconciliation status
- Account balance anomalies
- Team member activity and permissions
- Payment channel health status

### Required Operations
- Approve/reject crypto top-up requests
- Adjust wallet balances (credit/debit)
- Toggle payment channels per currency
- Manage merchant access and status
- Invite and manage team members with permissions
- Enable/disable maintenance mode
- Configure system fees and collection rates

### Compliance & Governance
- Audit log review and export
- Merchant activity tracking
- Team member access audit
- Settlement verification
- API key management
