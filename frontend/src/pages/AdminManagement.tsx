import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { isSystemWalletAdmin } from '@/lib/permissions';
import { AdminSidebar } from '@/components/admin/AdminManagementNavigation';
import { MerchantManagement } from '@/components/admin/MerchantManagement';
import { BankingDashboard } from '@/components/admin/BankingDashboard';
import { TransactionsTab } from '@/components/admin/TransactionsTab';
import { SettlementsTab } from '@/components/admin/SettlementsTab';
import { WalletControlTab } from '@/components/admin/WalletControlTab';
import { CryptoApprovalsTab } from '@/components/admin/CryptoApprovalsTab';
import { PaymentChannelsTab } from '@/components/admin/PaymentChannelsTab';
import { WalletSettingsTab } from '@/components/admin/WalletSettingsTab';
import { UsersTab } from '@/components/admin/UsersTab';
import { PlatformSettingsTab } from '@/components/admin/PlatformSettingsTab';
import { OperationsTab } from '@/components/admin/OperationsTab';
import { AuditLogsTab } from '@/components/admin/AuditLogsTab';
import { TeamInvitationsTab, TeamMembersTab } from '@/components/TeamManagement';
import TestDataCleanupTab from '@/components/admin/TestDataCleanupTab';
import { buildAdminTabs, type AdminTab } from '@/components/admin/adminManagementTabs';
import { TossAccountApprovalsPanel } from '@/pages/TossAccountApprovals';

type TabId = AdminTab;

const adminTabContent: Record<AdminTab, ReactNode> = {
  dashboard: <BankingDashboard />,
  merchants: <MerchantManagement />,
  transactions: <TransactionsTab />,
  settlements: <SettlementsTab />,
  'wallet-control': <WalletControlTab />,
  'crypto-approvals': <CryptoApprovalsTab />,
  'payment-channels': <PaymentChannelsTab />,
  'wallet-settings': <WalletSettingsTab />,
  users: <UsersTab />,
  'team-invitations': <TeamInvitationsTab />,
  'team-members': <TeamMembersTab />,
  'audit-logs': <AuditLogsTab />,
  'platform-settings': <PlatformSettingsTab />,
  operations: <OperationsTab />,
  'toss-account-approvals': <TossAccountApprovalsPanel />,
  'test-data-cleanup': <TestDataCleanupTab />,
};

export default function AdminManagement() {
  const { user, isSuperAdmin: isPlatformSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as AdminTab | null;

  const [selectedTab, setSelectedTab] = useState<TabId>('dashboard');

  // Permissions
  const canManageTeam = Boolean(user?.permissions?.can_manage_team);
  const canAccessAdminManagement = isPlatformSuperAdmin || canManageTeam;
  const canManagePayments = Boolean(user?.permissions?.can_manage_payments);
  const canManageWallet = Boolean(user?.permissions?.can_manage_wallet);
  const canManageDisbursements = Boolean(user?.permissions?.can_manage_disbursements);
  const canApproveTopups = Boolean(user?.permissions?.can_approve_topups);
  const canViewReports = Boolean(user?.permissions?.can_view_reports);
  const canManageBot = Boolean(user?.permissions?.can_manage_bot);

  // Tab access control - Banking System
  const canAccessDashboard = isPlatformSuperAdmin;
  const canAccessMerchants = isPlatformSuperAdmin && canManageTeam;
  const canAccessTransactions = isPlatformSuperAdmin && (canManagePayments || canViewReports);
  const canAccessSettlements = isPlatformSuperAdmin && canManageDisbursements;
  const canAccessWalletControl = isSystemWalletAdmin(user?.id) && isPlatformSuperAdmin && canManageWallet;
  const canAccessCryptoApprovals = isSystemWalletAdmin(user?.id) && isPlatformSuperAdmin && canApproveTopups;
  const canAccessPaymentChannels = isPlatformSuperAdmin && (canManagePayments || canManageDisbursements);
  const canAccessWalletSettings = isPlatformSuperAdmin && canManageWallet;
  const canAccessUserManagement = isPlatformSuperAdmin;
  const canAccessOperations = isPlatformSuperAdmin && (canManagePayments || canManageDisbursements || canApproveTopups || canViewReports || canManageBot);
  const canAccessPlatformSettings = isPlatformSuperAdmin && (canManagePayments || canManageWallet);
  const canAccessGovernance = isPlatformSuperAdmin;
  const canAccessTossAccountApprovals = isPlatformSuperAdmin && canManageWallet;

  // Build tabs
  const tabs = useMemo(() => buildAdminTabs({
    canAccessDashboard,
    canAccessMerchants,
    canAccessTransactions,
    canAccessSettlements,
    canAccessWalletControl,
    canAccessCryptoApprovals,
    canAccessPaymentChannels,
    canAccessWalletSettings,
    canAccessUserManagement,
    canAccessPlatformSettings,
    canAccessOperations,
    canAccessTossAccountApprovals,
    canManageTeam,
    canAccessGovernance,
    isSuperAdmin: isPlatformSuperAdmin,
  }, 0), [
    canAccessDashboard,
    canAccessMerchants,
    canAccessTransactions,
    canAccessSettlements,
    canAccessWalletControl,
    canAccessCryptoApprovals,
    canAccessPaymentChannels,
    canAccessWalletSettings,
    canAccessUserManagement,
    canAccessPlatformSettings,
    canAccessOperations,
    canAccessTossAccountApprovals,
    canManageTeam,
    canAccessGovernance,
    isPlatformSuperAdmin,
  ]);

  // Set initial tab from URL or default
  useEffect(() => {
    if (requestedTab && tabs.some(tab => tab.id === requestedTab)) {
      setSelectedTab(requestedTab);
    } else if (tabs.length > 0) {
      setSelectedTab(tabs[0].id);
    }
  }, [requestedTab, tabs]);

  // Redirect if the user should not access admin management at all.
  useEffect(() => {
    if (!canAccessAdminManagement) {
      navigate('/dashboard', { replace: true });
    }
  }, [canAccessAdminManagement, navigate]);

  if (!canAccessAdminManagement) {
    return null;
  }

  const selectedTabMeta = tabs.find(tab => tab.id === selectedTab);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Navigation Sidebar */}
        <AdminSidebar
          tabs={tabs}
          active={selectedTab}
          onChange={setSelectedTab}
        />

        {/* Main Content */}
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {selectedTabMeta && (
            <div className="mb-8">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold uppercase tracking-wider text-slate-500">{selectedTabMeta.group}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-semibold text-slate-900">{selectedTabMeta.label}</span>
                </div>
              </div>
            </div>
          )}

          {selectedTabMeta && adminTabContent[selectedTab]}
        </div>
      </div>
    </Layout>
  );
}
