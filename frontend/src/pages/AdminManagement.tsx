import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { client } from '@/lib/api';
import { isSystemWalletAdmin } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  ChevronRight,
  Mail,
  Users,
  Trash2,
  Bitcoin,
  CheckCircle,
  Palette,
  FileText,
  WrenchIcon,
  Power,
  Wallet as WalletIcon,
} from 'lucide-react';
import { MerchantManagement } from '@/components/admin/MerchantManagement';
import { BankingDashboard } from '@/components/admin/BankingDashboard';
import { TransactionsTab } from '@/components/admin/TransactionsTab';
import { SettlementsTab } from '@/components/admin/SettlementsTab';
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

  return (
    <Layout>
      <div className="w-full min-h-screen bg-slate-50">
        {/* Header */}
        <div className="border-b border-slate-200 bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-slate-900">Administration</h1>
            <p className="mt-2 text-sm text-slate-600">Manage merchants, users, payments, and platform settings.</p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 overflow-x-auto pb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    selectedTab === tab.id
                      ? 'border-orange-600 text-orange-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                  title={tab.description}
                >
                  <div className="h-4 w-4">{tab.icon}</div>
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

          {selectedTabMeta && (
            <div className="mb-6 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-semibold uppercase tracking-wider text-slate-500">{selectedTabMeta.group}</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-slate-900">{selectedTabMeta.label}</span>
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
            <Card>
              <CardHeader>
                <CardTitle>Wallet Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Wallet credit/debit operations and balance management coming soon...</p>
              </CardContent>
            </Card>
          )}

          {/* Crypto Approvals Tab */}
          {selectedTab === 'crypto-approvals' && canAccessCryptoApprovals && (
            <Card>
              <CardHeader>
                <CardTitle>Crypto Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Review and approve USDT top-up requests coming soon...</p>
              </CardContent>
            </Card>
          )}

          {/* Payment Channels Tab */}
          {selectedTab === 'payment-channels' && canAccessPaymentChannels && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Enable/disable payment methods by currency and region coming soon...</p>
              </CardContent>
            </Card>
          )}

          {/* Wallet Settings Tab */}
          {selectedTab === 'wallet-settings' && canAccessWalletSettings && (
            <Card>
              <CardHeader>
                <CardTitle>Wallet Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Wallet configuration and deposit settings coming soon...</p>
              </CardContent>
            </Card>
          )}

          {/* User Management Tab */}
          {selectedTab === 'users' && canAccessUserManagement && (
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Platform user and role management coming soon...</p>
              </CardContent>
            </Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Audit trail of all platform operations coming soon...</p>
              </CardContent>
            </Card>
          )}

          {/* Platform Settings Tab */}
          {selectedTab === 'platform-settings' && canAccessPlatformSettings && (
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">System-wide settings and fee configuration coming soon...</p>
              </CardContent>
            </Card>
          )}

          {/* Operations Tab */}
          {selectedTab === 'operations' && canAccessOperations && (
            <Card>
              <CardHeader>
                <CardTitle>Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Operational workflows and maintenance tasks coming soon...</p>
              </CardContent>
            </Card>
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
