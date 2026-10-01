import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { client } from '@/lib/api';
import { isSystemWalletAdmin } from '@/lib/permissions';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AlertCircle } from 'lucide-react';
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
import { toast } from 'sonner';

type TabId = AdminTab;

export default function AdminManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab') as AdminTab | null;

  const [selectedTab, setSelectedTab] = useState<TabId>('dashboard');
  const [error, setError] = useState('');

  // Permissions
  const isSuperAdmin = user?.role === 'super_admin';
  const canManageTeam = Boolean(user?.permissions?.can_manage_team);
  const canManagePayments = Boolean(user?.permissions?.can_manage_payments);
  const canManageWallet = Boolean(user?.permissions?.can_manage_wallet);
  const canManageDisbursements = Boolean(user?.permissions?.can_manage_disbursements);
  const canApproveTopups = Boolean(user?.permissions?.can_approve_topups);
  const canViewReports = Boolean(user?.permissions?.can_view_reports);
  const canManageBot = Boolean(user?.permissions?.can_manage_bot);

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

  // Build tabs
  const tabs = buildAdminTabs({
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
    canManageTeam,
    canAccessGovernance,
    isSuperAdmin,
  }, 0);

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

  // Build sidebar sections
  const sections = [
    {
      title: 'Banking Operations',
      color: 'bg-blue-500',
      icon: '🏦',
      tabs: tabs.filter(t => ['dashboard', 'merchants', 'transactions', 'settlements'].includes(t.id as string)),
    },
    {
      title: 'Financial Control',
      color: 'bg-emerald-500',
      icon: '💰',
      tabs: tabs.filter(t => ['wallet-control', 'crypto-approvals'].includes(t.id as string)),
    },
    {
      title: 'Payment Configuration',
      color: 'bg-purple-500',
      icon: '⚙️',
      tabs: tabs.filter(t => ['payment-channels', 'wallet-settings'].includes(t.id as string)),
    },
    {
      title: 'Access & Governance',
      color: 'bg-amber-500',
      icon: '🔐',
      tabs: tabs.filter(t => ['users', 'team-invitations', 'team-members', 'audit-logs'].includes(t.id as string)),
    },
    {
      title: 'Platform Management',
      color: 'bg-red-500',
      icon: '⚡',
      tabs: tabs.filter(t => ['platform-settings', 'operations', 'test-data-cleanup'].includes(t.id as string)),
    },
  ];

  return (
    <Layout>
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar */}
        <AdminSidebar
          sections={sections}
          selectedTab={selectedTab}
          onTabSelect={setSelectedTab}
        />

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 overflow-auto">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white shadow-sm sticky top-0 z-10">
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900">
                  {selectedTabMeta?.label || 'Administration'}
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  {selectedTabMeta?.description || 'Manage your banking platform'}
                </p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="shrink-0 hover:opacity-70"
                    aria-label="Dismiss error"
                  >
                    ✕
                  </button>
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
        </main>
      </div>
    </Layout>
  );
}
