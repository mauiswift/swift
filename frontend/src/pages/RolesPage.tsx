import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { client } from '@/lib/api';
import { PERMISSION_DEFINITIONS, type ConfigurablePermissionKey } from '@/lib/permissions';
import {
  Shield,
  Crown,
  ShieldCheck,
  Tag,
  User,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RolePermissions {
  is_super_admin: boolean;
  can_manage_payments: boolean;
  can_manage_disbursements: boolean;
  can_view_reports: boolean;
  can_manage_wallet: boolean;
  can_manage_transactions: boolean;
  can_manage_bot: boolean;
  can_approve_topups: boolean;
  can_manage_team: boolean;
  can_credit_wallet: boolean;
  can_debit_wallet: boolean;
  can_freeze_wallet: boolean;
  can_unfreeze_wallet: boolean;
}

interface RolePreset {
  id: number;
  name: string;
  description: string;
  color: string;
  is_system: boolean;
  permissions: RolePermissions;
}

interface AdminUser {
  id: number;
  telegram_id: string;
  telegram_username: string | null;
  name: string | null;
  is_active: boolean;
  is_super_admin: boolean;
  can_manage_payments: boolean;
  can_manage_disbursements: boolean;
  can_view_reports: boolean;
  can_manage_wallet: boolean;
  can_manage_transactions: boolean;
  can_manage_bot: boolean;
  can_approve_topups: boolean;
  can_manage_team: boolean;
  can_credit_wallet: boolean;
  can_debit_wallet: boolean;
  can_freeze_wallet: boolean;
  can_unfreeze_wallet: boolean;
  added_by: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PERMISSION_KEYS = PERMISSION_DEFINITIONS;

const BADGE_COLORS: Record<string, string> = {
  amber: 'bg-amber-500/15 border-amber-500/25 text-amber-400',
  blue: 'bg-blue-500/15 border-blue-500/25 text-blue-400',
  emerald: 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400',
  yellow: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400',
  indigo: 'bg-indigo-500/15 border-indigo-500/25 text-indigo-400',
  cyan: 'bg-cyan-500/15 border-cyan-500/25 text-cyan-400',
  slate: 'bg-slate-500/15 border-slate-500/25 text-muted-foreground',
  teal: 'bg-teal-500/15 border-teal-500/25 text-teal-400',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  super_admin: <Crown className="h-4 w-4 text-amber-400" />,
  manager: <ShieldCheck className="h-4 w-4 text-blue-400" />,
  cashier: <Shield className="h-4 w-4 text-emerald-400" />,
  reporter: <Tag className="h-4 w-4 text-yellow-400" />,
};

const permissionKeys: (keyof RolePermissions)[] = [
  'is_super_admin',
  ...PERMISSION_KEYS.map(({ key }) => key),
];

function normalizeRole(role: RolePreset & Partial<RolePermissions>): RolePreset {
  const permissions = permissionKeys.reduce((result, key) => {
    result[key] = Boolean(role[key] ?? role.permissions?.[key]);
    return result;
  }, {} as RolePermissions);

  return {
    id: role.id,
    name: role.name,
    description: role.description || 'Custom permission template',
    color: role.color || 'blue',
    is_system: Boolean(role.is_system),
    permissions,
  };
}

const emptyPermissions = (): Record<ConfigurablePermissionKey, boolean> =>
  Object.fromEntries(PERMISSION_DEFINITIONS.map(({ key }) => [key, false])) as Record<ConfigurablePermissionKey, boolean>;

// ── PermissionBadge ────────────────────────────────────────────────────────────

function PermissionBadge({ active, label, color }: { active: boolean; label: string; color: string }) {
  const colorCls = BADGE_COLORS[color] || BADGE_COLORS['blue'];
  if (active) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium ${colorCls}`}>
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium bg-muted/40 border-border/30 text-muted-foreground line-through">
      {label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const { isSuperAdmin } = useAuth();
  const [roles, setRoles] = useState<RolePreset[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    color: 'blue',
    is_super_admin: false,
    permissions: emptyPermissions(),
  });
  const [savingRole, setSavingRole] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const res = await client.fetch('/api/v1/roles');
      if (!res.ok) throw new Error(await res.text());
      const payload = await res.json();
      if (!Array.isArray(payload)) throw new Error('Invalid roles response');
      setRoles(payload.map(normalizeRole));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load roles');
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const fetchAdmins = useCallback(async () => {
    setAdminsLoading(true);
    try {
      const res = await client.fetch('/api/v1/admin-users');
      if (!res.ok) throw new Error(await res.text());
      setAdmins(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load admins');
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchAdmins();
  }, [fetchRoles, fetchAdmins]);

  const applyRole = async (role: RolePreset, admin: AdminUser) => {
    const key = `${role.id}-${admin.id}`;
    setApplying(key);
    setError('');
    setSuccess('');
    try {
      const res = await client.fetch(`/api/v1/admin-users/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role.name,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSuccess(`Applied "${role.name}" to ${admin.name || admin.telegram_username || `ID: ${admin.telegram_id}`}`);
      await fetchAdmins();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to apply role');
    } finally {
      setApplying(null);
    }
  };

  const resetRoleForm = () => {
    setEditingRoleId(null);
    setRoleForm({
      name: '',
      description: '',
      color: 'blue',
      is_super_admin: false,
      permissions: emptyPermissions(),
    });
  };

  const editRole = (role: RolePreset) => {
    setEditingRoleId(role.id);
    setRoleForm({
      name: role.name,
      description: role.description,
      color: role.color,
      is_super_admin: role.permissions.is_super_admin,
      permissions: Object.fromEntries(
        PERMISSION_DEFINITIONS.map(({ key }) => [key, Boolean(role.permissions[key])]),
      ) as Record<ConfigurablePermissionKey, boolean>,
    });
    setError('');
    setSuccess('');
  };

  const saveRole = async () => {
    if (!roleForm.name.trim()) {
      setError('Role name is required.');
      return;
    }
    setSavingRole(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: roleForm.name.trim(),
        description: roleForm.description.trim() || null,
        color: roleForm.color,
        is_super_admin: roleForm.is_super_admin,
        ...roleForm.permissions,
      };
      const res = await client.fetch(
        editingRoleId === null ? '/api/v1/roles' : `/api/v1/roles/${editingRoleId}`,
        {
          method: editingRoleId === null ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error(await res.text());
      await fetchRoles();
      setSuccess(editingRoleId === null ? 'Role created.' : 'Role updated.');
      resetRoleForm();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save role');
    } finally {
      setSavingRole(false);
    }
  };

  const activeAdmins = admins.filter((a) => a.is_active);
  const isLoading = rolesLoading || adminsLoading;

  const handleRefresh = useCallback(() => {
    fetchRoles();
    fetchAdmins();
  }, [fetchRoles, fetchAdmins]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto w-full min-w-0">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">Role Management</h1>
              <p className="text-muted-foreground text-xs mt-0.5 truncate">
                {rolesLoading
                  ? 'Loading…'
                  : `${roles.length} role preset${roles.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
          </div>
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground gap-1.5 text-xs shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
            Refresh
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/25 text-red-400 rounded-lg px-4 py-3 mb-4 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
            <button type="button" aria-label="Dismiss error" onClick={() => setError('')} className="motion-interactive ml-auto shrink-0 hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div role="status" aria-live="polite" className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-lg px-4 py-3 mb-4 text-sm">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{success}</span>
            <button type="button" aria-label="Dismiss success message" onClick={() => setSuccess('')} className="motion-interactive ml-auto shrink-0 hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Info Banner */}
        <div className="flex items-start gap-2.5 bg-blue-500/8 border border-blue-500/20 rounded-lg px-4 py-3 mb-5">
          <Shield className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Role presets are permission templates fetched from the server. Applying a preset to an admin instantly
            updates all their permissions to match the role. You can still fine-tune individual permissions afterward
            in the Admin Management page.
          </p>
        </div>

        {isSuperAdmin && (
          <Card className="mb-5 border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {editingRoleId === null ? 'Create custom role' : 'Edit custom role'}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Configure access by capability. System roles remain locked.
                  </p>
                </div>
                {editingRoleId !== null && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetRoleForm}>Cancel</Button>
                )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  Role name
                  <input
                    value={roleForm.name}
                    onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value }))}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900"
                    placeholder="e.g. Finance reviewer"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Description
                  <input
                    value={roleForm.description}
                    onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))}
                    className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900"
                    placeholder="What this role can do"
                  />
                </label>
              </div>
              <label className="mt-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                <input
                  type="checkbox"
                  checked={roleForm.is_super_admin}
                  onChange={(event) => setRoleForm((current) => ({ ...current, is_super_admin: event.target.checked }))}
                  className="h-4 w-4 accent-amber-600"
                />
                Super admin access
              </label>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {Array.from(new Set(PERMISSION_DEFINITIONS.map(({ group }) => group))).map((group) => (
                  <section key={group} className="rounded-xl border border-slate-200 p-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{group}</h3>
                    <div className="mt-2 space-y-2">
                      {PERMISSION_DEFINITIONS.filter((permission) => permission.group === group).map((permission) => (
                        <label key={permission.key} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions[permission.key]}
                            onChange={(event) => setRoleForm((current) => ({
                              ...current,
                              permissions: { ...current.permissions, [permission.key]: event.target.checked },
                            }))}
                            className="mt-0.5 h-4 w-4 accent-[#FF6B00]"
                          />
                          <span>
                            <span className="block text-xs font-semibold text-slate-800">{permission.label}</span>
                            <span className="block text-[11px] text-slate-500">{permission.description}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button type="button" onClick={saveRole} disabled={savingRole} className="bg-[#FF6B00] text-white hover:bg-[#E66000]">
                  {savingRole ? 'Saving...' : editingRoleId === null ? 'Create role' : 'Save changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading Skeletons */}
        {rolesLoading && (
          <div className="space-y-3" aria-busy="true" aria-label="Loading roles">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="motion-skeleton h-36 rounded-xl bg-card border border-border" />
            ))}
          </div>
        )}

        {/* Role Cards */}
        {!rolesLoading && (
          <div className="space-y-4">
            {roles.map((role) => {
              const colorCls = BADGE_COLORS[role.color] || BADGE_COLORS['blue'];
              const icon = ROLE_ICONS[role.name] ?? <Shield className="h-4 w-4 text-blue-400" />;

              return (
                <Card key={role.id} className="bg-card border-border">
                  <CardContent className="p-4">
                    {/* Role header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${colorCls}`}>
                        {icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground">{role.name}</span>
                          <Badge className={`text-[9px] px-1.5 py-0 h-4 border ${colorCls}`}>
                            {role.is_system ? 'SYSTEM' : 'CUSTOM'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{role.description}</p>
                      </div>
                    </div>

                    {/* Permission summary */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {role.permissions.is_super_admin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border bg-amber-500/15 border-amber-500/30 text-amber-400 text-[10px] font-medium">
                          <Crown className="h-2.5 w-2.5" /> Super Admin
                        </span>
                      )}
                      {PERMISSION_KEYS.map(({ key, label, color }) => (
                        <PermissionBadge
                          key={key}
                          active={role.permissions[key]}
                          label={label}
                          color={color}
                        />
                      ))}
                    </div>

                    {isSuperAdmin && !role.is_system && (
                      <Button type="button" variant="outline" size="sm" onClick={() => editRole(role)}>
                        Edit permissions
                      </Button>
                    )}

                    {/* Apply to admin — super admin only */}
                    {isSuperAdmin && (
                      adminsLoading ? (
                        <div className="motion-skeleton h-8 rounded-lg bg-muted/40" aria-label="Loading administrators" />
                      ) : activeAdmins.length > 0 ? (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                            Apply to admin
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {activeAdmins.map((admin) => {
                              const key = `${role.id}-${admin.id}`;
                              const isApplying = applying === key;
                              return (
                                <button
                                  key={admin.id}
                                  type="button"
                                  aria-label={`Apply ${role.name} role to ${admin.name || admin.telegram_username || `ID ${admin.telegram_id}`}`}
                                  onClick={() => applyRole(role, admin)}
                                  disabled={!!applying}
                                  className="motion-interactive flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border text-xs text-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                                >
                                  {isApplying ? (
                                    <div className="h-3 w-3 rounded-full border-2 border-slate-400 border-t-transparent motion-safe:animate-spin" aria-hidden="true" />
                                  ) : (
                                    <User className="h-3 w-3 text-muted-foreground" />
                                  )}
                                  {admin.name || admin.telegram_username || `ID: ${admin.telegram_id}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No active admins to apply this role to.</p>
                      )
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
