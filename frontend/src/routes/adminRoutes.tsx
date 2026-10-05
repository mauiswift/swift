import React from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import RequireAuth from '@/components/RequireAuth';
import RequireSuperAdmin from '@/components/RequireSuperAdmin';
import RequireWithdrawalsAccess from '@/components/RequireWithdrawalsAccess';
import RequireDeveloperRole from '@/components/RequireDeveloperRole';
import Dashboard from '../pages/dashboard/index';

const DisbursementsPage = React.lazy(() => import('../pages/DisbursementsPage'));
const ReportsPage = React.lazy(() => import('../pages/ReportsPage'));
const Settings = React.lazy(() => import('../pages/Settings'));
const SettingsStoreProfile = React.lazy(() => import('../pages/settings/StoreProfile'));
const SettingsBanking = React.lazy(() => import('../pages/settings/Banking'));
const SettingsApiIntegration = React.lazy(() => import('../pages/settings/ApiIntegration'));
const SettingsAccountSecure = React.lazy(() => import('../pages/settings/AccountSecure'));
const PaymentLinksList = React.lazy(() => import('../pages/paylink/PaymentLinksList'));
const CreatePaymentLink = React.lazy(() => import('../pages/paylink/CreatePaymentLink'));
const PaymentLinkDetails = React.lazy(() => import('../pages/paylink/PaymentLinkDetails'));
const CreateInternationalLink = React.lazy(() => import('../pages/paylink/CreateInternationalLink'));
const ChangePasswordPage = React.lazy(() => import('../pages/ChangePasswordPage'));
const DownlineManagement = React.lazy(() => import('../pages/DownlineManagement'));
const Approvals = React.lazy(() => import('../pages/Approvals'));
const BankDepositsPage = React.lazy(() => import('../pages/BankDepositsPage'));
const TopupRequestsPage = React.lazy(() => import('../pages/TopupRequestsPage'));
const SuperAdminPaymentApproval = React.lazy(() => import('../pages/payment-approvals'));
const PaymentsPage = React.lazy(() => import('../pages/PaymentsPage'));
const Transactions = React.lazy(() => import('../pages/Transactions'));
const LiveDashboard = React.lazy(() => import('../pages/backoffice/LiveDashboard'));
const LiveTransactions = React.lazy(() => import('../pages/backoffice/LiveTransactions'));
const PaymentDetails = React.lazy(() => import('../pages/PaymentDetails'));
const DisbursementDetails = React.lazy(() => import('../pages/DisbursementDetails'));
const BatchDisbursement = React.lazy(() => import('../pages/BatchDisbursement'));
const SendSingleDisbursement = React.lazy(() => import('../pages/SendSingleDisbursement'));
const BotIntro = React.lazy(() => import('../pages/BotIntro'));
const BotSettings = React.lazy(() => import('../pages/BotSettings'));
const BotMessagesPage = React.lazy(() => import('../pages/BotMessagesPage'));
const AdminManagement = React.lazy(() => import('../pages/AdminManagement'));
const RolesPage = React.lazy(() => import('../pages/RolesPage'));
const WithdrawalRequestsPage = React.lazy(() => import('../pages/WithdrawalRequestsPage'));
const UsdtSendRequestsPage = React.lazy(() => import('../pages/UsdtSendRequestsPage'));
const BroadcastAdminPage = React.lazy(() => import('../pages/BroadcastAdminPage'));
const Wallet = React.lazy(() => import('../pages/wallet/index'));
const Cryptocurrency = React.lazy(() => import('../pages/wallet/index'));
const KybRegistrationsPage = React.lazy(() => import('../pages/KybRegistrationsPage'));
const TossAccountApprovals = React.lazy(() => import('../pages/TossAccountApprovals'));
const PaymentContract = React.lazy(() => import('../pages/PaymentContract'));
const KycVerificationsPage = React.lazy(() => import('../pages/KycVerificationsPage'));
const SupportPage = React.lazy(() => import('../pages/SupportPage'));
const TossPayQrInstructions = React.lazy(() => import('../pages/help/TossPayQrInstructions'));

export const adminRoutes: RouteObject[] = [
  { path: '/dashboard', element: <ProtectedAdminRoute><LiveDashboard /></ProtectedAdminRoute> },
  { path: '/dashboard/classic', element: <ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute> },
  { path: '/wallet', element: <ProtectedAdminRoute permission="can_manage_wallet"><Wallet /></ProtectedAdminRoute> },
  { path: '/cryptocurrency', element: <ProtectedAdminRoute permission="can_manage_wallet"><Cryptocurrency cryptoOnly /></ProtectedAdminRoute> },
  { path: '/approvals', element: <RequireSuperAdmin><Approvals /></RequireSuperAdmin> },
  { path: '/bank-deposits', element: <RequireSuperAdmin systemWalletAdminOnly><BankDepositsPage /></RequireSuperAdmin> },
  { path: '/topup-requests', element: <RequireSuperAdmin permission="can_approve_topups" systemWalletAdminOnly><TopupRequestsPage /></RequireSuperAdmin> },
  { path: '/topups/:topupId', element: <RequireSuperAdmin permission="can_approve_topups" systemWalletAdminOnly><Navigate to="/topup-requests" replace /></RequireSuperAdmin> },
  { path: '/payment-approvals', element: <RequireSuperAdmin systemWalletAdminOnly><SuperAdminPaymentApproval /></RequireSuperAdmin> },
  { path: '/kyb-registrations', element: <RequireSuperAdmin><KybRegistrationsPage /></RequireSuperAdmin> },
  { path: '/toss-account-approvals', element: <ProtectedAdminRoute permission="can_manage_wallet"><TossAccountApprovals /></ProtectedAdminRoute> },
  { path: '/kyc-verifications', element: <RequireSuperAdmin><KycVerificationsPage /></RequireSuperAdmin> },
  { path: '/payments', element: <ProtectedAdminRoute permission="can_manage_payments"><PaymentsPage /></ProtectedAdminRoute> },
  { path: '/payments/:id', element: <ProtectedAdminRoute permission={['can_manage_payments', 'can_manage_wallet']}><PaymentDetails /></ProtectedAdminRoute> },
  { path: '/payments/:id/contract', element: <RequireSuperAdmin><PaymentContract /></RequireSuperAdmin> },
  { path: '/transactions', element: <ProtectedAdminRoute permission="can_manage_transactions"><LiveTransactions /></ProtectedAdminRoute> },
  { path: '/transactions/classic', element: <ProtectedAdminRoute permission="can_manage_transactions"><Transactions /></ProtectedAdminRoute> },
  { path: '/disbursements/:id', element: <ProtectedAdminRoute permission="can_manage_disbursements"><DisbursementDetails /></ProtectedAdminRoute> },
  { path: '/disbursements/batch/new', element: <ProtectedAdminRoute permission="can_manage_disbursements"><BatchDisbursement /></ProtectedAdminRoute> },
  { path: '/disbursements/single/new', element: <ProtectedAdminRoute permission="can_manage_disbursements"><SendSingleDisbursement /></ProtectedAdminRoute> },
  { path: '/disbursements', element: <ProtectedAdminRoute permission="can_manage_disbursements"><DisbursementsPage /></ProtectedAdminRoute> },
  { path: '/reports', element: <ProtectedAdminRoute permission="can_view_reports"><ReportsPage /></ProtectedAdminRoute> },
  { path: '/settings', element: <RequireAuth><Settings /></RequireAuth> },
  { path: '/support', element: <RequireAuth><SupportPage /></RequireAuth> },
  { path: '/settings/account-security', element: <RequireAuth><SettingsAccountSecure /></RequireAuth> },
  { path: '/settings/shop/preferences', element: <ProtectedAdminRoute><SettingsStoreProfile /></ProtectedAdminRoute> },
  { path: '/settings/shop/settlement', element: <ProtectedAdminRoute permission="can_manage_wallet"><SettingsBanking /></ProtectedAdminRoute> },
  { path: '/settings/shop/credentials', element: <ProtectedAdminRoute permission="can_manage_bot"><SettingsApiIntegration /></ProtectedAdminRoute> },
  { path: '/help/toss-pay-qr', element: <RequireAuth><TossPayQrInstructions /></RequireAuth> },
  { path: '/settings/user-management', element: <Navigate to="/admin-management" replace /> },
  { path: '/admin-management', element: <ProtectedAdminRoute permission="can_manage_team" allowPlatformSuperAdmin><AdminManagement /></ProtectedAdminRoute> },
  { path: '/roles', element: <RequireSuperAdmin><RolesPage /></RequireSuperAdmin> },
  { path: '/downline-management', element: <ProtectedAdminRoute permission="can_manage_team" allowVipGold><DownlineManagement /></ProtectedAdminRoute> },
  { path: '/withdrawals', element: <RequireWithdrawalsAccess><WithdrawalRequestsPage /></RequireWithdrawalsAccess> },
  { path: '/withdrawals/usdt-send-requests', element: <RequireSuperAdmin systemWalletAdminOnly><UsdtSendRequestsPage /></RequireSuperAdmin> },
  { path: '/broadcasts', element: <RequireSuperAdmin><BroadcastAdminPage /></RequireSuperAdmin> },
  { path: '/bot-intro', element: <ProtectedAdminRoute permission="can_manage_bot"><BotIntro /></ProtectedAdminRoute> },
  { path: '/bot-settings', element: <RequireDeveloperRole><BotSettings /></RequireDeveloperRole> },
  { path: '/bot-messages', element: <RequireSuperAdmin><BotMessagesPage /></RequireSuperAdmin> },
  { path: '/pay-by-link', element: <ProtectedAdminRoute permission="can_manage_payments"><PaymentLinksList /></ProtectedAdminRoute> },
  { path: '/pay-by-link/new', element: <ProtectedAdminRoute permission="can_manage_payments"><CreatePaymentLink /></ProtectedAdminRoute> },
  { path: '/pay-by-link/international/new', element: <ProtectedAdminRoute permission="can_manage_payments"><CreateInternationalLink /></ProtectedAdminRoute> },
  { path: '/pay-by-link/details/:code', element: <ProtectedAdminRoute permission="can_manage_payments"><PaymentLinkDetails /></ProtectedAdminRoute> },
];
