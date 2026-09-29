import type { LucideIcon } from 'lucide-react';
import {
  Bitcoin,
  CheckCircle,
  FileText,
  Mail,
  Palette,
  Power,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  WrenchIcon,
} from 'lucide-react';

export type AdminTab =
  | 'admins'
  | 'users'
  | 'crypto'
  | 'wallet-control'
  | 'payment-channels'
  | 'wallet-settings'
  | 'bitgo'
  | 'checkout-design'
  | 'platform-settings'
  | 'operations'
  | 'toss-approvals'
  | 'team-invitations'
  | 'team-members'
  | 'audit-logs'
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
  canAccessAdminUsers: boolean;
  canAccessUserManagement: boolean;
  canAccessCryptoRequests: boolean;
  canAccessWalletControl: boolean;
  canAccessOperations: boolean;
  canAccessTossApprovals: boolean;
  canAccessPaymentChannels: boolean;
  canAccessWalletSettings: boolean;
  canAccessBitgo: boolean;
  canAccessCheckoutDesign: boolean;
  canAccessPlatformSettings: boolean;
  canManageTeam: boolean;
  canAccessGovernance: boolean;
  isSuperAdmin: boolean;
}

export function buildAdminTabs(access: AdminTabAccess, adminCount: number): AdminTabMeta[] {
  const tabs: AdminTabMeta[] = [];

  if (access.canAccessAdminUsers) {
    tabs.push({
      id: 'admins',
      label: 'Admin Users',
      icon: ShieldCheck,
      count: adminCount,
      group: 'People & access',
      description: 'Manage dashboard administrators and their specific permissions.',
    });
  }
  if (access.canAccessUserManagement) {
    tabs.push({
      id: 'users',
      label: 'User Management',
      icon: Users,
      group: 'People & access',
      description: 'View and manage roles for all registered platform users.',
    });
  }
  if (access.canAccessCryptoRequests) {
    tabs.push({
      id: 'crypto',
      label: 'Crypto Requests',
      icon: Bitcoin,
      group: 'Approvals & wallets',
      description: 'Review and approve USDT top-up requests from users.',
    });
  }
  if (access.canAccessWalletControl) {
    tabs.push({
      id: 'wallet-control',
      label: 'Wallet Control',
      icon: Wallet,
      iconClassName: 'text-blue-400',
      group: 'Approvals & wallets',
      description: 'Credit or debit any active user wallet in PHP, USDT, CNY, or KRW.',
    });
  }
  if (access.canAccessOperations) {
    tabs.push({
      id: 'operations',
      label: 'Operational workflows',
      icon: RefreshCw,
      group: 'Approvals & wallets',
      description: 'Open payment, deposit, withdrawal, verification, broadcast, and bot operations.',
    });
  }
  if (access.canAccessTossApprovals) {
    tabs.push({
      id: 'toss-approvals',
      label: 'TOSS Bank approvals',
      icon: CheckCircle,
      group: 'Approvals & wallets',
      description: 'Review and approve TOSS Bank virtual account applications.',
    });
  }
  if (access.canAccessPaymentChannels) {
    tabs.push({
      id: 'payment-channels',
      label: 'Payment Channels',
      icon: Power,
      group: 'Payments & configuration',
      description: 'Control checkout, withdrawal, and disbursement channels by currency.',
    });
  }
  if (access.canAccessWalletSettings) {
    tabs.push({
      id: 'wallet-settings',
      label: 'Wallet Settings',
      icon: WrenchIcon,
      group: 'Payments & configuration',
      description: 'Configure accepted deposit currencies and receiving accounts for user wallets.',
    });
  }
  if (access.canAccessBitgo) {
    tabs.push({
      id: 'bitgo',
      label: 'BitGo USDT',
      icon: Bitcoin,
      group: 'Payments & configuration',
      description: 'Configure unique TRC20 address assignment and scan incoming and outgoing transfers.',
    });
  }
  if (access.canAccessCheckoutDesign) {
    tabs.push({
      id: 'checkout-design',
      label: 'Checkout Design',
      icon: Palette,
      group: 'Payments & configuration',
      description: 'Customize the public checkout appearance.',
    });
  }
  if (access.canAccessPlatformSettings) {
    tabs.push({
      id: 'platform-settings',
      label: 'Platform settings',
      icon: WrenchIcon,
      group: 'Payments & configuration',
      description: 'Manage collection currencies, conversion fees, and database backups.',
    });
  }
  if (access.canManageTeam) {
    tabs.push(
      {
        id: 'team-invitations',
        label: 'Team Invitations',
        icon: Mail,
        group: 'Teams',
        description: 'Manage pending team invites and organization access.',
      },
      {
        id: 'team-members',
        label: 'Team Members',
        icon: Users,
        group: 'Teams',
        description: 'Manage existing team members within your organization.',
      },
    );
  }
  if (access.canAccessGovernance) {
    tabs.push({
      id: 'audit-logs',
      label: 'Audit Logs',
      icon: FileText,
      group: 'Governance',
      description: 'Review administrative activity and export audit history.',
    });
  }
  if (access.isSuperAdmin) {
    tabs.push({
      id: 'test-data-cleanup',
      label: 'Test data cleanup',
      icon: Trash2,
      group: 'Governance',
      description: 'Review and permanently clear payment transactions and disbursements for test-mode merchants.',
    });
  }

  return tabs;
}