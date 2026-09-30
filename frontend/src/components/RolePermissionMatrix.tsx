import { Check } from 'lucide-react';
import {
  getRolePermissionMatrixRoles,
  ROLE_PERMISSION_MATRIX_PERMISSION_LABELS,
  type RolePermissionMatrixRole,
} from '@/lib/rolePermissionMatrix';
import type { PermissionKey } from '@/lib/permissions';

type Column = { key: PermissionKey; label: string };

const BASE_COLUMNS: Column[] = [
  { key: 'can_manage_team', label: 'Team' },
  { key: 'can_manage_payments', label: 'Payments' },
  { key: 'can_manage_transactions', label: 'Transactions' },
  { key: 'can_manage_disbursements', label: 'Disbursements' },
  { key: 'can_manage_wallet', label: 'Wallet' },
  { key: 'can_view_reports', label: 'Reports' },
  { key: 'can_manage_bot', label: 'Bot' },
];

const PLATFORM_COLUMNS: Column[] = [
  { key: 'is_super_admin', label: 'Super admin' },
  { key: 'can_approve_topups', label: 'Approvals' },
  { key: 'can_credit_wallet', label: 'Credit' },
  { key: 'can_debit_wallet', label: 'Debit' },
  { key: 'can_freeze_wallet', label: 'Freeze' },
  { key: 'can_unfreeze_wallet', label: 'Unfreeze' },
];

function pill(label: string) {
  return (
    <span
      key={label}
      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-200"
    >
      {label}
    </span>
  );
}

function roleHas(role: RolePermissionMatrixRole, permission: PermissionKey) {
  return role.permissions.includes(permission);
}

export default function RolePermissionMatrix() {
  const roles = getRolePermissionMatrixRoles();
  const rolesWithNotes = roles.filter((role) => (role.notes?.length ?? 0) > 0);

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Role-permission matrix</p>
        <p className="mt-1 text-xs text-slate-400">
          This shows which permissions unlock each dashboard area. Some platform-only actions additionally require the designated system wallet admin account.
        </p>
      </div>

      {/* Mobile: role cards */}
      <div className="space-y-3 sm:hidden">
        {roles.map((role) => (
          <div key={role.key} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{role.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">{role.description}</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {role.permissions.length === 0
                ? pill('No dashboard permissions')
                : role.permissions.map((key) => pill(ROLE_PERMISSION_MATRIX_PERMISSION_LABELS[key] || key))}
            </div>

            {role.notes && role.notes.length > 0 && (
              <ul className="mt-3 list-disc space-y-1 pl-4 text-[11px] text-slate-400">
                {role.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: split view with independent scroll */}
      <div className="hidden sm:block">
        <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-b border-white/10 p-4 lg:border-b-0 lg:border-r lg:max-h-[60vh] lg:overflow-y-auto">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Roles</p>
            <div className="mt-3 space-y-3">
              {roles.map((role) => (
                <div key={role.key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-semibold text-white">{role.title}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{role.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {role.permissions.length === 0
                      ? pill('No dashboard permissions')
                      : role.permissions.map((key) => pill(ROLE_PERMISSION_MATRIX_PERMISSION_LABELS[key] || key))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="lg:max-h-[60vh] lg:overflow-auto">
            <table className="min-w-[980px] w-full border-separate border-spacing-0 text-left text-xs">
              <thead>
                <tr className="sticky top-0 z-20 bg-[#0A0F1E] text-[10px] uppercase tracking-[0.16em] text-slate-300">
                  <th colSpan={BASE_COLUMNS.length} className="px-4 py-3 text-slate-300">Dashboard access</th>
                  <th colSpan={PLATFORM_COLUMNS.length} className="px-4 py-3 text-slate-300">Platform-only / system</th>
                </tr>
                <tr className="sticky top-[36px] z-20 bg-[#0A0F1E] text-[11px] font-semibold text-slate-200">
                  {BASE_COLUMNS.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-3 py-3 text-center">{column.label}</th>
                  ))}
                  {PLATFORM_COLUMNS.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-3 py-3 text-center">{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.key} className="border-t border-white/10">
                    {BASE_COLUMNS.map((column) => (
                      <td key={column.key} className="px-3 py-3 text-center align-middle">
                        {roleHas(role, column.key) ? (
                          <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-200">
                            <Check className="h-3.5 w-3.5" aria-label="Allowed" />
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    ))}
                    {PLATFORM_COLUMNS.map((column) => (
                      <td key={column.key} className="px-3 py-3 text-center align-middle">
                        {roleHas(role, column.key) ? (
                          <span className="inline-flex items-center justify-center rounded-full bg-amber-500/15 px-2 py-1 text-amber-200">
                            <Check className="h-3.5 w-3.5" aria-label="Allowed" />
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {rolesWithNotes.length > 0 && (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Notes</p>
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              {rolesWithNotes.map((role) => (
                <div key={role.key} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-sm font-semibold text-white">{role.title}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-slate-400">
                    {role.notes?.map((note) => <li key={note}>{note}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
        <p className="text-xs font-semibold text-amber-200">Platform-only restrictions (important)</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-amber-100/90">
          <li>Payment approvals / Top-up requests: requires Super Admin + system wallet admin account.</li>
          <li>Bank deposits: requires Super Admin + system wallet admin account.</li>
          <li>Withdrawals: disbursement managers can view; only the system super admin can process approvals.</li>
          <li>Wallet control actions (credit/debit/freeze/unfreeze): restricted to the system super admin + matching permission.</li>
        </ul>
      </div>
    </div>
  );
}

