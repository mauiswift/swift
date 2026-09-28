import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { e as useNavigate, a as reactExports, N as Navigate, L as Link } from "./router-vendor-C2eKMart.js";
import { u as useAuth, H as APP_DESCRIPTION, A as APP_NAME, G as SUPPORT_HANDLE, B as BrandLogo } from "./index-fim1zet6.js";
import { j as Bot, aJ as LayoutDashboard, W as Wallet, b as CreditCard, aG as FileText, Y as Building2, aH as ChartPie, h as Settings, H as House, u as ChevronRight, v as ChevronLeft } from "./utils-vendor-B--1aD6k.js";
import "./ui-vendor-DsSOT9J9.js";
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
