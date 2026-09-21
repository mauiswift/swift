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

export type PermissionKey = keyof UserPermissions;

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
  return Boolean(permissions?.is_super_admin || permissions?.[permission]);
}

export function hasDashboardAccess(permissions: UserPermissions | null | undefined): boolean {
  return PERMISSION_KEYS.some(permission => permission !== 'is_super_admin' && Boolean(permissions?.[permission]));
}
