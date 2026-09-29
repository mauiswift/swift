import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { ShieldOff } from 'lucide-react';
import { canAccessSuperAdminControls } from '@/lib/adminNavigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { hasPermission, isSystemWalletAdmin, type PermissionKey } from '@/lib/permissions';

interface Props {
  children: React.ReactNode;
  permission?: PermissionKey;
  systemWalletAdminOnly?: boolean;
}

/**
 * Route guard: only super admins may pass.
 * Regular admins see a 403 page; unauthenticated users are sent to /login.
 */
export default function RequireSuperAdmin({ children, permission, systemWalletAdminOnly = false }: Props) {
  const { user, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying permissions..." />;
  }

  if (!user) return <Navigate to="/login" replace />;

  const accessDenied = !canAccessSuperAdminControls({ isSuperAdmin })
    || Boolean(permission && !hasPermission(user.permissions, permission))
    || (systemWalletAdminOnly && !isSystemWalletAdmin(user.id));
  if (accessDenied) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="h-16 w-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mb-5">
            <ShieldOff className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Access Restricted</h1>
          <p className="mb-1 max-w-sm text-sm text-slate-600">
            {isSuperAdmin && permission
              ? 'Your administrator account does not have permission for this review queue.'
              : <>This page is only accessible to <span className="font-semibold text-amber-600">Super Admins</span>.</>}
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
