import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownToLine,
  BarChart3,
  Banknote,
  Bitcoin,
  Bot,
  ClipboardCheck,
  CreditCard,
  Home,
  Link2,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Send,
  Settings,
  ShieldCheck,
  UserCheck,
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
  superAdminOrPermission?: PermissionKey;
  superAdminOnly?: boolean;
  vipGoldOrTeamPermission?: boolean;
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
  user: { isSuperAdmin?: boolean } | null | undefined,
): boolean {
  return Boolean(user?.isSuperAdmin);
}

function visible(
  item: AdminNavItem,
  permissions: UserPermissions | undefined,
  isSuperAdmin: boolean,
  isVipGold: boolean,
): boolean {
  if (item.superAdminOnly && !isSuperAdmin) return false;
  if (item.superAdminOrPermission && !isSuperAdmin && !hasPermission(permissions, item.superAdminOrPermission)) return false;
  if (item.vipGoldOrTeamPermission && !isVipGold && !hasPermission(permissions, 'can_manage_team')) return false;
  return !item.permission || hasPermission(permissions, item.permission);
}

function filterItems(
  items: AdminNavItem[],
  permissions: UserPermissions | undefined,
  isSuperAdmin: boolean,
  isVipGold: boolean,
): AdminNavItem[] {
  return items.filter(item => visible(item, permissions, isSuperAdmin, isVipGold));
}

export function buildAdminNavigation(
  permissions: UserPermissions | undefined,
  isSuperAdmin: boolean,
  language: string,
  translate: (key: string) => string,
  isVipGold = false,
): AdminNavigation {
  const isKorean = language === 'ko';
  const isPlatformSuperAdmin = canAccessSuperAdminControls({ isSuperAdmin });
  const label = (key: string, fallback: string) => {
    const translated = translate(key);
    return translated || fallback;
  };
  const sectionLabel = (english: string, korean: string) => isPlatformSuperAdmin ? english : (isKorean ? korean : english);

  const sections: AdminNavSection[] = [
    {
      label: sectionLabel('OVERVIEW', '개요'),
      items: filterItems([
        { label: label('nav_home', 'Home'), icon: Home, path: '/dashboard' },
        { label: label('nav_reports', 'Reports'), icon: BarChart3, path: '/reports', permission: 'can_view_reports' },
      ], permissions, isPlatformSuperAdmin, isVipGold).filter(item =>
        item.path !== '/dashboard' || isPlatformSuperAdmin || hasDashboardAccess(permissions)
      ),
    },
    {
      label: sectionLabel('PAYMENTS', '결제'),
      items: filterItems([
        { label: label('nav_wallet', 'Wallet'), icon: Wallet, path: '/wallet', permission: 'can_manage_wallet' },
        { label: label('nav_cryptocurrency', 'USDT'), icon: Bitcoin, path: '/cryptocurrency', permission: 'can_manage_wallet' },
        { label: label('nav_payments', 'Payments'), icon: CreditCard, path: '/payments', permission: 'can_manage_payments' },
        { label: label('nav_payment_links', 'Payment Links'), icon: Link2, path: '/pay-by-link', permission: 'can_manage_payments' },
        { label: label('nav_disbursements', 'Disbursements'), icon: Send, path: '/disbursements', permission: 'can_manage_disbursements' },
      ], permissions, isPlatformSuperAdmin, isVipGold),
    },
    {
      label: sectionLabel('MANAGEMENT', '관리'),
      items: filterItems([
        { label: label('nav_admin_management', 'Admin Management'), icon: ShieldCheck, path: '/admin-management', superAdminOnly: true },
        { label: label('nav_roles', 'Roles & Permissions'), icon: ShieldCheck, path: '/roles', superAdminOnly: true },
        { label: label('nav_approvals', 'Payment Approvals'), icon: ClipboardCheck, path: '/payment-approvals', superAdminOrPermission: 'can_approve_topups' },
        { label: label('nav_bank_deposits', 'Bank Deposits'), icon: Banknote, path: '/bank-deposits', superAdminOnly: true },
        { label: label('nav_topup_requests', 'Top-up Requests'), icon: ArrowDownToLine, path: '/topup-requests', superAdminOnly: true },
        { label: label('nav_withdrawals', 'Withdrawals'), icon: Send, path: '/withdrawals', superAdminOnly: true },
        { label: label('nav_usdt_requests', 'USDT Send Requests'), icon: Bitcoin, path: '/withdrawals/usdt-send-requests', superAdminOnly: true },
        { label: label('nav_toss_applications', 'TOSS Bank Applications'), icon: Wallet, path: '/toss-account-approvals', superAdminOnly: true, permission: 'can_manage_wallet' },
        { label: label('nav_kyb_registrations', 'KYB Registrations'), icon: UserCheck, path: '/kyb-registrations', superAdminOnly: true },
        { label: label('nav_kyc_verifications', 'KYC Verifications'), icon: ClipboardCheck, path: '/kyc-verifications', superAdminOnly: true },
        { label: label('nav_broadcasts', 'Broadcasts'), icon: Megaphone, path: '/broadcasts', superAdminOnly: true },
        { label: label('nav_bot_messages', 'Bot Messages'), icon: MessagesSquare, path: '/bot-messages', superAdminOnly: true },
      ], permissions, isPlatformSuperAdmin, isVipGold),
    },
  ];

  const systemItems = filterItems([
    { label: 'VIP', icon: BarChart3, path: '/downline-management', vipGoldOrTeamPermission: true },
    { label: label('nav_settings', 'Settings'), icon: Settings, path: '/settings' },
    { label: label('nav_contact_support', 'Support'), icon: MessageCircle, path: '/support' },
    { label: label('nav_bot_settings', 'Bot Settings'), icon: Bot, path: '/bot-settings', permission: 'can_manage_bot' },
  ], permissions, isPlatformSuperAdmin, isVipGold);

  return {
    sections: sections
      .filter(section => !section.superAdminOnly || isPlatformSuperAdmin)
      .filter(section => section.items.length > 0),
    systemItems,
  };
}
