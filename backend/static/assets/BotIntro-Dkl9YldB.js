import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { f as useNavigate, a as reactExports, N as Navigate, L as Link } from "./router-vendor-N0qZPfHZ.js";
import { aV as PERMISSION_DEFINITIONS, aW as PERMISSION_KEYS, u as useAuth, aX as APP_DESCRIPTION, A as APP_NAME, x as SUPPORT_HANDLE, B as BrandLogo } from "./index-DKLUwC1a.js";
import { a1 as Check, u as Bot, i as LayoutDashboard, l as Wallet, j as CreditCard, F as FileText, _ as Building2, aA as ChartPie, s as Settings, d as ShieldCheck, H as House, G as ChevronRight, J as ChevronLeft } from "./utils-vendor-Bm5lXE_Q.js";
import "./ui-vendor-CXLHQPHT.js";
const platformOnlyPermissions = /* @__PURE__ */ new Set([
  "can_approve_topups",
  "can_credit_wallet",
  "can_debit_wallet",
  "can_freeze_wallet",
  "can_unfreeze_wallet"
]);
const ROLE_PERMISSION_PRESETS = {
  owner: new Set(PERMISSION_DEFINITIONS.filter(({ key }) => !platformOnlyPermissions.has(key)).map(({ key }) => key)),
  admin: new Set(PERMISSION_DEFINITIONS.filter(({ key }) => !platformOnlyPermissions.has(key)).map(({ key }) => key)),
  manager: /* @__PURE__ */ new Set(["can_manage_team", "can_manage_payments", "can_manage_disbursements", "can_view_reports", "can_manage_wallet", "can_manage_transactions"]),
  operator: /* @__PURE__ */ new Set(["can_manage_payments", "can_manage_disbursements", "can_manage_transactions"]),
  viewer: /* @__PURE__ */ new Set(["can_view_reports", "can_manage_transactions"]),
  developer: /* @__PURE__ */ new Set(["can_manage_bot"])
};
const ROLE_PERMISSION_MATRIX_PERMISSION_LABELS = {
  is_super_admin: "Super admin",
  can_manage_payments: "Payments",
  can_manage_disbursements: "Disbursements",
  can_view_reports: "Reports",
  can_manage_wallet: "Wallet",
  can_manage_transactions: "Transactions",
  can_manage_bot: "Bot settings",
  can_approve_topups: "Approvals / top-ups",
  can_manage_team: "Team management",
  can_credit_wallet: "Credit wallet",
  can_debit_wallet: "Debit wallet",
  can_freeze_wallet: "Freeze wallet",
  can_unfreeze_wallet: "Unfreeze wallet"
};
const ROLE_PERMISSION_MATRIX_PERMISSION_ORDER = [
  "is_super_admin",
  ...PERMISSION_DEFINITIONS.map(({ key }) => key)
];
function buildPresetPermissions(role) {
  const preset = ROLE_PERMISSION_PRESETS[role];
  const permissions = /* @__PURE__ */ new Set();
  preset == null ? void 0 : preset.forEach((entry) => permissions.add(entry));
  return ROLE_PERMISSION_MATRIX_PERMISSION_ORDER.filter((key) => key !== "is_super_admin" && permissions.has(key));
}
function buildSuperAdminPermissions() {
  return ROLE_PERMISSION_MATRIX_PERMISSION_ORDER.filter((key) => PERMISSION_KEYS.includes(key));
}
function getRolePermissionMatrixRoles() {
  return [
    {
      key: "owner",
      title: "Owner",
      description: "Organization owner permissions (no platform-only approvals).",
      permissions: buildPresetPermissions("owner")
    },
    {
      key: "admin",
      title: "Admin",
      description: "Full merchant dashboard permissions (no platform-only approvals).",
      permissions: buildPresetPermissions("admin")
    },
    {
      key: "manager",
      title: "Manager",
      description: "Operations manager: team + payments + disbursements + reports + wallet + transactions.",
      permissions: buildPresetPermissions("manager")
    },
    {
      key: "operator",
      title: "Operator",
      description: "Payments + disbursements + transactions.",
      permissions: buildPresetPermissions("operator")
    },
    {
      key: "viewer",
      title: "Viewer",
      description: "Read-only reporting and transaction review.",
      permissions: buildPresetPermissions("viewer")
    },
    {
      key: "developer",
      title: "Developer",
      description: "Bot settings and developer tools.",
      permissions: buildPresetPermissions("developer")
    },
    {
      key: "super_admin_system",
      title: "Super Admin (System)",
      description: "Platform super admin using the designated system wallet admin account.",
      permissions: buildSuperAdminPermissions(),
      notes: [
        "Required for platform-only queues like Payment approvals, Bank deposits, and Top-up requests.",
        "Wallet control actions (credit/debit/freeze/unfreeze) are restricted to the system account."
      ]
    },
    {
      key: "super_admin_non_system",
      title: "Super Admin (Non-system)",
      description: "Super admin account that is NOT the designated system wallet admin.",
      permissions: ["is_super_admin"],
      notes: [
        "Some pages still require the system super admin user (platform-only restrictions).",
        "Use the system account for approval queues and wallet-control actions."
      ]
    }
  ];
}
const BASE_COLUMNS = [
  { key: "can_manage_team", label: "Team" },
  { key: "can_manage_payments", label: "Payments" },
  { key: "can_manage_transactions", label: "Transactions" },
  { key: "can_manage_disbursements", label: "Disbursements" },
  { key: "can_manage_wallet", label: "Wallet" },
  { key: "can_view_reports", label: "Reports" },
  { key: "can_manage_bot", label: "Bot" }
];
const PLATFORM_COLUMNS = [
  { key: "is_super_admin", label: "Super admin" },
  { key: "can_approve_topups", label: "Approvals" },
  { key: "can_credit_wallet", label: "Credit" },
  { key: "can_debit_wallet", label: "Debit" },
  { key: "can_freeze_wallet", label: "Freeze" },
  { key: "can_unfreeze_wallet", label: "Unfreeze" }
];
function pill(label) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      className: "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-200",
      children: label
    },
    label
  );
}
function roleHas(role, permission) {
  return role.permissions.includes(permission);
}
function RolePermissionMatrix() {
  const roles = getRolePermissionMatrixRoles();
  const rolesWithNotes = roles.filter((role) => {
    var _a;
    return (((_a = role.notes) == null ? void 0 : _a.length) ?? 0) > 0;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-white/10 bg-white/[0.03] p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-slate-300", children: "Role-permission matrix" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: "This shows which permissions unlock each dashboard area. Some platform-only actions additionally require the designated system wallet admin account." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 sm:hidden", children: roles.map((role) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/[0.03] p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold text-white", children: role.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-relaxed text-slate-300", children: role.description })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-1.5", children: role.permissions.length === 0 ? pill("No dashboard permissions") : role.permissions.map((key) => pill(ROLE_PERMISSION_MATRIX_PERMISSION_LABELS[key] || key)) }),
      role.notes && role.notes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 list-disc space-y-1 pl-4 text-[11px] text-slate-400", children: role.notes.map((note) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: note }, note)) })
    ] }, role.key)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden sm:block", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid md:max-h-[60vh] md:overflow-auto md:grid-cols-[320px_minmax(0,1fr)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "border-b border-white/10 bg-[#0A0F1E] p-4 md:sticky md:top-0 md:border-b-0 md:border-r", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-slate-300", children: "Roles" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 space-y-3", children: roles.map((role) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-white", children: role.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] leading-relaxed text-slate-400", children: role.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: role.permissions.length === 0 ? pill("No dashboard permissions") : role.permissions.map((key) => pill(ROLE_PERMISSION_MATRIX_PERMISSION_LABELS[key] || key)) })
          ] }, role.key)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-[980px] w-full border-separate border-spacing-0 text-left text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("thead", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "sticky top-0 z-20 bg-[#0A0F1E] text-[10px] uppercase tracking-[0.16em] text-slate-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { colSpan: BASE_COLUMNS.length, className: "px-4 py-3 text-slate-300", children: "Dashboard access" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { colSpan: PLATFORM_COLUMNS.length, className: "px-4 py-3 text-slate-300", children: "Platform-only / system" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "sticky top-[36px] z-20 bg-[#0A0F1E] text-[11px] font-semibold text-slate-200", children: [
              BASE_COLUMNS.map((column) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "whitespace-nowrap px-3 py-3 text-center", children: column.label }, column.key)),
              PLATFORM_COLUMNS.map((column) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "whitespace-nowrap px-3 py-3 text-center", children: column.label }, column.key))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: roles.map((role) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-white/10", children: [
            BASE_COLUMNS.map((column) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-center align-middle", children: roleHas(role, column.key) ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center justify-center rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5", "aria-label": "Allowed" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "—" }) }, column.key)),
            PLATFORM_COLUMNS.map((column) => /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-center align-middle", children: roleHas(role, column.key) ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center justify-center rounded-full bg-amber-500/15 px-2 py-1 text-amber-200", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5", "aria-label": "Allowed" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "—" }) }, column.key))
          ] }, role.key)) })
        ] }) })
      ] }) }),
      rolesWithNotes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-slate-300", children: "Notes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid gap-3 md:grid-cols-2", children: rolesWithNotes.map((role) => {
          var _a;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-white", children: role.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 list-disc space-y-1 pl-4 text-[11px] text-slate-400", children: (_a = role.notes) == null ? void 0 : _a.map((note) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: note }, note)) })
          ] }, role.key);
        }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-amber-200", children: "Platform-only restrictions (important)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-2 list-disc space-y-1 pl-4 text-[11px] text-amber-100/90", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Payment approvals / Top-up requests: requires Super Admin + system wallet admin account." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Bank deposits: requires Super Admin + system wallet admin account." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Withdrawals: disbursement managers can view; only the system super admin can process approvals." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Wallet control actions (credit/debit/freeze/unfreeze): restricted to the system super admin + matching permission." })
      ] })
    ] })
  ] });
}
const TUTORIAL_STEPS = [
  {
    title: `Welcome to ${APP_NAME}`,
    description: APP_DESCRIPTION,
    icon: Bot,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15 border-blue-500/25",
    tips: [
      "This quick tour will show you where to find everything in the dashboard.",
      "Use the sidebar on the left to navigate between sections.",
      "The top bar includes a theme toggle and your account menu."
    ]
  },
  {
    title: "Dashboard — Your Overview",
    description: "The Dashboard is your home base. Get a quick summary of wallet balance, recent transactions, and key metrics at a glance.",
    icon: LayoutDashboard,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15 border-blue-500/25",
    route: "/",
    routeLabel: "Go to Dashboard",
    tips: [
      "The dashboard updates in real-time via WebSocket.",
      'Check the "Live" indicator in the top bar to confirm your connection status.'
    ]
  },
  {
    title: "Wallet — Manage Your Funds",
    description: "View your wallet balance, top up funds, and review your wallet transaction history.",
    icon: Wallet,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15 border-emerald-500/25",
    route: "/wallet",
    routeLabel: "Go to Wallet",
    tips: [
      "Keep your wallet funded to process payments smoothly.",
      "Admins can request top-ups from Super Admins."
    ]
  },
  {
    title: "Payments Hub — Accept Payments",
    description: "Create and manage payments using multiple methods: Invoice, QR Code, Alipay, WeChat Pay, Payment Links, Virtual Accounts, and E-Wallets.",
    icon: CreditCard,
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/15 border-purple-500/25",
    route: "/payments",
    routeLabel: "Go to Payments Hub",
    tips: [
      "Choose the right payment method for each transaction type.",
      "Links are shareable — send them directly via Telegram."
    ]
  },
  {
    title: "Transactions — Full History",
    description: "Browse every payment transaction. Filter by date, status, or type and export data for reconciliation.",
    icon: FileText,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/15 border-cyan-500/25",
    route: "/transactions",
    routeLabel: "Go to Transactions",
    tips: [
      "Use filters to quickly find specific transactions.",
      "Status badges show pending, completed, or failed payments."
    ]
  },
  {
    title: "Disbursements — Send Funds",
    description: "Disburse funds to recipients instantly. Manage batch payouts and track disbursement status.",
    icon: Building2,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15 border-amber-500/25",
    route: "/disbursements",
    routeLabel: "Go to Disbursements",
    tips: [
      "Ensure your wallet has sufficient balance before disbursing.",
      "Disbursements require approval based on your role permissions."
    ]
  },
  {
    title: "Reports — Analytics & Insights",
    description: "View charts and summary reports: revenue trends, transaction success rates, and payment method breakdowns.",
    icon: ChartPie,
    iconColor: "text-rose-400",
    iconBg: "bg-rose-500/15 border-rose-500/25",
    route: "/reports",
    routeLabel: "Go to Reports",
    tips: [
      "Reports can be filtered by date range.",
      "Use charts to identify peak payment periods."
    ]
  },
  {
    title: "Settings & Admin — System Controls",
    description: "Manage bot settings, configure messages, and (for Super Admins) handle admin accounts, KYC/KYB verifications, and USDT requests.",
    icon: Settings,
    iconColor: "text-muted-foreground",
    iconBg: "bg-slate-500/15 border-slate-500/25",
    route: "/bot-settings",
    routeLabel: "Go to Bot Settings",
    tips: [
      "Bot Settings lets you configure Telegram bot behavior.",
      "Super Admins see additional sections: Admin Management, USDT Requests, KYB/KYC."
    ]
  },
  {
    title: "Roles & Permissions — Access Matrix",
    description: "Review who can access each dashboard area and which actions require the designated system super admin account.",
    icon: ShieldCheck,
    iconColor: "text-amber-300",
    iconBg: "bg-amber-500/15 border-amber-500/25",
    tips: [
      "Use this matrix when assigning roles to staff.",
      "Keep platform-only approval queues limited to the system super admin account."
    ],
    content: /* @__PURE__ */ jsxRuntimeExports.jsx(RolePermissionMatrix, {})
  },
  {
    title: "You're All Set!",
    description: `You now know your way around ${APP_NAME}. Head to the main dashboard to get started, or explore any section from the sidebar at any time.`,
    icon: House,
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15 border-blue-500/25",
    route: "/",
    routeLabel: "Go to Dashboard",
    tips: [
      "You can revisit this tutorial anytime — it appears after every login.",
      `Need help? Contact support at ${SUPPORT_HANDLE}`
    ]
  }
];
function BotIntro() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = reactExports.useState(0);
  if (!loading && !user) return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/login", replace: true });
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-[#0A0F1E] flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-8 w-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" }) });
  }
  const current = TUTORIAL_STEPS[step];
  const Icon = current.icon;
  const total = TUTORIAL_STEPS.length;
  const isFirst = step === 0;
  const isLast = step === total - 1;
  const handleNext = () => {
    if (isLast) {
      navigate("/");
    } else {
      setStep((s) => s + 1);
    }
  };
  const handleBack = () => setStep((s) => Math.max(0, s - 1));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-[#0A0F1E] flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 overflow-hidden pointer-events-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-[-15%] left-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-3xl animate-pulse" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-3xl animate-pulse", style: { animationDelay: "1s" } })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { alt: APP_NAME, className: "h-8 w-8 rounded-lg" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-white hidden sm:block", children: APP_NAME })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to: "/",
          className: "text-muted-foreground hover:text-white text-xs font-medium transition-colors",
          children: "Skip tutorial →"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative z-10 h-1 bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "h-full bg-blue-500 transition-all duration-500",
        style: { width: `${(step + 1) / total * 100}%` }
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center gap-1.5 mb-8", children: TUTORIAL_STEPS.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setStep(i),
          className: `h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-blue-500" : i < step ? "w-3 bg-blue-700" : "w-3 bg-slate-700"}`,
          "aria-label": `Go to step ${i + 1}`
        },
        i
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-center text-muted-foreground text-xs mb-6 font-medium", children: [
        "Step ",
        step + 1,
        " of ",
        total
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 shadow-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-14 w-14 rounded-2xl border ${current.iconBg} flex items-center justify-center mb-6`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `h-7 w-7 ${current.iconColor}` }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold text-white mb-3", children: current.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-300 text-sm leading-relaxed mb-6", children: current.description }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 mb-8", children: current.tips.map((tip, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2.5 text-muted-foreground text-xs leading-relaxed", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 h-4 w-4 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400 font-semibold", style: { fontSize: "9px" }, children: i + 1 }),
          tip
        ] }, i)) }),
        current.content,
        current.route && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: current.route,
            className: "flex items-center justify-between w-full bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/25 text-blue-300 hover:text-blue-200 text-sm font-medium py-3 px-4 rounded-xl transition-all group mb-4",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: current.routeLabel }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 group-hover:translate-x-0.5 transition-transform" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-6 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleBack,
            disabled: isFirst,
            className: "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all disabled:opacity-30 disabled:cursor-not-allowed",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }),
              "Back"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: handleNext,
            className: "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/25",
            children: [
              isLast ? "Go to Dashboard" : "Next",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
            ]
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  BotIntro as default
};
