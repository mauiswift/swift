import { describe, expect, it } from 'vitest';
import { buildAdminNavigation } from './adminNavigation';
import type { UserPermissions } from './permissions';

const noPermissions: UserPermissions = {
  is_super_admin: false,
  can_manage_payments: false,
  can_manage_disbursements: false,
  can_view_reports: false,
  can_manage_wallet: false,
  can_manage_transactions: false,
  can_manage_bot: false,
  can_approve_topups: false,
  can_manage_team: false,
};

const navigation = (permissions: UserPermissions, isVipGold: boolean) =>
  buildAdminNavigation(permissions, false, 'en', key => key, isVipGold);

const hasNavigationItem = (permissions: UserPermissions, isSuperAdmin = false) =>
  buildAdminNavigation(permissions, isSuperAdmin, 'en', key => key)
    .sections
    .some(section => section.items.some(item => item.path === '/payment-approvals'));

describe('VIP sidebar navigation', () => {
  it('shows the VIP tab to VIP Gold users without team-management permission', () => {
    const { systemItems } = navigation(noPermissions, true);

    expect(systemItems.some(item => item.path === '/downline-management')).toBe(true);
  });

  it('keeps the VIP tab hidden for non-VIP users without team-management permission', () => {
    const { systemItems } = navigation(noPermissions, false);

    expect(systemItems.some(item => item.path === '/downline-management')).toBe(false);
  });

  it('continues to show the VIP tab to users with team-management permission', () => {
    const { systemItems } = navigation({ ...noPermissions, can_manage_team: true }, false);

    expect(systemItems.some(item => item.path === '/downline-management')).toBe(true);
  });
});

describe('payment approval navigation', () => {
  it('keeps the payment approval tab hidden from org members with the legacy approval permission', () => {
    expect(hasNavigationItem({ ...noPermissions, can_approve_topups: true })).toBe(false);
  });

  it('keeps the payment approval tab hidden from users without approval permission', () => {
    expect(hasNavigationItem(noPermissions)).toBe(false);
  });

  it('keeps payment approval available to platform super admins', () => {
    const permissions = { ...noPermissions, is_super_admin: true };

    expect(hasNavigationItem(permissions, true)).toBe(true);
  });

  it('shows platform controls to super admins without team-management permission', () => {
    const { sections } = buildAdminNavigation(
      { ...noPermissions, is_super_admin: true },
      true,
      'en',
      key => key,
    );

    expect(sections.flatMap(section => section.items.map(item => item.path))).toContain('/admin-management');
  });
});

describe('admin management navigation', () => {
  it('shows team managers the admin management workspace', () => {
    const { sections } = buildAdminNavigation(
      { ...noPermissions, can_manage_team: true },
      false,
      'en',
      key => key,
    );

    expect(sections.flatMap(section => section.items.map(item => item.path))).toContain('/admin-management');
  });

  it('keeps the admin management workspace hidden without team or super-admin access', () => {
    const { sections } = buildAdminNavigation(noPermissions, false, 'en', key => key);

    expect(sections.flatMap(section => section.items.map(item => item.path))).not.toContain('/admin-management');
  });

  it('does not show the duplicate roles and permissions destination in the dashboard navigation', () => {
    const { sections } = buildAdminNavigation(
      { ...noPermissions, is_super_admin: true },
      true,
      'en',
      key => key,
    );
    const paths = sections.flatMap(section => section.items.map(item => item.path));

    expect(paths).toContain('/admin-management');
    expect(paths).not.toContain('/roles');
  });
});

describe('dashboard navigation grouping', () => {
  it('groups available pages without exposing system approvals to organization members', () => {
    const permissions: UserPermissions = {
      ...noPermissions,
      can_manage_payments: true,
      can_manage_disbursements: true,
      can_view_reports: true,
      can_manage_wallet: true,
      can_approve_topups: true,
    };
    const { sections } = buildAdminNavigation(permissions, false, 'en', key => key);

    expect(sections.map(section => section.label)).toEqual(['OVERVIEW', 'PAYMENTS']);
    expect(sections[0].items.map(item => item.path)).toEqual(['/dashboard', '/reports']);
    expect(sections[1].items.map(item => item.path)).toEqual([
      '/wallet',
      '/cryptocurrency',
      '/payments',
      '/pay-by-link',
      '/disbursements',
    ]);
    expect(sections.flatMap(section => section.items.map(item => item.path))).not.toContain('/payment-approvals');
  });

  it('keeps super-admin destinations available in the simplified groups', () => {
    const permissions: UserPermissions = {
      ...noPermissions,
      can_manage_wallet: true,
      can_view_reports: true,
    };
    const { sections } = buildAdminNavigation(permissions, true, 'en', key => key);
    const paths = sections.flatMap(section => section.items.map(item => item.path));

    expect(paths).toContain('/reports');
    expect(paths).toContain('/admin-management');
    expect(paths).toContain('/kyb-registrations');
    expect(paths).toContain('/broadcasts');
  });
});
