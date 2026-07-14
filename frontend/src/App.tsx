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
const Wallet = React.lazy(() => import('./pages/Wallet'));
const Transactions = React.lazy(() => import('./pages/Transactions'));
const CreatePayment = React.lazy(() => import('./pages/CreatePayment'));
const QRCodesPage = React.lazy(() => import('./pages/QRCodesPage'));
const ScanQRPH = React.lazy(() => import('./pages/ScanQRPH'));
const DisbursementsPage = React.lazy(() => import('./pages/DisbursementsPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const BotSettings = React.lazy(() => import('./pages/BotSettings'));
const Settings = React.lazy(() => import('./pages/Settings'));
const MessengerPage = React.lazy(() => import('./pages/MessengerPage'));
const DeveloperExperience = React.lazy(() => import('./pages/DeveloperExperience'));
const ApiDocsPage = React.lazy(() => import('./pages/ApiDocsPage'));
const AdminManagement = React.lazy(() => import('./pages/AdminManagement'));
const BotMessagesPage = React.lazy(() => import('./pages/BotMessagesPage'));
const TopupRequestsPage = React.lazy(() => import('./pages/TopupRequestsPage'));
const UsdtSendRequestsPage = React.lazy(() => import('./pages/UsdtSendRequestsPage'));
const BankDepositsPage = React.lazy(() => import('./pages/BankDepositsPage'));
const KybRegistrationsPage = React.lazy(() => import('./pages/KybRegistrationsPage'));
const KycVerificationsPage = React.lazy(() => import('./pages/KycVerificationsPage'));
const RolesPage = React.lazy(() => import('./pages/RolesPage'));
const Policies = React.lazy(() => import('./pages/Policies'));
const Compliance = React.lazy(() => import('./pages/Compliance'));
const Features = React.lazy(() => import('./pages/Features'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const Register = React.lazy(() => import('./pages/Register'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const AuthError = React.lazy(() => import('./pages/AuthError'));
const LogoutCallbackPage = React.lazy(() => import('./pages/LogoutCallbackPage'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const MaintenancePage = React.lazy(() => import('./pages/MaintenancePage'));
const BotIntro = React.lazy(() => import('./pages/BotIntro'));
const MagpieSuccess = React.lazy(() => import('./pages/MagpieSuccess'));
const Checkout = React.lazy(() => import('./pages/Checkout'));

function AuthAwareContent() {
  const { loading } = useAuth();

  if (loading) {
    return <AppLoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/home" element={<HomePage />} />
      <Route path="/intro" element={<BotIntro />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth/error" element={<AuthError />} />
      <Route path="/logout-callback" element={<LogoutCallbackPage />} />
      <Route path="/maintenance" element={<MaintenancePage />} />
      <Route path="/magpie-success" element={<MagpieSuccess />} />
      <Route path="/checkout/:identifier" element={<Checkout />} />

      <Route path="/" element={<ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute>} />
      <Route path="/wallet" element={<ProtectedAdminRoute><Wallet /></ProtectedAdminRoute>} />
      <Route path="/transactions" element={<ProtectedAdminRoute><Transactions /></ProtectedAdminRoute>} />
      <Route path="/payments" element={<ProtectedAdminRoute><CreatePayment /></ProtectedAdminRoute>} />
      <Route path="/create-payment" element={<Navigate to="/payments" replace />} />
      <Route path="/qr-codes" element={<ProtectedAdminRoute><QRCodesPage /></ProtectedAdminRoute>} />
      <Route path="/scan-qrph" element={<ProtectedAdminRoute><ScanQRPH /></ProtectedAdminRoute>} />
      <Route path="/disbursements" element={<ProtectedAdminRoute><DisbursementsPage /></ProtectedAdminRoute>} />
      <Route path="/reports" element={<ProtectedAdminRoute><ReportsPage /></ProtectedAdminRoute>} />
      <Route path="/bot-settings" element={<ProtectedAdminRoute><BotSettings /></ProtectedAdminRoute>} />
      <Route path="/settings" element={<ProtectedAdminRoute><Settings /></ProtectedAdminRoute>} />
      <Route path="/messenger" element={<ProtectedAdminRoute><MessengerPage /></ProtectedAdminRoute>} />
      <Route path="/policies" element={<ProtectedAdminRoute><Policies /></ProtectedAdminRoute>} />
      <Route path="/compliance" element={<ProtectedAdminRoute><Compliance /></ProtectedAdminRoute>} />

      <Route path="/developer-experience" element={<RequireDeveloperRole><DeveloperExperience /></RequireDeveloperRole>} />
      <Route path="/api-docs" element={<RequireDeveloperRole><ApiDocsPage /></RequireDeveloperRole>} />

      <Route path="/admin-management" element={<RequireSuperAdmin><AdminManagement /></RequireSuperAdmin>} />
      <Route path="/bot-messages" element={<RequireSuperAdmin><BotMessagesPage /></RequireSuperAdmin>} />
      <Route path="/topup-requests" element={<RequireSuperAdmin><TopupRequestsPage /></RequireSuperAdmin>} />
      <Route path="/usdt-send-requests" element={<RequireSuperAdmin><UsdtSendRequestsPage /></RequireSuperAdmin>} />
      <Route path="/bank-deposits" element={<RequireSuperAdmin><BankDepositsPage /></RequireSuperAdmin>} />
      <Route path="/kyb-registrations" element={<RequireSuperAdmin><KybRegistrationsPage /></RequireSuperAdmin>} />
      <Route path="/kyc-verifications" element={<RequireSuperAdmin><KycVerificationsPage /></RequireSuperAdmin>} />
      <Route path="/roles" element={<RequireSuperAdmin><RolesPage /></RequireSuperAdmin>} />

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
