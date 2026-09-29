import { describe, expect, it } from 'vitest';
import { ROLE_PERMISSION_PRESETS } from './adminRolePermissions';

describe('admin role permission previews', () => {
  it('keeps the org-owned owner and admin presets aligned with the shared organization model', () => {
    expect(ROLE_PERMISSION_PRESETS.owner.has('can_manage_team')).toBe(true);
    expect(ROLE_PERMISSION_PRESETS.owner.has('can_manage_wallet')).toBe(true);
    expect(ROLE_PERMISSION_PRESETS.owner.has('can_approve_topups')).toBe(false);
    expect(ROLE_PERMISSION_PRESETS.owner.has('can_credit_wallet')).toBe(false);
    expect(ROLE_PERMISSION_PRESETS.owner.has('can_debit_wallet')).toBe(false);
    expect(ROLE_PERMISSION_PRESETS.admin.has('can_manage_team')).toBe(true);
    expect(ROLE_PERMISSION_PRESETS.admin.has('can_manage_wallet')).toBe(true);
    expect(ROLE_PERMISSION_PRESETS.admin.has('can_approve_topups')).toBe(false);
  });
});
