import { describe, expect, it } from 'vitest';
import { ROLE_PERMISSION_PRESETS } from './adminRolePermissions';

describe('admin role permission previews', () => {
  it('matches the restricted permissions of an invited super admin', () => {
    const invitedSuperAdminPermissions = ROLE_PERMISSION_PRESETS.super_admin;

    expect(invitedSuperAdminPermissions.has('can_manage_team')).toBe(false);
    expect(invitedSuperAdminPermissions.has('can_manage_wallet')).toBe(false);
    expect(invitedSuperAdminPermissions.has('can_credit_wallet')).toBe(false);
    expect(invitedSuperAdminPermissions.has('can_debit_wallet')).toBe(false);
    expect(invitedSuperAdminPermissions.has('can_freeze_wallet')).toBe(false);
    expect(invitedSuperAdminPermissions.has('can_unfreeze_wallet')).toBe(false);
    expect(invitedSuperAdminPermissions.has('can_manage_payments')).toBe(true);
    expect(invitedSuperAdminPermissions.has('can_manage_bot')).toBe(true);
  });
});
