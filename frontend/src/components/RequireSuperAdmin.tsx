import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ShieldOff } from 'lucide-react';
import { canAccessSuperAdminControls } from '@/lib/adminNavigation';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Props {
  children: React.ReactNode;
}

/**
 * Route guard: only super admins may pass.
 * Regular admins see a 403 page; unauthenticated users are sent to /login.
 */
export default function RequireSuperAdmin({ children }: Props) {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying permissions..." />;
  }

  if (!user) return <Navigate to="/login" replace />;

  if (!canAccessSuperAdminControls({ isSuperAdmin, permissions: user.permissions })) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="h-16 w-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mb-5">
            <ShieldOff className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Access Restricted</h1>
          <p className="mb-1 max-w-sm text-sm text-slate-600">
            This page is only accessible to <span className="font-semibold text-amber-600">Super Admins</span>.
          </p>
          <p className="max-w-sm text-xs text-slate-500">
            Your account has <span className="font-medium text-slate-700">Admin</span> access.
            Contact your Relationship Manager to request elevated permissions.
          </p>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
}
