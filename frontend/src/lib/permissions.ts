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
}

export type PermissionKey = keyof UserPermissions;

export function hasPermission(
  permissions: UserPermissions | null | undefined,
  permission: PermissionKey,
): boolean {
  return Boolean(permissions?.is_super_admin || permissions?.[permission]);
}

export function hasDashboardAccess(permissions: UserPermissions | null | undefined): boolean {
  return Boolean(
    permissions?.is_super_admin ||
    permissions?.can_manage_payments ||
    permissions?.can_manage_disbursements ||
    permissions?.can_view_reports ||
    permissions?.can_manage_wallet ||
    permissions?.can_manage_transactions ||
    permissions?.can_manage_bot ||
    permissions?.can_approve_topups ||
    permissions?.can_manage_team,
  );
}
