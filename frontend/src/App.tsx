import React, { Suspense } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
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
import DashboardWrapper from '@/components/DashboardWrapper';
import LiveChatWidget from '@/components/LiveChatWidget';
import FirstLoginGuide from '@/components/FirstLoginGuide';
import AppRoutes from '@/routes/AppRoutes';
import { MaintenancePage } from '@/routes/publicRoutes';

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
  const { loading, platformBranding, isSuperAdmin, user } = useAuth();
  const location = useLocation();
  const isPublicHome = location.pathname === '/';
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

  if (loading && !isPublicHome) {
    return <AppLoadingScreen logoUrl={platformBranding?.logoUrl} storeName={platformBranding?.name} />;
  }

  const maintenanceBypassPaths = [
    '/login',
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
          <AppRoutes />
        </DashboardWrapper>
      </div>
      <LiveChatWidget />
      {user && <FirstLoginGuide />}
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
