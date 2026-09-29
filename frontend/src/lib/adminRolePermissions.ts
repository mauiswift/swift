import { PERMISSION_DEFINITIONS } from '@/lib/permissions';

const platformOnlyPermissions = new Set([
  'can_approve_topups',
  'can_credit_wallet',
  'can_debit_wallet',
  'can_freeze_wallet',
  'can_unfreeze_wallet',
]);

export const ROLE_PERMISSION_PRESETS: Record<string, Set<string>> = {
  owner: new Set(PERMISSION_DEFINITIONS.filter(({ key }) => !platformOnlyPermissions.has(key)).map(({ key }) => key)),
  admin: new Set(PERMISSION_DEFINITIONS.filter(({ key }) => !platformOnlyPermissions.has(key)).map(({ key }) => key)),
  manager: new Set(['can_manage_team', 'can_manage_payments', 'can_manage_disbursements', 'can_view_reports', 'can_manage_wallet', 'can_manage_transactions']),
  operator: new Set(['can_manage_payments', 'can_manage_disbursements', 'can_manage_transactions']),
  viewer: new Set(['can_view_reports', 'can_manage_transactions']),
  developer: new Set(['can_manage_bot']),
};
