import React from 'react';
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

  return <>{children}</>;
}
