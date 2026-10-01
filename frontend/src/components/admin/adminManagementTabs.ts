import type { LucideIcon } from 'lucide-react';
import {
  Bitcoin,
  CheckCircle,
  FileText,
  Mail,
  BarChart3,
  TrendingUp,
  DollarSign,
  Power,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  WrenchIcon,
} from 'lucide-react';

export type AdminTab =
  | 'dashboard'
  | 'merchants'
  | 'transactions'
  | 'settlements'
  | 'wallet-control'
  | 'crypto-approvals'
  | 'payment-channels'
  | 'wallet-settings'
  | 'users'
  | 'team-invitations'
  | 'team-members'
  | 'audit-logs'
  | 'platform-settings'
  | 'operations'
  | 'test-data-cleanup';

export interface AdminTabMeta {
  id: AdminTab;
  label: string;
  icon: LucideIcon;
  iconClassName?: string;
  count?: number;
  description: string;
  group: string;
}

export interface AdminTabAccess {
  canAccessDashboard: boolean;
  canAccessMerchants: boolean;
  canAccessTransactions: boolean;
  canAccessSettlements: boolean;
  canAccessWalletControl: boolean;
  canAccessCryptoApprovals: boolean;
  canAccessPaymentChannels: boolean;
  canAccessWalletSettings: boolean;
  canAccessUserManagement: boolean;
  canAccessPaymentChannels: boolean;
  canAccessWalletSettings: boolean;
  canAccessPlatformSettings: boolean;
  canAccessOperations: boolean;
  canManageTeam: boolean;
  canAccessGovernance: boolean;
  isSuperAdmin: boolean;
}

export function buildAdminTabs(access: AdminTabAccess, merchantCount: number): AdminTabMeta[] {
  const tabs: AdminTabMeta[] = [];

  // Dashboard - Overview and key metrics
  if (access.isSuperAdmin) {
    tabs.push({
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      group: 'Banking Operations',
      description: 'Overview of key metrics, recent transactions, and system status.',
    });
  }

  // ── Merchant Operations ────────────────────────────────────────
  if (access.canAccessMerchants) {
    tabs.push({
      id: 'merchants',
      label: 'Merchants',
      icon: Users,
      count: merchantCount,
      group: 'Banking Operations',
      description: 'Manage merchant accounts and owner information.',
    });
  }

  if (access.canAccessTransactions) {
    tabs.push({
      id: 'transactions',
      label: 'Transactions',
      icon: TrendingUp,
      group: 'Banking Operations',
      description: 'Monitor and manage payment transactions across the platform.',
    });
  }

  if (access.canAccessSettlements) {
    tabs.push({
      id: 'settlements',
      label: 'Settlements',
      icon: DollarSign,
      group: 'Banking Operations',
      description: 'Manage settlement batches and reconciliation.',
    });
  }

  // ── Financial Controls ────────────────────────────────────────
  if (access.canAccessWalletControl) {
    tabs.push({
      id: 'wallet-control',
      label: 'Wallet Control',
      icon: Wallet,
      group: 'Financial Control',
      description: 'Credit or debit wallets and manage account balances.',
    });
  }

  if (access.canAccessCryptoApprovals) {
    tabs.push({
      id: 'crypto-approvals',
      label: 'Crypto Approvals',
      icon: Bitcoin,
      group: 'Financial Control',
      description: 'Review and approve USDT top-up requests.',
    });
  }

  // ── Payment Configuration ────────────────────────────────────────
  if (access.canAccessPaymentChannels) {
    tabs.push({
      id: 'payment-channels',
      label: 'Payment Channels',
      icon: Power,
      group: 'Payment Configuration',
      description: 'Enable/disable payment methods by currency and region.',
    });
  }

  if (access.canAccessWalletSettings) {
    tabs.push({
      id: 'wallet-settings',
      label: 'Wallet Settings',
      icon: WrenchIcon,
      group: 'Payment Configuration',
      description: 'Configure wallet deposit currencies and receiving accounts.',
    });
  }

  // ── Access & Governance ────────────────────────────────────────
  if (access.canAccessUserManagement) {
    tabs.push({
      id: 'users',
      label: 'Users',
      icon: Users,
      group: 'Access & Governance',
      description: 'Manage platform users and their roles.',
    });
  }

  if (access.canManageTeam) {
    tabs.push(
      {
        id: 'team-invitations',
        label: 'Team Invitations',
        icon: Mail,
        group: 'Access & Governance',
        description: 'Manage pending team member invitations.',
      },
      {
        id: 'team-members',
        label: 'Team Members',
        icon: Users,
        group: 'Access & Governance',
        description: 'Manage team members and their permissions.',
      },
    );
  }

  if (access.canAccessGovernance) {
    tabs.push({
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: FileText,
      group: 'Access & Governance',
      description: 'Review audit trail of all platform operations.',
    });
  }

  // ── Platform Management ────────────────────────────────────────
  if (access.canAccessPlatformSettings) {
    tabs.push({
      id: 'platform-settings',
      label: 'Platform Settings',
      icon: WrenchIcon,
      group: 'Platform Management',
      description: 'Configure system-wide settings and fees.',
    });
  }

  if (access.canAccessOperations) {
    tabs.push({
      id: 'operations',
      label: 'Operations',
      icon: RefreshCw,
      group: 'Platform Management',
      description: 'Access operational workflows and maintenance tasks.',
    });
  }

  if (access.isSuperAdmin) {
    tabs.push({
      id: 'test-data-cleanup',
      label: 'Test Data Cleanup',
      icon: Trash2,
      group: 'Platform Management',
      description: 'Clear test transactions and data.',
    });
  }

  return tabs;
}