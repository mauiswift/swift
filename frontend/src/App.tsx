import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

import TopProgressBar from '@/components/TopProgressBar';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import RequireSuperAdmin from '@/components/RequireSuperAdmin';
import RequireDeveloperRole from '@/components/RequireDeveloperRole';

const HomePage = React.lazy(() => import('./pages/Index'));
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const DisbursementsPage = React.lazy(() => import('./pages/DisbursementsPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const Settings = React.lazy(() => import('./pages/Settings'));
const SettingsStoreProfile = React.lazy(() => import('./pages/settings/StoreProfile'));
const SettingsBanking = React.lazy(() => import('./pages/settings/Banking'));
const SettingsApiIntegration = React.lazy(() => import('./pages/settings/ApiIntegration'));
const SettingsTeam = React.lazy(() => import('./pages/settings/Team'));
const PaymentLinksList = React.lazy(() => import('./pages/paylink/PaymentLinksList'));
const CreatePaymentLink = React.lazy(() => import('./pages/paylink/CreatePaymentLink'));
const PaymentLinkDetails = React.lazy(() => import('./pages/paylink/PaymentLinkDetails'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const Register = React.lazy(() => import('./pages/Register'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const AuthError = React.lazy(() => import('./pages/AuthError'));
const LogoutCallbackPage = React.lazy(() => import('./pages/LogoutCallbackPage'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const MaintenancePage = React.lazy(() => import('./pages/MaintenancePage'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const Approvals = React.lazy(() => import('./pages/Approvals'));
const PaymentsPage = React.lazy(() => import('./pages/PaymentsPage'));
const PaymentDetails = React.lazy(() => import('./pages/PaymentDetails'));
const DisbursementDetails = React.lazy(() => import('./pages/DisbursementDetails'));
const BatchDisbursement = React.lazy(() => import('./pages/BatchDisbursement'));
const SendSingleDisbursement = React.lazy(() => import('./pages/SendSingleDisbursement'));
const PermanentPayPage = React.lazy(() => import('./pages/PermanentPayPage'));

function AuthAwareContent() {
  const { loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen />;
  }

  return (
    <Routes>
      {/* ─── Public Routes ─── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/sign-up-now" element={<Register />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/checkout/:identifier" element={<Checkout />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/error" element={<AuthError />} />
      <Route path="/logout-callback" element={<LogoutCallbackPage />} />
      <Route path="/pay/:slug" element={<PermanentPayPage />} />

      {/* ─── Dashboard Protected Routes ─── */}
      <Route path="/dashboard" element={<ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute>} />
      <Route path="/approvals" element={<ProtectedAdminRoute><Approvals /></ProtectedAdminRoute>} />
      <Route path="/payments" element={<ProtectedAdminRoute><PaymentsPage /></ProtectedAdminRoute>} />
      <Route path="/payments/:id" element={<ProtectedAdminRoute><PaymentDetails /></ProtectedAdminRoute>} />
      <Route path="/disbursements/:id" element={<ProtectedAdminRoute><DisbursementDetails /></ProtectedAdminRoute>} />
      <Route path="/disbursements/batch/new" element={<ProtectedAdminRoute><BatchDisbursement /></ProtectedAdminRoute>} />
      <Route path="/disbursements/single/new" element={<ProtectedAdminRoute><SendSingleDisbursement /></ProtectedAdminRoute>} />
      <Route path="/disbursements" element={<ProtectedAdminRoute><DisbursementsPage /></ProtectedAdminRoute>} />
      <Route path="/reports" element={<ProtectedAdminRoute><ReportsPage /></ProtectedAdminRoute>} />
      <Route path="/settings" element={<ProtectedAdminRoute><Settings /></ProtectedAdminRoute>} />
      <Route path="/settings/shop/preferences" element={<ProtectedAdminRoute><SettingsStoreProfile /></ProtectedAdminRoute>} />
      <Route path="/settings/shop/settlement" element={<ProtectedAdminRoute><SettingsBanking /></ProtectedAdminRoute>} />
      <Route path="/settings/shop/credentials" element={<ProtectedAdminRoute><SettingsApiIntegration /></ProtectedAdminRoute>} />
      <Route path="/settings/user-management" element={<ProtectedAdminRoute><SettingsTeam /></ProtectedAdminRoute>} />
      <Route path="/pay-by-link" element={<ProtectedAdminRoute><PaymentLinksList /></ProtectedAdminRoute>} />
      <Route path="/pay-by-link/new" element={<ProtectedAdminRoute><CreatePaymentLink /></ProtectedAdminRoute>} />
      <Route path="/pay-by-link/details/:code" element={<ProtectedAdminRoute><PaymentLinkDetails /></ProtectedAdminRoute>} />

      {/* ─── Fallbacks ─── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <TopProgressBar />
                <Suspense fallback={<AppLoadingScreen />}>
                  <AuthAwareContent />
                </Suspense>
              </TooltipProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
