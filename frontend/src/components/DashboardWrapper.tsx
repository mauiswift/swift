import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoLogout } from '@/hooks/useAutoLogout';

interface DashboardWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that enables automatic logout on inactivity.
 * This should wrap protected dashboard routes to monitor user activity
 * and automatically log out users after prolonged inactivity.
 * 
 * Usage in App.tsx:
 * ```tsx
 * <Route path="/dashboard" element={<ProtectedAdminRoute><DashboardWrapper><Dashboard /></DashboardWrapper></ProtectedAdminRoute>} />
 * ```
 */
export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  // Enable automatic logout on inactivity
  useAutoLogout();
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    const publicPrefixes = [
      '/admin-demo',
      '/accept-invitation',
      '/api-docs',
      '/auth',
      '/checkout',
      '/collection-rates',
      '/contact',
      '/features',
      '/forgot-password',
      '/home',
      '/korea',
      '/kr',
      '/login',
      '/logout-callback',
      '/magpie-success',
      '/maintenance',
      '/mini-app',
      '/nda',
      '/onboarding',
      '/pay',
      '/pricing',
      '/privacy-policy',
      '/register',
      '/reset-password',
      '/sign-up-now',
      '/terms-of-service',
    ];
    const isPublicRoute = pathname === '/'
      || publicPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    const root = document.documentElement;
    root.classList.toggle('backoffice-theme', Boolean(user) && !isPublicRoute);
    return () => root.classList.remove('backoffice-theme');
  }, [pathname, user]);

  return <>{children}</>;
}
