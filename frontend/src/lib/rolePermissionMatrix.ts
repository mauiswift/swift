import {
  PERMISSION_DEFINITIONS,
  PERMISSION_KEYS,
  type PermissionKey,
} from '@/lib/permissions';
import { ROLE_PERMISSION_PRESETS } from '@/lib/adminRolePermissions';

export type RolePermissionMatrixRole = {
  key: string;
  title: string;
  description: string;
  permissions: PermissionKey[];
  notes?: string[];
};

export const ROLE_PERMISSION_MATRIX_PERMISSION_LABELS: Record<PermissionKey, string> = {
  is_super_admin: 'Super admin',
  can_manage_payments: 'Payments',
  can_manage_disbursements: 'Disbursements',
  can_view_reports: 'Reports',
  can_manage_wallet: 'Wallet',
  can_manage_transactions: 'Transactions',
  can_manage_bot: 'Bot settings',
  can_approve_topups: 'Approvals / top-ups',
  can_manage_team: 'Team management',
  can_credit_wallet: 'Credit wallet',
  can_debit_wallet: 'Debit wallet',
  can_freeze_wallet: 'Freeze wallet',
  can_unfreeze_wallet: 'Unfreeze wallet',
};

export const ROLE_PERMISSION_MATRIX_PERMISSION_ORDER: PermissionKey[] = [
  'is_super_admin',
  ...PERMISSION_DEFINITIONS.map(({ key }) => key),
];

function buildPresetPermissions(role: keyof typeof ROLE_PERMISSION_PRESETS): PermissionKey[] {
  const preset = ROLE_PERMISSION_PRESETS[role];
  const permissions = new Set<PermissionKey>();
  preset?.forEach((entry) => permissions.add(entry as PermissionKey));
  return ROLE_PERMISSION_MATRIX_PERMISSION_ORDER.filter((key) => key !== 'is_super_admin' && permissions.has(key));
}

function buildSuperAdminPermissions(): PermissionKey[] {
  return ROLE_PERMISSION_MATRIX_PERMISSION_ORDER.filter((key) => PERMISSION_KEYS.includes(key));
}

export function getRolePermissionMatrixRoles(): RolePermissionMatrixRole[] {
  return [
    {
      key: 'owner',
      title: 'Owner',
      description: 'Organization owner permissions (no platform-only approvals).',
      permissions: buildPresetPermissions('owner'),
    },
    {
      key: 'admin',
      title: 'Admin',
      description: 'Full merchant dashboard permissions (no platform-only approvals).',
      permissions: buildPresetPermissions('admin'),
    },
    {
      key: 'manager',
      title: 'Manager',
      description: 'Operations manager: team + payments + disbursements + reports + wallet + transactions.',
      permissions: buildPresetPermissions('manager'),
    },
    {
      key: 'operator',
      title: 'Operator',
      description: 'Payments + disbursements + transactions.',
      permissions: buildPresetPermissions('operator'),
    },
    {
      key: 'viewer',
      title: 'Viewer',
      description: 'Read-only reporting and transaction review.',
      permissions: buildPresetPermissions('viewer'),
    },
    {
      key: 'developer',
      title: 'Developer',
      description: 'Bot settings and developer tools.',
      permissions: buildPresetPermissions('developer'),
    },
    {
      key: 'super_admin_system',
      title: 'Super Admin (System)',
      description: 'Platform super admin using the designated system wallet admin account.',
      permissions: buildSuperAdminPermissions(),
      notes: [
        'Required for platform-only queues like Payment approvals, Bank deposits, and Top-up requests.',
        'Wallet control actions (credit/debit/freeze/unfreeze) are restricted to the system account.',
      ],
    },
    {
      key: 'super_admin_non_system',
      title: 'Super Admin (Non-system)',
      description: 'Super admin account that is NOT the designated system wallet admin.',
      permissions: ['is_super_admin'],
      notes: [
        'Some pages still require the system super admin user (platform-only restrictions).',
        'Use the system account for approval queues and wallet-control actions.',
      ],
    },
  ];
}

