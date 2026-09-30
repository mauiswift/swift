import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ShieldOff } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Props {
  children: React.ReactNode;
}

/**
 * Route guard: users with developer-level bot permissions may pass.
 * Super admins are always allowed.
 */
export default function RequireDeveloperRole({ children }: Props) {
  const { user, loading, isSuperAdmin, permissions } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying permissions..." />;
  }

  if (!user) return <Navigate to="/login" replace />;

  const canAccess = Boolean(isSuperAdmin || permissions?.can_manage_bot);
  if (!canAccess) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="h-16 w-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mb-5">
            <ShieldOff className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Access Restricted</h1>
          <p className="mb-1 max-w-sm text-sm text-slate-600">
            This page is only accessible to <span className="font-semibold text-amber-600">Developer or Super Admin</span> roles.
          </p>
          <p className="max-w-sm text-xs text-slate-500">
            Request <span className="font-medium">API/Webhook management</span> permission from your organization owner.
          </p>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
}
