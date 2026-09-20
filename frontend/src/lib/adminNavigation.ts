import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  Bitcoin,
  Bot,
  CheckSquare,
  CreditCard,
  DollarSign,
  FileText,
  Home,
  Landmark,
  Link2,
  MessageCircle,
  MessageSquare,
  Send,
  Settings,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import {
  hasDashboardAccess,
  hasPermission,
  type PermissionKey,
  type UserPermissions,
} from '@/lib/permissions';

export interface AdminNavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  permission?: PermissionKey;
  superAdminOnly?: boolean;
}

export interface AdminNavSection {
  label: string;
  items: AdminNavItem[];
  superAdminOnly?: boolean;
}

export interface AdminNavigation {
  sections: AdminNavSection[];
  systemItems: AdminNavItem[];
}

export function canAccessSuperAdminControls(
  user: { isSuperAdmin?: boolean; permissions?: UserPermissions | null } | null | undefined,
): boolean {
  return Boolean(user?.isSuperAdmin || user?.permissions?.is_super_admin);
}

function visible(
  item: AdminNavItem,
  permissions: UserPermissions | undefined,
  isSuperAdmin: boolean,
): boolean {
  if (item.superAdminOnly && !isSuperAdmin) return false;
  return !item.permission || hasPermission(permissions, item.permission);
}

function filterItems(
  items: AdminNavItem[],
  permissions: UserPermissions | undefined,
  isSuperAdmin: boolean,
): AdminNavItem[] {
  return items.filter(item => visible(item, permissions, isSuperAdmin));
}

export function buildAdminNavigation(
  permissions: UserPermissions | undefined,
  isSuperAdmin: boolean,
  language: string,
  translate: (key: string) => string,
): AdminNavigation {
  const isKorean = language === 'ko';
  const label = (key: string, fallback: string) => {
    const translated = translate(key);
    return translated || fallback;
  };
  const sectionLabel = (english: string, korean: string) => isSuperAdmin ? english : (isKorean ? korean : english);

  const sections: AdminNavSection[] = [
    {
      label: sectionLabel('MAIN', '메인'),
      items: filterItems([
        { label: label('nav_home', 'Home'), icon: Home, path: '/dashboard' },
        { label: label('nav_wallet', 'Wallet'), icon: Wallet, path: '/wallet', permission: 'can_manage_wallet' },
        { label: label('nav_cryptocurrency', 'USDT'), icon: Bitcoin, path: '/cryptocurrency', permission: 'can_manage_wallet' },
      ], permissions, isSuperAdmin).filter(item => item.path !== '/dashboard' || isSuperAdmin || hasDashboardAccess(permissions)),
    },
    {
      label: sectionLabel('TRANSACTIONS', '거래'),
      items: filterItems([
        { label: label('nav_payments', 'Payments'), icon: CreditCard, path: '/payments', permission: 'can_manage_payments' },
        { label: label('nav_payment_links', 'Payment Links'), icon: Link2, path: '/pay-by-link', permission: 'can_manage_payments' },
        { label: label('nav_disbursements', 'Disbursements'), icon: Send, path: '/disbursements', permission: 'can_manage_disbursements' },
      ], permissions, isSuperAdmin),
    },
    {
      label: sectionLabel('INSIGHTS', '인사이트'),
      items: filterItems([
        { label: label('nav_reports', 'Reports'), icon: BarChart3, path: '/reports', permission: 'can_view_reports' },
      ], permissions, isSuperAdmin),
    },
    {
      label: sectionLabel('SUPER ADMIN', '슈퍼 관리자'),
      superAdminOnly: true,
      items: [
        { label: label('nav_admin_management', 'Admin Management'), icon: ShieldCheck, path: '/admin-management', superAdminOnly: true },
        { label: label('nav_approvals', 'Payment approvals'), icon: CheckSquare, path: '/payment-approvals', superAdminOnly: true },
        { label: label('nav_bank_deposits', 'Bank deposits'), icon: Landmark, path: '/bank-deposits', superAdminOnly: true },
        { label: label('nav_topup_requests', 'Top-up requests'), icon: Wallet, path: '/topup-requests', superAdminOnly: true },
        { label: label('nav_withdrawals', 'Withdrawals'), icon: DollarSign, path: '/withdrawals', superAdminOnly: true },
        { label: label('nav_usdt_requests', 'USDT send requests'), icon: Send, path: '/withdrawals/usdt-send-requests', superAdminOnly: true },
        { label: label('nav_kyb_registrations', 'KYB registrations'), icon: FileText, path: '/kyb-registrations', superAdminOnly: true },
        { label: label('nav_kyc_verifications', 'KYC verifications'), icon: ShieldCheck, path: '/kyc-verifications', superAdminOnly: true },
        { label: label('nav_broadcasts', 'Broadcasts'), icon: Bell, path: '/broadcasts', superAdminOnly: true },
        { label: label('nav_bot_messages', 'Bot Messages'), icon: MessageSquare, path: '/bot-messages', superAdminOnly: true },
      ],
    },
  ];

  const systemItems = filterItems([
    { label: isKorean ? 'VIP' : 'VIP', icon: BarChart3, path: '/downline-management', permission: 'can_manage_team' },
    { label: label('nav_settings', 'Settings'), icon: Settings, path: '/settings' },
    { label: label('nav_contact_support', 'Support'), icon: MessageCircle, path: '/support' },
    { label: label('nav_bot_settings', 'Bot Settings'), icon: Bot, path: '/bot-settings', permission: 'can_manage_bot' },
  ], permissions, isSuperAdmin);

  return {
    sections: sections
      .filter(section => !section.superAdminOnly || isSuperAdmin)
      .map(section => ({ ...section, items: filterItems(section.items, permissions, isSuperAdmin) }))
      .filter(section => section.items.length > 0),
    systemItems,
  };
}
