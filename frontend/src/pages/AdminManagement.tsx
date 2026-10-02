import { useEffect, useMemo, useState } from 'react';
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

export default function AdminManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as AdminTab | null;

  const [selectedTab, setSelectedTab] = useState<TabId>('dashboard');

  // Permissions
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'Owner';
  const canManageTeam = Boolean(user?.permissions?.can_manage_team);
  const canManagePayments = Boolean(user?.permissions?.can_manage_payments);
  const canManageWallet = Boolean(user?.permissions?.can_manage_wallet);
  const canManageDisbursements = Boolean(user?.permissions?.can_manage_disbursements);
  const canApproveTopups = Boolean(user?.permissions?.can_approve_topups);
  const canViewReports = Boolean(user?.permissions?.can_view_reports);
  const canManageBot = Boolean(user?.permissions?.can_manage_bot);
  const canManageTossAccounts = Boolean(user?.permissions?.can_manage_toss_accounts);

  // Tab access control - Banking System
  const canAccessDashboard = isSuperAdmin;
  const canAccessMerchants = isSuperAdmin && canManageTeam;
  const canAccessTransactions = isSuperAdmin && (canManagePayments || canViewReports);
  const canAccessSettlements = isSuperAdmin && canManageDisbursements;
  const canAccessWalletControl = isSystemWalletAdmin(user?.id) && isSuperAdmin && canManageWallet;
  const canAccessCryptoApprovals = isSystemWalletAdmin(user?.id) && isSuperAdmin && canApproveTopups;
  const canAccessPaymentChannels = isSuperAdmin && (canManagePayments || canManageDisbursements);
  const canAccessWalletSettings = isSuperAdmin && canManageWallet;
  const canAccessUserManagement = isSuperAdmin;
  const canAccessOperations = isSuperAdmin && (canManagePayments || canManageDisbursements || canApproveTopups || canViewReports || canManageBot);
  const canAccessPlatformSettings = isSuperAdmin && (canManagePayments || canManageWallet);
  const canAccessGovernance = isSuperAdmin;
  const canAccessTossAccountApprovals = isSuperAdmin && canManageTossAccounts;

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
    isSuperAdmin,
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
    isSuperAdmin,
  ]);

  // Set initial tab from URL or default
  useEffect(() => {
    if (requestedTab && tabs.some(tab => tab.id === requestedTab)) {
      setSelectedTab(requestedTab);
    } else if (tabs.length > 0) {
      setSelectedTab(tabs[0].id);
    }
  }, [requestedTab, tabs]);

  // Redirect if user is not super admin
  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/');
    }
  }, [isSuperAdmin, navigate]);

  if (!isSuperAdmin) {
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

          {/* Dashboard Tab */}
          {selectedTab === 'dashboard' && canAccessDashboard && (
            <BankingDashboard />
          )}

          {/* Merchants Tab */}
          {selectedTab === 'merchants' && canAccessMerchants && (
            <MerchantManagement />
          )}

          {/* Transactions Tab */}
          {selectedTab === 'transactions' && canAccessTransactions && (
            <TransactionsTab />
          )}

          {/* Settlements Tab */}
          {selectedTab === 'settlements' && canAccessSettlements && (
            <SettlementsTab />
          )}

          {/* Wallet Control Tab */}
          {selectedTab === 'wallet-control' && canAccessWalletControl && (
            <WalletControlTab />
          )}

          {/* Crypto Approvals Tab */}
          {selectedTab === 'crypto-approvals' && canAccessCryptoApprovals && (
            <CryptoApprovalsTab />
          )}

          {/* TOSS Account Approvals Tab */}
          {selectedTab === 'toss-account-approvals' && canAccessTossAccountApprovals && (
            <TossAccountApprovalsPanel />
          )}

          {/* Payment Channels Tab */}
          {selectedTab === 'payment-channels' && canAccessPaymentChannels && (
            <PaymentChannelsTab />
          )}

          {/* Wallet Settings Tab */}
          {selectedTab === 'wallet-settings' && canAccessWalletSettings && (
            <WalletSettingsTab />
          )}

          {/* User Management Tab */}
          {selectedTab === 'users' && canAccessUserManagement && (
            <UsersTab />
          )}

          {/* Team Invitations Tab */}
          {selectedTab === 'team-invitations' && canManageTeam && (
            <TeamInvitationsTab />
          )}

          {/* Team Members Tab */}
          {selectedTab === 'team-members' && canManageTeam && (
            <TeamMembersTab />
          )}

          {/* Audit Logs Tab */}
          {selectedTab === 'audit-logs' && canAccessGovernance && (
            <AuditLogsTab />
          )}

          {/* Platform Settings Tab */}
          {selectedTab === 'platform-settings' && canAccessPlatformSettings && (
            <PlatformSettingsTab />
          )}

          {/* Operations Tab */}
          {selectedTab === 'operations' && canAccessOperations && (
            <OperationsTab />
          )}

          {/* Test Data Cleanup Tab */}
          {selectedTab === 'test-data-cleanup' && isSuperAdmin && (
            <TestDataCleanupTab />
          )}
        </div>
      </div>
    </Layout>
  );
}
