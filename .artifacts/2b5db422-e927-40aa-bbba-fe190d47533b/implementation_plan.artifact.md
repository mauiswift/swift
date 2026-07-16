# Implementation Plan - Refactor Wallet, User Logic, and Dashboard Pages

This plan addresses a comprehensive refactor of the core business logic and frontend structure to improve stability, security, and developer experience.

## User Review Required

> [!IMPORTANT]
> - **Wallet Unification**: I will be migrating all wallet lookups to strictly prioritize `organization_id` over individual `user_id`. This means if a user belongs to an organization, they *only* see and use the organization's wallet.
> - **Loading Design**: Restoring the full-screen "Syncing Ledger" and inline "LoadingSpinner" as per your preference.
> - **Database Stability**: Holistically addressing the `MissingGreenlet` error by ensuring all I/O is explicitly handled within greenlet-safe contexts and eager loading relations.

## Proposed Changes

### 1. Wallet Logic Refactor

#### [MODIFY] [wallets.py](file:///C:/Users/DELL/Desktop/swift/backend/services/wallets.py)
- **Simplify ID Resolution**: Remove legacy `tg-` prefix handling. Standardize on `org:{id}` for organizations and raw `user_id` for personal wallets.
- **Atomic Balance Updates**: Implement `credit_wallet` and `debit_wallet` methods that use atomic SQL updates (`F()` expressions if possible, or strictly locked rows) to prevent race conditions.
- **Eager Loading**: Update all queries to use `selectinload` for related transactions to prevent async loading errors.

#### [MODIFY] [wallet_integration.py](file:///C:/Users/DELL/Desktop/swift/backend/services/wallet_integration.py)
- Update integration points (Magpie, SwiftPay) to use the new unified wallet service methods.

---

### 2. User & Auth Logic Refactor

#### [MODIFY] [auth.py](file:///C:/Users/DELL/Desktop/swift/backend/routers/auth.py)
- **Standardize Token Claims**: Ensure `organization_id` and `permissions` are consistently included and correctly typed in the JWT payload.
- **Organization Propagation**: Ensure organization data is fetched once at login and stored in the session/token.

#### [MODIFY] [team_invitations.py](file:///C:/Users/DELL/Desktop/swift/backend/routers/team_invitations.py)
- **Fix Invitation Bug**: Ensure the `organization_id` is correctly assigned during the invitation process based on the inviter's scope.
- **Manual Link Fallback**: Retain the fix allowing manual link copying if SMTP fails.

---

### 3. Web Dashboard Refactor

#### [MODIFY] [App.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/App.tsx)
- Group routes logically (Public, Protected, Admin).
- Ensure consistent usage of `AppLoadingScreen` for suspense and auth transitions.

#### [MODIFY] [Dashboard.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Dashboard.tsx) & [Wallet.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Wallet.tsx)
- Unify the layout and loading patterns.
- Ensure the Wallet page correctly reflects the organization-scoped balances.

#### [MODIFY] [TeamManagement.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/components/TeamManagement.tsx)
- Refine the "Invite Member" UI to be more intuitive.
- Fix the logic that was causing invitations to fail or not show up correctly.

## Verification Plan

### Automated Tests
- Run backend unit tests for `WalletsService` to ensure balance integrity.
- Verify JWT payload structure via a debug script.

### Manual Verification
- **Organization Wallet**: Log in with two different users in the same org; verify they share the same balance.
- **Member Invitation**: Invite a new user, copy the manual link, and verify it works.
- **Loading Screens**: Confirm "Syncing Ledger" appears correctly.
