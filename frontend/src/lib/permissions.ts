export interface UserPermissions {
  is_super_admin: boolean;
  can_manage_payments: boolean;
  can_manage_disbursements: boolean;
  can_view_reports: boolean;
  can_manage_wallet: boolean;
  can_manage_transactions: boolean;
  can_manage_bot: boolean;
  can_approve_topups: boolean;
  can_manage_team: boolean;
  can_credit_wallet?: boolean;
  can_debit_wallet?: boolean;
  can_freeze_wallet?: boolean;
  can_unfreeze_wallet?: boolean;
}

export const SYSTEM_WALLET_ADMIN_ID = '7851923260';

export function isSystemWalletAdmin(userId: string | null | undefined): boolean {
  return userId?.trim() === SYSTEM_WALLET_ADMIN_ID;
}

export type PermissionKey = keyof UserPermissions;

export type ConfigurablePermissionKey = Exclude<PermissionKey, 'is_super_admin'>;

export type PermissionGroup =
  | 'People & access'
  | 'Approvals & wallets'
  | 'Payments & configuration'
  | 'Teams'
  | 'Governance';

export const PERMISSION_DEFINITIONS: {
  key: ConfigurablePermissionKey;
  label: string;
  description: string;
  group: PermissionGroup;
  color: string;
}[] = [
  { key: 'can_manage_team', label: 'Team management', description: 'Invite and manage organization members.', group: 'People & access', color: 'blue' },
  { key: 'can_manage_payments', label: 'Payments', description: 'Create and manage payment activity.', group: 'Payments & configuration', color: 'blue' },
  { key: 'can_manage_disbursements', label: 'Disbursements', description: 'Create and track outgoing payouts.', group: 'Payments & configuration', color: 'emerald' },
  { key: 'can_manage_transactions', label: 'Transactions', description: 'View and review transaction history.', group: 'Payments & configuration', color: 'cyan' },
  { key: 'can_manage_wallet', label: 'Wallet', description: 'View the shared organization wallet and manage settings; money actions require separate permissions.', group: 'Approvals & wallets', color: 'indigo' },
  { key: 'can_credit_wallet', label: 'Credit wallet', description: 'Credit platform wallets; wallet control is restricted to the designated system user.', group: 'Approvals & wallets', color: 'emerald' },
  { key: 'can_debit_wallet', label: 'Debit wallet', description: 'Debit platform wallets; wallet control is restricted to the designated system user.', group: 'Approvals & wallets', color: 'yellow' },
  { key: 'can_freeze_wallet', label: 'Freeze wallet', description: 'Freeze wallets; wallet control is restricted to the designated system user.', group: 'Approvals & wallets', color: 'indigo' },
  { key: 'can_unfreeze_wallet', label: 'Unfreeze wallet', description: 'Unfreeze wallets; wallet control is restricted to the designated system user.', group: 'Approvals & wallets', color: 'cyan' },
  { key: 'can_approve_topups', label: 'Payment and top-up approvals', description: 'Approve top-ups; payment approvals are restricted to the designated system user.', group: 'Approvals & wallets', color: 'teal' },
  { key: 'can_manage_bot', label: 'Bot settings', description: 'Configure bot and developer settings.', group: 'Payments & configuration', color: 'slate' },
  { key: 'can_view_reports', label: 'Reports', description: 'View operational and financial reports.', group: 'Governance', color: 'yellow' },
];

export const PERMISSION_KEYS: PermissionKey[] = [
  'is_super_admin',
  'can_manage_payments',
  'can_manage_disbursements',
  'can_view_reports',
  'can_manage_wallet',
  'can_manage_transactions',
  'can_manage_bot',
  'can_approve_topups',
  'can_manage_team',
  'can_credit_wallet',
  'can_debit_wallet',
  'can_freeze_wallet',
  'can_unfreeze_wallet',
];

export function hasPermission(
  permissions: UserPermissions | null | undefined,
  permission: PermissionKey,
): boolean {
  return Boolean(permissions?.[permission]);
}

export function hasSuperAdminAccess(
  permissions: UserPermissions | null | undefined,
): boolean {
  return Boolean(permissions?.is_super_admin);
}

export function hasDashboardAccess(permissions: UserPermissions | null | undefined): boolean {
  return PERMISSION_KEYS.some(permission => permission !== 'is_super_admin' && Boolean(permissions?.[permission]));
}
