import React from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

import RequireAuth from '@/components/RequireAuth';
import HomePage from '../pages/Index';

const KoreaPublicPage = React.lazy(() => import('../pages/KoreaPublicPage'));
const Login = React.lazy(() => import('../pages/Login'));
const ForgotPassword = React.lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('../pages/ResetPassword'));
const ChangePasswordPage = React.lazy(() => import('../pages/ChangePasswordPage'));
const Pricing = React.lazy(() => import('../pages/Pricing'));
const Features = React.lazy(() => import('../pages/Features'));
const CollectionRates = React.lazy(() => import('../pages/CollectionRates'));
const Register = React.lazy(() => import('../pages/Register'));
const OnboardingWizard = React.lazy(() => import('../pages/OnboardingWizard'));
const AcceptInvitation = React.lazy(() => import('../pages/AcceptInvitation'));
const AuthCallback = React.lazy(() => import('../pages/AuthCallback'));
const AuthError = React.lazy(() => import('../pages/AuthError'));
const LogoutCallbackPage = React.lazy(() => import('../pages/LogoutCallbackPage'));
export const MaintenancePage = React.lazy(() => import('../pages/Maintenance'));
const Checkout = React.lazy(() => import('../pages/Checkout'));
const MagpieSuccess = React.lazy(() => import('../pages/MagpieSuccess'));
const GcashPaymentPage = React.lazy(() => import('../pages/GcashPaymentPage'));
const PermanentPayPage = React.lazy(() => import('../pages/PermanentPayPage'));
const ApiDocsPage = React.lazy(() => import('../pages/ApiDocsPage'));
const ContactPage = React.lazy(() => import('../pages/LegalPages').then(module => ({ default: module.ContactPage })));
const PrivacyPolicyPage = React.lazy(() => import('../pages/LegalPages').then(module => ({ default: module.PrivacyPolicyPage })));
const TermsOfServicePage = React.lazy(() => import('../pages/LegalPages').then(module => ({ default: module.TermsOfServicePage })));
const NDAAgreementPage = React.lazy(() => import('../pages/LegalPages').then(module => ({ default: module.NdaPage })));
const MiniApp = React.lazy(() => import('../pages/MiniApp'));

export const publicRoutes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/kr', element: <KoreaPublicPage /> },
  { path: '/korea', element: <KoreaPublicPage /> },
  { path: '/ko', element: <Navigate to="/kr" replace /> },
  { path: '/south-korea', element: <Navigate to="/kr" replace /> },
  { path: '/home', element: <Navigate to="/" replace /> },
  { path: '/features', element: <Features /> },
  { path: '/contact-us', element: <Navigate to="/contact" replace /> },
  { path: '/contact-us/', element: <Navigate to="/contact" replace /> },
  { path: '/help', element: <Navigate to="/contact" replace /> },
  { path: '/policies', element: <Navigate to="/privacy-policy" replace /> },
  { path: '/terms', element: <Navigate to="/terms-of-service" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/change-password', element: <RequireAuth><ChangePasswordPage /></RequireAuth> },
  { path: '/register', element: <Register /> },
  { path: '/onboarding', element: <OnboardingWizard /> },
  { path: '/sign-up-now', element: <Register /> },
  { path: '/accept-invitation', element: <AcceptInvitation /> },
  { path: '/pricing', element: <Pricing /> },
  { path: '/collection-rates', element: <CollectionRates /> },
  { path: '/contact', element: <ContactPage /> },
  { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
  { path: '/terms-of-service', element: <TermsOfServicePage /> },
  { path: '/nda', element: <NDAAgreementPage /> },
  { path: '/maintenance', element: <MaintenancePage /> },
  { path: '/checkout/:identifier', element: <Checkout /> },
  { path: '/magpie-success', element: <MagpieSuccess /> },
  { path: '/checkout/:identifier/gcash', element: <GcashPaymentPage /> },
  { path: '/checkout/:identifier/alipay', element: <GcashPaymentPage /> },
  { path: '/auth/callback', element: <AuthCallback /> },
  { path: '/auth/error', element: <AuthError /> },
  { path: '/logout-callback', element: <LogoutCallbackPage /> },
  { path: '/pay/:slug', element: <PermanentPayPage /> },
  { path: '/api-docs', element: <ApiDocsPage /> },
  { path: '/mini-app', element: <MiniApp /> },
];
