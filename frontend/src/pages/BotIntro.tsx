import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Bot,
  BarChart3,
  Wallet,
  CreditCard,
  Check,
  FileText,
  Building2,
  PieChart,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Home,
  Send,
  ClipboardList,
  DollarSign,
  UserCheck,
  Settings,
} from 'lucide-react';
import { APP_NAME, APP_DESCRIPTION, SUPPORT_HANDLE } from '@/lib/brand';
import BrandLogo from '@/components/BrandLogo';
import { PERMISSION_DEFINITIONS, PERMISSION_KEYS, type PermissionKey } from '@/lib/permissions';
import { ROLE_PERMISSION_PRESETS } from '@/lib/adminRolePermissions';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  route?: string;
  routeLabel?: string;
  tips: string[];
  content?: React.ReactNode;
}

type MatrixRole = {
  key: string;
  title: string;
  description: string;
  permissions: PermissionKey[];
  notes?: string[];
};

const PERMISSION_LABELS: Record<PermissionKey, string> = {
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

const PERMISSION_ORDER: PermissionKey[] = [
  'is_super_admin',
  ...PERMISSION_DEFINITIONS.map(({ key }) => key),
];

function buildPresetPermissions(role: keyof typeof ROLE_PERMISSION_PRESETS): PermissionKey[] {
  const preset = ROLE_PERMISSION_PRESETS[role];
  const permissions = new Set<PermissionKey>();
  preset?.forEach((entry) => permissions.add(entry as PermissionKey));
  return PERMISSION_ORDER.filter((key) => key !== 'is_super_admin' && permissions.has(key));
}

function buildSuperAdminPermissions(): PermissionKey[] {
  return PERMISSION_ORDER.filter((key) => PERMISSION_KEYS.includes(key));
}

function RolePermissionMatrix() {
  const roles: MatrixRole[] = [
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

  const pill = (label: string) => (
    <span
      key={label}
      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-200"
    >
      {label}
    </span>
  );

  const baseColumns: Array<{ key: PermissionKey; label: string }> = [
    { key: 'can_manage_team', label: 'Team' },
    { key: 'can_manage_payments', label: 'Payments' },
    { key: 'can_manage_transactions', label: 'Transactions' },
    { key: 'can_manage_disbursements', label: 'Disbursements' },
    { key: 'can_manage_wallet', label: 'Wallet' },
    { key: 'can_view_reports', label: 'Reports' },
    { key: 'can_manage_bot', label: 'Bot' },
  ];

  const platformColumns: Array<{ key: PermissionKey; label: string }> = [
    { key: 'is_super_admin', label: 'Super admin' },
    { key: 'can_approve_topups', label: 'Approvals' },
    { key: 'can_credit_wallet', label: 'Credit' },
    { key: 'can_debit_wallet', label: 'Debit' },
    { key: 'can_freeze_wallet', label: 'Freeze' },
    { key: 'can_unfreeze_wallet', label: 'Unfreeze' },
  ];

  const roleHas = (role: MatrixRole, permission: PermissionKey) => role.permissions.includes(permission);
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
                : role.permissions.map((key) => pill(PERMISSION_LABELS[key] || key))}
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

      {/* Desktop: compact matrix table */}
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
                      : role.permissions.map((key) => pill(PERMISSION_LABELS[key] || key))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="lg:max-h-[60vh] lg:overflow-auto">
            <table className="min-w-[980px] w-full border-separate border-spacing-0 text-left text-xs">
              <thead>
                <tr className="sticky top-0 z-20 bg-[#0A0F1E] text-[10px] uppercase tracking-[0.16em] text-slate-300">
                  <th colSpan={baseColumns.length} className="px-4 py-3 text-slate-300">Dashboard access</th>
                  <th colSpan={platformColumns.length} className="px-4 py-3 text-slate-300">Platform-only / system</th>
                </tr>
                <tr className="sticky top-[36px] z-20 bg-[#0A0F1E] text-[11px] font-semibold text-slate-200">
                  {baseColumns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-3 py-3 text-center">{column.label}</th>
                  ))}
                  {platformColumns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-3 py-3 text-center">{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.key} className="border-t border-white/10">
                    {baseColumns.map((column) => (
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
                    {platformColumns.map((column) => (
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

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: `Welcome to ${APP_NAME}`,
    description: APP_DESCRIPTION,
    icon: Bot,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15 border-blue-500/25',
    tips: [
      'This quick tour will show you where to find everything in the dashboard.',
      'Use the sidebar on the left to navigate between sections.',
      'The top bar includes a theme toggle and your account menu.',
    ],
  },
  {
    title: 'Dashboard — Your Overview',
    description: 'The Dashboard is your home base. Get a quick summary of wallet balance, recent transactions, and key metrics at a glance.',
    icon: LayoutDashboard,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15 border-blue-500/25',
    route: '/',
    routeLabel: 'Go to Dashboard',
    tips: [
      'The dashboard updates in real-time via WebSocket.',
      'Check the "Live" indicator in the top bar to confirm your connection status.',
    ],
  },
  {
    title: 'Wallet — Manage Your Funds',
    description: 'View your wallet balance, top up funds, and review your wallet transaction history.',
    icon: Wallet,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/15 border-emerald-500/25',
    route: '/wallet',
    routeLabel: 'Go to Wallet',
    tips: [
      'Keep your wallet funded to process payments smoothly.',
      'Admins can request top-ups from Super Admins.',
    ],
  },
  {
    title: 'Payments Hub — Accept Payments',
    description: 'Create and manage payments using multiple methods: Invoice, QR Code, Alipay, WeChat Pay, Payment Links, Virtual Accounts, and E-Wallets.',
    icon: CreditCard,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/15 border-purple-500/25',
    route: '/payments',
    routeLabel: 'Go to Payments Hub',
    tips: [
      'Choose the right payment method for each transaction type.',
      'Links are shareable — send them directly via Telegram.',
    ],
  },
  {
    title: 'Transactions — Full History',
    description: 'Browse every payment transaction. Filter by date, status, or type and export data for reconciliation.',
    icon: FileText,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/15 border-cyan-500/25',
    route: '/transactions',
    routeLabel: 'Go to Transactions',
    tips: [
      'Use filters to quickly find specific transactions.',
      'Status badges show pending, completed, or failed payments.',
    ],
  },
  {
    title: 'Disbursements — Send Funds',
    description: 'Disburse funds to recipients instantly. Manage batch payouts and track disbursement status.',
    icon: Building2,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/15 border-amber-500/25',
    route: '/disbursements',
    routeLabel: 'Go to Disbursements',
    tips: [
      'Ensure your wallet has sufficient balance before disbursing.',
      'Disbursements require approval based on your role permissions.',
    ],
  },
  {
    title: 'Reports — Analytics & Insights',
    description: 'View charts and summary reports: revenue trends, transaction success rates, and payment method breakdowns.',
    icon: PieChart,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/15 border-rose-500/25',
    route: '/reports',
    routeLabel: 'Go to Reports',
    tips: [
      'Reports can be filtered by date range.',
      'Use charts to identify peak payment periods.',
    ],
  },
  {
    title: 'Settings & Admin — System Controls',
    description: 'Manage bot settings, configure messages, and (for Super Admins) handle admin accounts, KYC/KYB verifications, and USDT requests.',
    icon: Settings,
    iconColor: 'text-muted-foreground',
    iconBg: 'bg-slate-500/15 border-slate-500/25',
    route: '/bot-settings',
    routeLabel: 'Go to Bot Settings',
    tips: [
      'Bot Settings lets you configure Telegram bot behavior.',
      'Super Admins see additional sections: Admin Management, USDT Requests, KYB/KYC.',
    ],
  },
  {
    title: 'Roles & Permissions — Access Matrix',
    description: 'Review who can access each dashboard area and which actions require the designated system super admin account.',
    icon: ShieldCheck,
    iconColor: 'text-amber-300',
    iconBg: 'bg-amber-500/15 border-amber-500/25',
    tips: [
      'Use this matrix when assigning roles to staff.',
      'Keep platform-only approval queues limited to the system super admin account.',
    ],
    content: <RolePermissionMatrix />,
  },
  {
    title: "You're All Set!",
    description: `You now know your way around ${APP_NAME}. Head to the main dashboard to get started, or explore any section from the sidebar at any time.`,
    icon: Home,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/15 border-blue-500/25',
    route: '/',
    routeLabel: 'Go to Dashboard',
    tips: [
      'You can revisit this tutorial anytime — it appears after every login.',
      `Need help? Contact support at ${SUPPORT_HANDLE}`,
    ],
  },
];

export default function BotIntro() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  if (!loading && !user) return <Navigate to="/login" replace />;
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <span className="h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const current = TUTORIAL_STEPS[step];
  const Icon = current.icon;
  const total = TUTORIAL_STEPS.length;
  const isFirst = step === 0;
  const isLast = step === total - 1;

  const handleNext = () => {
    if (isLast) {
      navigate('/');
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen bg-[#0A0F1E] flex flex-col">
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo alt={APP_NAME} className="h-8 w-8 rounded-lg" />
          <p className="text-sm font-semibold text-white hidden sm:block">{APP_NAME}</p>
        </Link>
        <Link
          to="/"
          className="text-muted-foreground hover:text-white text-xs font-medium transition-colors"
        >
          Skip tutorial →
        </Link>
      </header>

      {/* Progress bar */}
      <div className="relative z-10 h-1 bg-muted">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${((step + 1) / total) * 100}%` }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-8">
            {TUTORIAL_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-blue-500' : i < step ? 'w-3 bg-blue-700' : 'w-3 bg-slate-700'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Step counter */}
          <p className="text-center text-muted-foreground text-xs mb-6 font-medium">
            Step {step + 1} of {total}
          </p>

          {/* Card */}
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
            {/* Icon */}
            <div className={`h-14 w-14 rounded-2xl border ${current.iconBg} flex items-center justify-center mb-6`}>
              <Icon className={`h-7 w-7 ${current.iconColor}`} />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-semibold text-white mb-3">{current.title}</h2>

            {/* Description */}
            <p className="text-slate-300 text-sm leading-relaxed mb-6">{current.description}</p>

            {/* Tips */}
            <div className="space-y-2 mb-8">
              {current.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 text-muted-foreground text-xs leading-relaxed">
                  <span className="mt-0.5 h-4 w-4 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400 font-semibold" style={{ fontSize: '9px' }}>
                    {i + 1}
                  </span>
                  {tip}
                </div>
              ))}
            </div>

            {current.content}

            {/* Page link */}
            {current.route && (
              <Link
                to={current.route}
                className="flex items-center justify-between w-full bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-300 hover:text-blue-200 text-sm font-medium py-3 px-4 rounded-xl transition-all group mb-4"
              >
                <span>{current.routeLabel}</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 gap-4">
            <button
              onClick={handleBack}
              disabled={isFirst}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/25"
            >
              {isLast ? 'Go to Dashboard' : 'Next'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
