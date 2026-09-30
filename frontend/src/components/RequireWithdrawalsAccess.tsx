import { Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission, isSystemWalletAdmin } from '@/lib/permissions';
import { ShieldOff } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

export default function RequireWithdrawalsAccess({ children }: Props) {
  const { user, loading, isSuperAdmin } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying permissions..." />;
  }

  if (!user) return <Navigate to="/login" replace />;

  const canViewWithdrawals =
    hasPermission(user.permissions, 'can_manage_disbursements')
    || (Boolean(isSuperAdmin) && isSystemWalletAdmin(user.id));

  if (!canViewWithdrawals) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
          <div className="h-16 w-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mb-5">
            <ShieldOff className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-slate-900">Access Restricted</h1>
          <p className="mb-1 max-w-sm text-sm text-slate-600">
            This page is only accessible to withdrawal managers.
          </p>
          <p className="max-w-sm text-xs text-slate-500">
            Ask your organization owner to enable <span className="font-medium text-slate-700">Disbursements</span> access,
            or use the designated system super admin account for approvals.
          </p>
        </div>
      </Layout>
    );
  }

  return <>{children}</>;
}

