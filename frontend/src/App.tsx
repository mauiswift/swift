import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CollectionCurrencyProvider } from '@/contexts/CollectionCurrencyContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { client } from '@/lib/api';

import TopProgressBar from '@/components/TopProgressBar';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import RequireAuth from '@/components/RequireAuth';
import RequireSuperAdmin from '@/components/RequireSuperAdmin';
import RequireDeveloperRole from '@/components/RequireDeveloperRole';
import DashboardWrapper from '@/components/DashboardWrapper';
import LiveChatWidget from '@/components/LiveChatWidget';

const HomePage = React.lazy(() => import('./pages/Index'));
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const ChangePasswordPage = React.lazy(() => import('./pages/ChangePasswordPage'));
const DisbursementsPage = React.lazy(() => import('./pages/DisbursementsPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const Settings = React.lazy(() => import('./pages/Settings'));
const SettingsStoreProfile = React.lazy(() => import('./pages/settings/StoreProfile'));
const SettingsBanking = React.lazy(() => import('./pages/settings/Banking'));
const SettingsApiIntegration = React.lazy(() => import('./pages/settings/ApiIntegration'));
const SettingsAccountSecure = React.lazy(() => import('./pages/settings/AccountSecure'));
// Team route removed - redirected to admin-management
const PaymentLinksList = React.lazy(() => import('./pages/paylink/PaymentLinksList'));
const CreatePaymentLink = React.lazy(() => import('./pages/paylink/CreatePaymentLink'));
const CreateInvoice = React.lazy(() => import('./pages/paylink/CreateInvoice'));
const PaymentLinkDetails = React.lazy(() => import('./pages/paylink/PaymentLinkDetails'));
const CreateInternationalLink = React.lazy(() => import('./pages/paylink/CreateInternationalLink'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const CollectionRates = React.lazy(() => import('./pages/CollectionRates'));
const Register = React.lazy(() => import('./pages/Register'));
const AcceptInvitation = React.lazy(() => import('./pages/AcceptInvitation'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const AuthError = React.lazy(() => import('./pages/AuthError'));
const LogoutCallbackPage = React.lazy(() => import('./pages/LogoutCallbackPage'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const MaintenancePage = React.lazy(() => import('./pages/MaintenancePage'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const DownlineManagement = React.lazy(() => import('./pages/DownlineManagement'));
const Approvals = React.lazy(() => import('./pages/Approvals'));
const BankDepositsPage = React.lazy(() => import('./pages/BankDepositsPage'));
const TopupRequestsPage = React.lazy(() => import('./pages/TopupRequestsPage'));
const SuperAdminPaymentApproval = React.lazy(() => import('./pages/SuperAdminPaymentApproval'));
const PaymentsPage = React.lazy(() => import('./pages/PaymentsPage'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const PaymentDetails = React.lazy(() => import('./pages/PaymentDetails'));
const DisbursementDetails = React.lazy(() => import('./pages/DisbursementDetails'));
const BatchDisbursement = React.lazy(() => import('./pages/BatchDisbursement'));
const SendSingleDisbursement = React.lazy(() => import('./pages/SendSingleDisbursement'));
const PermanentPayPage = React.lazy(() => import('./pages/PermanentPayPage'));
const ContactPage = React.lazy(() => import('./pages/LegalPages').then((m) => ({ default: m.ContactPage })));
const PrivacyPolicyPage = React.lazy(() => import('./pages/LegalPages').then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = React.lazy(() => import('./pages/LegalPages').then((m) => ({ default: m.TermsOfServicePage })));
const NDAAgreementPage = React.lazy(() => import('./pages/LegalPages').then((m) => ({ default: m.NdaPage })));
const BotIntro = React.lazy(() => import('./pages/BotIntro'));
const BotSettings = React.lazy(() => import('./pages/BotSettings'));
const BotMessagesPage = React.lazy(() => import('./pages/BotMessagesPage'));
const ApiDocsPage = React.lazy(() => import('./pages/ApiDocsPage'));
const AdminManagement = React.lazy(() => import('./pages/AdminManagement'));
const WithdrawalRequestsPage = React.lazy(() => import('./pages/WithdrawalRequestsPage'));
const UsdtSendRequestsPage = React.lazy(() => import('./pages/UsdtSendRequestsPage'));
const BroadcastAdminPage = React.lazy(() => import('./pages/BroadcastAdminPage'));
const Wallet = React.lazy(() => import('./pages/Wallet'));
const Cryptocurrency = React.lazy(() => import('./pages/Wallet'));
const KybRegistrationsPage = React.lazy(() => import('./pages/KybRegistrationsPage'));
const KycVerificationsPage = React.lazy(() => import('./pages/KycVerificationsPage'));
const SupportPage = React.lazy(() => import('./pages/SupportPage'));

class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Route render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-6 text-center text-slate-900">
        <div className="max-w-md">
          <h1 className="text-xl font-semibold">This page could not be loaded</h1>
          <p className="mt-2 text-sm text-slate-500">
            Please reload the page and try again.
          </p>
          <p className="mt-3 break-words text-xs text-slate-400">
            {this.state.error.message || 'Unexpected application error'}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

function AuthAwareContent() {
  const { loading, platformBranding, isSuperAdmin } = useAuth();
  const location = useLocation();
  const { data: maintenanceEnabled } = useQuery({
    queryKey: ['maintenance-gate-status'],
    queryFn: async () => {
      const response = await client.apiCall.invoke({
        url: '/api/v1/app-settings/maintenance',
        method: 'GET',
        data: {},
      });
      if (!response.ok) {
        throw new Error('Unable to read maintenance status');
      }
      return Boolean((response.data as { maintenance_mode?: boolean }).maintenance_mode);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 2,
  });

  if (loading) {
    return <AppLoadingScreen logoUrl={platformBranding?.logoUrl} storeName={platformBranding?.name} />;
  }

  const maintenanceBypassPaths = [
    '/login',
    '/register',
    '/sign-up-now',
    '/accept-invitation',
    '/auth/callback',
    '/auth/error',
    '/logout-callback',
    '/change-password',
  ];
  const canAccessDuringMaintenance = maintenanceBypassPaths.some(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
  );

  if (maintenanceEnabled && !isSuperAdmin && !canAccessDuringMaintenance) {
    return <MaintenancePage />;
  }

  return (
    <>
      <div className="route-stage">
        <DashboardWrapper>
        <Routes>
      {/* ─── Public Routes ─── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/change-password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />
      <Route path="/register" element={<Register />} />
      <Route path="/sign-up-now" element={<Register />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/collection-rates" element={<CollectionRates />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />
      <Route path="/nda" element={<NDAAgreementPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/checkout/:identifier" element={<Checkout />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/error" element={<AuthError />} />
      <Route path="/logout-callback" element={<LogoutCallbackPage />} />
      <Route path="/pay/:slug" element={<PermanentPayPage />} />
      <Route path="/api-docs" element={<ApiDocsPage />} />

      {/* ─── Dashboard Protected Routes ─── */}
      <Route path="/dashboard" element={<ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute>} />
      <Route path="/wallet" element={<ProtectedAdminRoute permission="can_manage_wallet"><Wallet /></ProtectedAdminRoute>} />
      <Route path="/cryptocurrency" element={<ProtectedAdminRoute permission="can_manage_wallet"><Cryptocurrency cryptoOnly /></ProtectedAdminRoute>} />
      <Route path="/approvals" element={<RequireSuperAdmin><Approvals /></RequireSuperAdmin>} />
      <Route path="/bank-deposits" element={<RequireSuperAdmin><BankDepositsPage /></RequireSuperAdmin>} />
      <Route path="/topup-requests" element={<RequireSuperAdmin><TopupRequestsPage /></RequireSuperAdmin>} />
      <Route path="/payment-approvals" element={<RequireSuperAdmin><SuperAdminPaymentApproval /></RequireSuperAdmin>} />
      <Route path="/kyb-registrations" element={<RequireSuperAdmin><KybRegistrationsPage /></RequireSuperAdmin>} />
      <Route path="/kyc-verifications" element={<RequireSuperAdmin><KycVerificationsPage /></RequireSuperAdmin>} />
      <Route path="/payments" element={<ProtectedAdminRoute permission="can_manage_payments"><PaymentsPage /></ProtectedAdminRoute>} />
      <Route path="/payments/:id" element={<ProtectedAdminRoute permission="can_manage_payments"><PaymentDetails /></ProtectedAdminRoute>} />
      <Route path="/transactions" element={<ProtectedAdminRoute permission="can_manage_transactions"><Transactions /></ProtectedAdminRoute>} />
      <Route path="/disbursements/:id" element={<ProtectedAdminRoute permission="can_manage_disbursements"><DisbursementDetails /></ProtectedAdminRoute>} />
      <Route path="/disbursements/batch/new" element={<ProtectedAdminRoute permission="can_manage_disbursements"><BatchDisbursement /></ProtectedAdminRoute>} />
      <Route path="/disbursements/single/new" element={<ProtectedAdminRoute permission="can_manage_disbursements"><SendSingleDisbursement /></ProtectedAdminRoute>} />
      <Route path="/disbursements" element={<ProtectedAdminRoute permission="can_manage_disbursements"><DisbursementsPage /></ProtectedAdminRoute>} />
      <Route path="/reports" element={<ProtectedAdminRoute permission="can_view_reports"><ReportsPage /></ProtectedAdminRoute>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/support" element={<RequireAuth><SupportPage /></RequireAuth>} />
      <Route path="/settings/account-security" element={<RequireAuth><SettingsAccountSecure /></RequireAuth>} />
      <Route path="/settings/shop/preferences" element={<ProtectedAdminRoute><SettingsStoreProfile /></ProtectedAdminRoute>} />
      <Route path="/settings/shop/settlement" element={<RequireAuth><SettingsBanking /></RequireAuth>} />
      <Route path="/settings/shop/credentials" element={<ProtectedAdminRoute permission="can_manage_bot"><SettingsApiIntegration /></ProtectedAdminRoute>} />
      <Route path="/settings/user-management" element={<Navigate to="/admin-management" replace />} />
      <Route path="/admin-management" element={<RequireSuperAdmin><AdminManagement /></RequireSuperAdmin>} />
      <Route path="/downline-management" element={<ProtectedAdminRoute permission="can_manage_team"><DownlineManagement /></ProtectedAdminRoute>} />
      <Route path="/withdrawals" element={<RequireSuperAdmin><WithdrawalRequestsPage /></RequireSuperAdmin>} />
      <Route path="/withdrawals/usdt-send-requests" element={<RequireSuperAdmin><UsdtSendRequestsPage /></RequireSuperAdmin>} />
      <Route path="/broadcasts" element={<RequireSuperAdmin><BroadcastAdminPage /></RequireSuperAdmin>} />
      <Route path="/bot-intro" element={<ProtectedAdminRoute permission="can_manage_bot"><BotIntro /></ProtectedAdminRoute>} />
      <Route path="/bot-settings" element={<RequireDeveloperRole><BotSettings /></RequireDeveloperRole>} />
      <Route path="/bot-messages" element={<RequireSuperAdmin><BotMessagesPage /></RequireSuperAdmin>} />
      <Route path="/pay-by-link" element={<ProtectedAdminRoute permission="can_manage_payments"><PaymentLinksList /></ProtectedAdminRoute>} />
      <Route path="/pay-by-link/new" element={<ProtectedAdminRoute permission="can_manage_payments"><CreatePaymentLink /></ProtectedAdminRoute>} />
      <Route path="/pay-by-link/invoice" element={<ProtectedAdminRoute permission="can_manage_payments"><CreateInvoice /></ProtectedAdminRoute>} />
      <Route path="/pay-by-link/international/new" element={<ProtectedAdminRoute permission="can_manage_payments"><CreateInternationalLink /></ProtectedAdminRoute>} />
      <Route path="/pay-by-link/details/:code" element={<ProtectedAdminRoute permission="can_manage_payments"><PaymentLinkDetails /></ProtectedAdminRoute>} />

      {/* ─── Fallbacks ─── */}
      <Route path="*" element={<NotFound />} />
        </Routes>
        </DashboardWrapper>
      </div>
      <LiveChatWidget />
    </>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 10_000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <CollectionCurrencyProvider>
                  <TooltipProvider>
                    <Toaster />
                    <TopProgressBar />
                    <Suspense fallback={<AppLoadingScreen />}>
                      <AuthAwareContent />
                    </Suspense>
                  </TooltipProvider>
                </CollectionCurrencyProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}
