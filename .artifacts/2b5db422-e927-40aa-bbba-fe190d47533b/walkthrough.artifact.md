# Walkthrough - Core Logic Refactor & Loading Design Restoration

I have completed the comprehensive refactor of the wallet and user logic, and restored your preferred loading screen design across the web dashboard.

## Changes Made

### 1. Wallet Logic Unification
- **Standardized Owner Resolution**: The `WalletsService` now strictly resolves the "effective owner" of a wallet. If a user belongs to an organization, all their transactions and balance lookups are redirected to the shared organization wallet (`org:{id}`).
- **Atomic Operations**: Implemented `credit_wallet` and `debit_wallet` methods that use row-level locking (`FOR UPDATE`) to ensure balance integrity during concurrent operations.
- **Removed Legacy Logic**: Stripped out old `tg-` prefix migrations to simplify the service layer.

### 2. User & Auth Refactor
- **Consistent JWT Claims**: Updated `auth.py` to ensure `organization_id` and granular `permissions` are always included in the token payload, even for environment-configured admins.
- **Robust Invitations**: Fixed the team invitation process to correctly scope new members to the inviter's organization.
- **Manual Link Fallback**: When sending an invitation, the system now returns a manual acceptance link. This allows admins to copy and share the link even if SMTP is not configured.

### 3. Loading Design Restoration
- **Restored AppLoadingScreen**: The fintech-style "Syncing Ledger" screen is back as the primary loading indicator.
- **Updated Status Label**: Replaced the previous status with **"SYSTEM_READY.."** in emerald green to signal a successful system state.
- **Unified Component Usage**: Updated `App.tsx`, `Dashboard`, `Wallet`, `Transactions`, and `QR Codes` to use the restored components (`AppLoadingScreen` and `LoadingSpinner`).

## Verification Results

### Success Highlights
- **Atomic Transfers**: Verified that internal transfers correctly debit the sender and credit the recipient within a single atomic transaction.
- **Organization Scoping**: Confirmed that different users within the same organization now correctly share a single unified balance.
- **Link Copying**: The "Invite Member" form now provides a "Copy" button for the invitation link immediately upon creation.

### Deployment Status
- Changes are pushed to `main`.
- Railway deployment is in progress. You can monitor it at [https://swiftpay.site](https://swiftpay.site).
