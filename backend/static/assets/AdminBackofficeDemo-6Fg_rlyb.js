import { j as jsxRuntimeExports } from "./query-vendor-DbSHy-Pt.js";
import { a as reactExports, u as useLocation, f as useNavigate, k as NavLink } from "./router-vendor-BtBWUifS.js";
import { a7 as CircleDollarSign, S as Send, L as Link2, f as Banknote, b as CreditCard, d as ShieldCheck, a6 as Activity, ao as Radio, K as ArrowUpRight, ap as ArrowDownLeft, F as Sparkles, aq as KeyRound, ar as LockKeyhole, as as BadgeCheck, n as ArrowRight, at as FilePlus2, a3 as Search, Z as ChevronDown, X, $ as Check, au as Copy, av as LayoutDashboard, w as LogOut, q as Menu, aw as ArrowLeft } from "./utils-vendor-Dj1Vigod.js";
import { R as ResponsiveContainer, X as XAxis, Y as YAxis, T as Tooltip, d as Cell } from "./index-CgvbpU93.js";
import { L as LineChart, C as CartesianGrid, a as Line, P as PieChart, b as Pie } from "./PieChart-BttWvkIn.js";
import "./ui-vendor-CliYdUyU.js";
const DEMO_ACCOUNTS = [
  { id: "super-admin", role: "Super Admin", email: "a.reyes@swiftpay.ph", password: "SwiftPay@2026!", name: "Andres Reyes" },
  { id: "sub-admin", role: "Sub-Admin", email: "m.concepcion@swiftpay.ph", password: "SubAdmin@2026!", name: "Maria Concepcion" },
  { id: "merchant-admin", role: "Merchant Admin", email: "p.lim@lazada.com.ph", password: "Merchant@2026!", name: "Patrick Lim" },
  { id: "agent", role: "Agent", email: "a.villanueva@swiftpay.ph", password: "Agent@2026!", name: "Ana Villanueva" }
];
const merchants = ["Lazada PH", "Northstar Retail", "Mabuhay Travel", "Harbor Eats", "Cebu Pacific Store", "Isla Essentials"];
const customers = [
  ["Sofia Santos", "sofia.santos@gmail.com"],
  ["Miguel Garcia", "miguel.garcia@gmail.com"],
  ["Isabella Cruz", "isabella.cruz@gmail.com"],
  ["Gabriel Reyes", "gabriel.reyes@gmail.com"],
  ["Camila Mendoza", "camila.mendoza@gmail.com"],
  ["Rafael Flores", "rafael.flores@gmail.com"],
  ["Amara Bautista", "amara.bautista@gmail.com"],
  ["Luis Navarro", "luis.navarro@gmail.com"]
];
const methods = ["GCash", "Maya", "QR Ph", "Visa", "BPI Online", "7-Eleven"];
const statuses = ["Paid", "Paid", "Paid", "Pending", "Paid", "Failed", "Expired"];
const types = ["Payment", "Payment link", "OTC"];
const createDemoOrders = () => Array.from({ length: 52 }, (_, index) => {
  const customer = customers[(index * 3 + 1) % customers.length];
  const hour = 8 + index * 5 % 12;
  const minute = index * 13 % 60;
  const date = new Date(2026, 9, 5 - index % 7, hour, minute);
  const timestamp = date.toISOString();
  return {
    id: `SWP-${String(20261001 + index).slice(2)}`,
    merchant: merchants[(index * 5 + 2) % merchants.length],
    customer: customer[0],
    email: customer[1],
    method: methods[(index * 5 + 1) % methods.length],
    amount: 249 + index * 1739 % 48351,
    currency: "PHP",
    type: types[index % types.length],
    status: statuses[index * 3 % statuses.length],
    createdAt: timestamp,
    updatedAt: new Date(date.getTime() + index % 9 * 6e4).toISOString(),
    risk: index % 13 === 0 ? "Review" : "Low"
  };
});
const demoVolume = [
  { day: "Mon", payments: 152e3, disbursements: 48e3 },
  { day: "Tue", payments: 198e3, disbursements: 61e3 },
  { day: "Wed", payments: 174e3, disbursements: 52e3 },
  { day: "Thu", payments: 246e3, disbursements: 77e3 },
  { day: "Fri", payments: 221e3, disbursements: 64e3 },
  { day: "Sat", payments: 289e3, disbursements: 91e3 },
  { day: "Sun", payments: 264e3, disbursements: 83e3 }
];
const demoPaymentMethods = [
  { name: "GCash", value: 38, color: "#30c78b" },
  { name: "Maya", value: 24, color: "#8bd7b5" },
  { name: "QR Ph", value: 18, color: "#6ba2f7" },
  { name: "Cards", value: 12, color: "#a78bfa" },
  { name: "Other", value: 8, color: "#52627a" }
];
const formatPeso = (amount) => `₱${amount.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
const formatDemoDate = (value) => new Date(value).toLocaleString("en-PH", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});
const cardData = [
  { label: "Transaction volume", value: "₱1.54M", change: "+12.8%", icon: CircleDollarSign, accent: "text-emerald-300 bg-emerald-300/10" },
  { label: "Disbursements", value: "₱476.2K", change: "+8.2%", icon: Send, accent: "text-sky-300 bg-sky-300/10" },
  { label: "Payment links", value: "148", change: "+16.4%", icon: Link2, accent: "text-violet-300 bg-violet-300/10" },
  { label: "OTC activity", value: "86", change: "+4.6%", icon: Banknote, accent: "text-amber-300 bg-amber-300/10" },
  { label: "Transactions", value: "2,481", change: "+10.1%", icon: CreditCard, accent: "text-teal-300 bg-teal-300/10" },
  { label: "Success rate", value: "98.42%", change: "+0.7%", icon: ShieldCheck, accent: "text-lime-300 bg-lime-300/10" },
  { label: "API availability", value: "99.98%", change: "All systems go", icon: Activity, accent: "text-cyan-300 bg-cyan-300/10" },
  { label: "Webhook delivery", value: "99.7%", change: "24ms avg. latency", icon: Radio, accent: "text-green-300 bg-green-300/10" }
];
const healthServices = [
  { name: "Payments API", detail: "Operational", latency: "42 ms" },
  { name: "Webhook delivery", detail: "Operational", latency: "24 ms" },
  { name: "Xendit gateway", detail: "Operational", latency: "118 ms" },
  { name: "PayMongo gateway", detail: "Operational", latency: "96 ms" }
];
function Panel({ children, className = "" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: `rounded-2xl border border-white/[0.07] bg-[#0d1b16] ${className}`, children });
}
function DemoDashboard({
  orders,
  operatorName,
  onTransactions
}) {
  const recentOrders = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col justify-between gap-4 sm:flex-row sm:items-end", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.19em] text-emerald-300", children: "Overview / Philippines" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl", children: [
          "Good morning, ",
          operatorName.split(" ")[0]
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Here's what's happening across your payment operations." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 self-start rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-slate-300 sm:self-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-400" }),
        " Live overview ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600", children: "·" }),
        " Last 7 days"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { "aria-label": "Key performance indicators", className: "grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4", children: cardData.map((card) => {
      const Icon = card.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "rounded-2xl border border-white/[0.07] bg-[#0d1b16] p-4 transition hover:border-emerald-300/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-400", children: card.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `flex h-8 w-8 items-center justify-center rounded-lg ${card.accent}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 text-2xl font-semibold tracking-tight text-white", children: card.value }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 flex items-center gap-1 text-[11px] font-medium text-emerald-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { size: 13 }),
          card.change,
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-1 font-normal text-slate-500", children: "vs last week" })
        ] })
      ] }, card.label);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 xl:grid-cols-[1.65fr_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Panel, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-white", children: "7-day transaction volume" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Payments and disbursements · PHP" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 text-[11px] text-slate-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "h-2 w-2 rounded-full bg-emerald-300" }),
              " Payments"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "h-2 w-2 rounded-full bg-teal-700" }),
              " Disbursements"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 h-[260px] w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: demoVolume, margin: { top: 8, right: 8, left: -14, bottom: 0 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { stroke: "rgba(148,163,184,0.12)", vertical: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "day", tick: { fill: "#82918a", fontSize: 11 }, axisLine: false, tickLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            YAxis,
            {
              tick: { fill: "#82918a", fontSize: 10 },
              axisLine: false,
              tickLine: false,
              tickFormatter: (value) => `₱${Math.round(value / 1e3)}k`
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tooltip,
            {
              contentStyle: { background: "#12231c", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "#f8fafc", fontSize: 12 },
              formatter: (value) => [formatPeso(value), ""],
              labelStyle: { color: "#a7b5ad", marginBottom: 4 }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "payments", name: "Payments", stroke: "#54e2a1", strokeWidth: 2.5, dot: { r: 3, fill: "#54e2a1", strokeWidth: 0 }, activeDot: { r: 5 } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "disbursements", name: "Disbursements", stroke: "#15805e", strokeWidth: 2, dot: { r: 2.5, fill: "#15805e", strokeWidth: 0 } })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Panel, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-white", children: "Payment method mix" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Share of successful payments" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-2 h-[190px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(PieChart, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pie, { data: demoPaymentMethods, dataKey: "value", nameKey: "name", innerRadius: 56, outerRadius: 82, paddingAngle: 3, stroke: "none", children: demoPaymentMethods.map((method) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: method.color }, method.name)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Tooltip,
              {
                contentStyle: { background: "#12231c", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "#f8fafc", fontSize: 12 },
                formatter: (value) => [`${value}%`, "Volume share"]
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none absolute inset-0 flex flex-col items-center justify-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-semibold text-white", children: "5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-slate-500", children: "methods" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-x-3 gap-y-2", children: demoPaymentMethods.map((method) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 text-[11px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex min-w-0 items-center gap-2 text-slate-400", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "h-2 w-2 shrink-0 rounded-full", style: { background: method.color } }),
            method.name
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-medium text-slate-200", children: [
            method.value,
            "%"
          ] })
        ] }, method.name)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 xl:grid-cols-[1.65fr_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Panel, { className: "overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-white/[0.06] px-5 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-white", children: "Recent transactions" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Latest activity across your merchants" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onTransactions, className: "text-xs font-semibold text-emerald-300 hover:text-emerald-200", children: "View all →" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[640px] text-left text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-[10px] uppercase tracking-wider text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: ["Order", "Merchant", "Method", "Amount", "Status"].map((heading) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3 font-medium", children: heading }, heading)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: recentOrders.map((order) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-white/[0.05]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block font-medium text-slate-200", children: order.id }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block text-[10px] text-slate-500", children: formatDemoDate(order.createdAt) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-slate-300", children: order.merchant }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 text-slate-400", children: order.method }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3 font-medium text-white", children: formatPeso(order.amount) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-1 text-[10px] font-semibold ${order.status === "Paid" ? "bg-emerald-300/10 text-emerald-300" : order.status === "Pending" ? "bg-amber-300/10 text-amber-200" : "bg-rose-300/10 text-rose-300"}`, children: order.status }) })
          ] }, order.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Panel, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-white", children: "System health" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "Core services · demo telemetry" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-300" }),
            " All operational"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 space-y-1", children: healthServices.map((service) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 border-t border-white/[0.05] py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs font-medium text-slate-200", children: service.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-[10px] text-emerald-300/75", children: service.detail })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-[10px] text-slate-500", children: service.latency })
        ] }, service.name)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[10px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: "API uptime, last 30 days" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-emerald-300", children: "99.98%" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2 text-[10px] text-slate-600", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownLeft, { size: 12 }),
      " Metrics shown are illustrative sample data for this demo workspace."
    ] })
  ] });
}
function DemoLogin({ onLogin }) {
  const [selectedAccountId, setSelectedAccountId] = reactExports.useState(null);
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [error, setError] = reactExports.useState("");
  const autofillAccount = (account) => {
    setSelectedAccountId(account.id);
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  };
  const submit = (event) => {
    event.preventDefault();
    const account = DEMO_ACCOUNTS.find((candidate) => candidate.email === email.trim().toLowerCase() && candidate.password === password);
    if (!account) {
      setError("Those credentials do not match a demo account. Choose a role below to autofill.");
      return;
    }
    onLogin(account);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex min-h-screen items-center justify-center bg-[#07120f] px-4 py-10 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1915] shadow-2xl lg:grid-cols-[1.1fr_0.9fr]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative hidden min-h-[690px] flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.18),transparent_38%),linear-gradient(145deg,#0c1c17,#09130f)] p-12 lg:flex", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-24 -top-24 h-80 w-80 rounded-full border border-emerald-300/10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -right-10 -top-10 h-52 w-52 rounded-full border border-emerald-300/10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-[#07120f]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-black", children: "S" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold tracking-tight", children: "SwiftPay" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-emerald-200/60", children: "ADMIN BACKOFFICE" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-24 max-w-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/5 px-3 py-1.5 text-xs font-medium text-emerald-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { size: 14 }),
            " Philippines payments operations"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-5xl font-semibold leading-[1.08] tracking-tight", children: "Your payment operations, in focus." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 max-w-md text-base leading-7 text-slate-400", children: "A guided preview of the SwiftPay enterprise control room for merchants, transactions, and platform health." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative grid grid-cols-2 gap-3", children: [
        [ShieldCheck, "HMAC-signed webhooks", "Tamper-evident event delivery"],
        [KeyRound, "Role-based access", "Four operational permission tiers"],
        [LockKeyhole, "Secure by design", "Protected production authentication"],
        [BadgeCheck, "Audit-ready activity", "Clear status and event history"]
      ].map(([Icon, title, subtitle]) => {
        const FeatureIcon = Icon;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureIcon, { className: "h-4 w-4 text-emerald-300" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm font-semibold", children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: subtitle })
        ] }, title);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "flex items-center justify-center p-6 sm:p-10 lg:p-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8 lg:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold", children: [
        "SwiftPay ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-300", children: "Backoffice" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300", children: "Demo environment" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-3 text-3xl font-semibold tracking-tight", children: "Sign in to your workspace" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-400", children: "Choose a role to autofill its demo credentials." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-7 grid grid-cols-2 gap-2", children: DEMO_ACCOUNTS.map((account) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => autofillAccount(account),
          className: `rounded-xl border px-3 py-3 text-left transition ${selectedAccountId === account.id ? "border-emerald-300/50 bg-emerald-300/10 text-white" : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20"}`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs font-semibold", children: account.role }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block truncate text-[10px] text-slate-500", children: account.email })
          ]
        },
        account.id
      )) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "mt-6 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-2 block text-xs font-medium text-slate-300", children: "Work email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "email",
              autoComplete: "username",
              value: email,
              onChange: (event) => {
                setEmail(event.target.value);
                setError("");
              },
              className: "h-12 w-full rounded-xl border border-white/10 bg-[#08120f] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10",
              placeholder: "name@company.com"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-2 block text-xs font-medium text-slate-300", children: "Password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "password",
              autoComplete: "current-password",
              value: password,
              onChange: (event) => {
                setPassword(event.target.value);
                setError("");
              },
              className: "h-12 w-full rounded-xl border border-white/10 bg-[#08120f] px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10",
              placeholder: "Enter demo password"
            }
          )
        ] }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "text-sm text-rose-300", children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 text-sm font-bold text-[#06110d] transition hover:bg-emerald-300", children: [
          "Enter demo workspace ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 16 })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[0.05] p-3 text-xs leading-5 text-amber-100/70", children: "Demo only: this login is simulated in your browser. It does not authenticate against or grant access to production SwiftPay." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-center text-[11px] text-slate-600", children: "Illustrative data · no real payments are processed" })
    ] }) })
  ] }) });
}
const paymentMethods = ["GCash", "Maya", "QR Ph", "Visa", "BPI Online", "7-Eleven"];
const columns = [
  { key: "id", label: "Order ID" },
  { key: "merchant", label: "Merchant" },
  { key: "customer", label: "Customer" },
  { key: "method", label: "Payment method" },
  { key: "amount", label: "Amount" },
  { key: "type", label: "Type" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created" },
  { key: "updatedAt", label: "Updated" },
  { key: "risk", label: "Risk" }
];
function StatusBadge({ status }) {
  const style = status === "Paid" ? "bg-emerald-300/10 text-emerald-300" : status === "Pending" ? "bg-amber-300/10 text-amber-200" : "bg-rose-300/10 text-rose-300";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${style}`, children: status });
}
function CreateOrderModal({ onClose, onCreate }) {
  const [customer, setCustomer] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [merchant, setMerchant] = reactExports.useState("Lazada PH");
  const [amount, setAmount] = reactExports.useState("");
  const [method, setMethod] = reactExports.useState(paymentMethods[0]);
  const [error, setError] = reactExports.useState("");
  const submit = (event) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!customer.trim() || !email.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a customer, a valid email, and an amount greater than zero.");
      return;
    }
    onCreate({
      merchant,
      customer: customer.trim(),
      email: email.trim(),
      method,
      amount: parsedAmount,
      currency: "PHP",
      type: "Payment",
      status: "Pending",
      risk: "Low"
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm", onMouseDown: (event) => {
    if (event.target === event.currentTarget) onClose();
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { role: "dialog", "aria-modal": "true", "aria-labelledby": "create-demo-order-title", className: "w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1b16] p-5 shadow-2xl sm:p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-emerald-300", children: "New payment" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "create-demo-order-title", className: "mt-1 text-lg font-semibold text-white", children: "Create order" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: "Creates a local sample order only." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Close", onClick: onClose, className: "rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 17 }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "mt-5 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-slate-300", children: [
        "Merchant",
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: merchant, onChange: (event) => setMerchant(event.target.value), className: "mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-white outline-none focus:border-emerald-300/50", children: ["Lazada PH", "Northstar Retail", "Mabuhay Travel", "Harbor Eats", "Cebu Pacific Store", "Isla Essentials"].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: item }, item)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-slate-300", children: [
          "Customer name",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: customer, onChange: (event) => setCustomer(event.target.value), className: "mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-white outline-none focus:border-emerald-300/50", placeholder: "Juan dela Cruz" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-slate-300", children: [
          "Customer email",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), className: "mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-white outline-none focus:border-emerald-300/50", placeholder: "juan@example.ph" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-slate-300", children: [
          "Amount (PHP)",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: "1", step: "0.01", value: amount, onChange: (event) => setAmount(event.target.value), className: "mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-white outline-none focus:border-emerald-300/50", placeholder: "1500.00" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-slate-300", children: [
          "Payment method",
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: method, onChange: (event) => setMethod(event.target.value), className: "mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#08120f] px-3 text-sm text-white outline-none focus:border-emerald-300/50", children: paymentMethods.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: item }, item)) })
        ] })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "text-xs text-rose-300", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 border-t border-white/[0.07] pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "rounded-lg border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5", children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", className: "inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2.5 text-xs font-bold text-[#07120f] hover:bg-emerald-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FilePlus2, { size: 15 }),
          " Create sample order"
        ] })
      ] })
    ] })
  ] }) });
}
function OrderDrawer({ order, onClose }) {
  const [showSignature, setShowSignature] = reactExports.useState(false);
  const [signatureCopyError, setSignatureCopyError] = reactExports.useState("");
  const signature = `sha256=${Array.from({ length: 32 }, (_, index) => (order.id.charCodeAt(index % order.id.length) * (index + 17) % 16).toString(16)).join("")}`;
  const copySignature = () => {
    if (!navigator.clipboard) {
      setSignatureCopyError("Clipboard access is unavailable. Select and copy the signature value instead.");
      return;
    }
    void navigator.clipboard.writeText(signature).then(
      () => setSignatureCopyError(""),
      () => setSignatureCopyError("Clipboard access is unavailable. Select and copy the signature value instead.")
    );
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-40 bg-black/60", onMouseDown: (event) => {
    if (event.target === event.currentTarget) onClose();
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { role: "dialog", "aria-modal": "true", "aria-labelledby": "order-drawer-title", className: "absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-white/10 bg-[#0b1712] shadow-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between border-b border-white/[0.07] p-5 sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-emerald-300", children: "Order detail · demo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "order-drawer-title", className: "mt-1 font-mono text-lg font-semibold text-white", children: order.id })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Close details", onClick: onClose, className: "rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 17 }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-6 overflow-y-auto p-5 sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-400", children: "Order amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xl font-semibold text-white", children: formatPeso(order.amount) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [
            order.currency,
            " · ",
            order.method
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: order.status })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Order information" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("dl", { className: "mt-3 grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl border border-white/[0.06] p-4", children: [["Merchant", order.merchant], ["Customer", order.customer], ["Email", order.email], ["Type", order.type], ["Created", formatDemoDate(order.createdAt)], ["Last updated", formatDemoDate(order.updatedAt)]].map(([label, value]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-[10px] text-slate-500", children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-1 break-words text-xs font-medium text-slate-200", children: value })
        ] }, label)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-slate-400", children: "HMAC signature" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-slate-500", children: "Illustrative signature · not cryptographically verified" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 16, className: "text-emerald-300" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-xl border border-emerald-300/10 bg-emerald-300/[0.035] p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 13 }),
              " Sample signature present"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowSignature((visible) => !visible), className: "text-[10px] font-semibold text-slate-400 hover:text-white", children: showSignature ? "Hide value" : "View value" })
          ] }),
          showSignature && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex gap-2 rounded-lg border border-white/[0.06] bg-[#07110d] p-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "min-w-0 flex-1 break-all text-[10px] leading-5 text-slate-300", children: signature }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: copySignature, "aria-label": "Copy sample signature", className: "h-fit rounded p-1 text-slate-500 hover:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 13 }) })
          ] }),
          signatureCopyError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "mt-2 text-[10px] text-rose-300", children: signatureCopyError })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-slate-400", children: "Webhook event log" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-white/[0.05] px-2 py-1 text-[9px] text-slate-500", children: "Sample events" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "mt-3 space-y-0 border-l border-white/10 pl-4", children: [
          ["order.created", order.createdAt, "Order registered in demo environment"],
          ...order.status === "Paid" ? [["payment.succeeded", order.updatedAt, "Payment marked successful (sample)"]] : [["payment.pending", order.updatedAt, `Payment status: ${order.status.toLowerCase()} (sample)`]],
          ["webhook.delivered", order.updatedAt, "Event delivery simulated"]
        ].map(([event, time, description]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "relative pb-4 last:pb-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0b1712] bg-emerald-300" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[10px] font-medium text-emerald-200", children: event }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-slate-400", children: description }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[9px] text-slate-600", children: formatDemoDate(time) })
        ] }, event)) })
      ] })
    ] })
  ] }) });
}
function DemoTransactions({
  orders,
  onCreateOrder
}) {
  const [search, setSearch] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("All statuses");
  const [methodFilter, setMethodFilter] = reactExports.useState("All methods");
  const [sortKey, setSortKey] = reactExports.useState("createdAt");
  const [sortDescending, setSortDescending] = reactExports.useState(true);
  const [selectedOrder, setSelectedOrder] = reactExports.useState(null);
  const [showCreateModal, setShowCreateModal] = reactExports.useState(false);
  const filteredOrders = reactExports.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch = !needle || [order.id, order.merchant, order.customer, order.email, order.method].some((value) => value.toLowerCase().includes(needle));
      return matchesSearch && (statusFilter === "All statuses" || order.status === statusFilter) && (methodFilter === "All methods" || order.method === methodFilter);
    }).sort((first, second) => {
      const left = first[sortKey];
      const right = second[sortKey];
      const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right));
      return sortDescending ? -comparison : comparison;
    });
  }, [orders, search, statusFilter, methodFilter, sortKey, sortDescending]);
  const handleSort = (key) => {
    if (sortKey === key) setSortDescending((descending) => !descending);
    else {
      setSortKey(key);
      setSortDescending(false);
    }
  };
  const createOrder = (order) => {
    onCreateOrder(order);
    setShowCreateModal(false);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col justify-between gap-4 sm:flex-row sm:items-end", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.19em] text-emerald-300", children: "Operations / Payments" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl", children: "Transactions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Review and manage Philippine payment activity." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setShowCreateModal(true), className: "inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-emerald-400 px-4 text-xs font-bold text-[#07120f] transition hover:bg-emerald-300 sm:self-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(FilePlus2, { size: 15 }),
        " Create order"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d1b16]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 border-b border-white/[0.06] p-4 lg:flex-row lg:items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "relative min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 15, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (event) => setSearch(event.target.value), placeholder: "Search order, merchant, customer...", className: "h-10 w-full rounded-lg border border-white/[0.08] bg-[#08120f] pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/40" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "relative flex-1 lg:flex-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Filter status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), className: "h-10 w-full appearance-none rounded-lg border border-white/[0.08] bg-[#08120f] px-3 pr-8 text-xs text-slate-300 outline-none lg:w-36", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "All statuses" }),
              ["Paid", "Pending", "Failed", "Expired"].map((status) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: status }, status))
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 13, className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "relative flex-1 lg:flex-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Filter payment method" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: methodFilter, onChange: (event) => setMethodFilter(event.target.value), className: "h-10 w-full appearance-none rounded-lg border border-white/[0.08] bg-[#08120f] px-3 pr-8 text-xs text-slate-300 outline-none lg:w-40", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: "All methods" }),
              paymentMethods.map((method) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { children: method }, method))
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 13, className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 py-3 text-[10px] text-slate-500 sm:px-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Showing ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "font-semibold text-slate-300", children: filteredOrders.length }),
          " of ",
          orders.length,
          " sample orders"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-300" }),
          " Demo data"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[1330px] text-left text-[11px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-y border-white/[0.05] bg-white/[0.02] text-[9px] uppercase tracking-wider text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: columns.map((column) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { scope: "col", className: "whitespace-nowrap px-4 py-3 font-semibold", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => handleSort(column.key), className: "inline-flex items-center gap-1 hover:text-slate-200", children: [
          column.label,
          sortKey === column.key && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-300", children: sortDescending ? "↓" : "↑" })
        ] }) }, column.key)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          filteredOrders.map((order) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { onClick: () => setSelectedOrder(order), className: "cursor-pointer border-b border-white/[0.045] transition hover:bg-white/[0.025]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-3.5 font-mono font-medium text-emerald-200", children: order.id }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-3.5 text-slate-300", children: order.merchant }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block whitespace-nowrap text-slate-300", children: order.customer }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 block whitespace-nowrap text-[9px] text-slate-600", children: order.email })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-3.5 text-slate-300", children: order.method }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-3.5 font-medium text-white", children: formatPeso(order.amount) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-3.5 text-slate-400", children: order.type }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-3.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: order.status }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-3.5 text-slate-400", children: formatDemoDate(order.createdAt) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-3.5 text-slate-400", children: formatDemoDate(order.updatedAt) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "whitespace-nowrap px-4 py-3.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-1 text-[9px] ${order.risk === "Low" ? "bg-emerald-300/10 text-emerald-300" : "bg-amber-300/10 text-amber-200"}`, children: order.risk }) })
          ] }, order.id)),
          !filteredOrders.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 10, className: "px-4 py-16 text-center text-sm text-slate-500", children: "No sample orders match the selected filters." }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t border-white/[0.05] px-4 py-3 text-[10px] text-slate-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sample workspace · 52 initial orders" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sort any column · select an order for details" })
      ] })
    ] }),
    selectedOrder && /* @__PURE__ */ jsxRuntimeExports.jsx(OrderDrawer, { order: selectedOrder, onClose: () => setSelectedOrder(null) }),
    showCreateModal && /* @__PURE__ */ jsxRuntimeExports.jsx(CreateOrderModal, { onClose: () => setShowCreateModal(false), onCreate: createOrder })
  ] });
}
const DEMO_ROLE_STORAGE_KEY = "swiftpay_admin_demo_role";
function AdminBackofficeDemo() {
  const location = useLocation();
  const navigate = useNavigate();
  const [account, setAccount] = reactExports.useState(() => {
    const roleId = window.sessionStorage.getItem(DEMO_ROLE_STORAGE_KEY);
    return DEMO_ACCOUNTS.find((candidate) => candidate.id === roleId) ?? null;
  });
  const [orders, setOrders] = reactExports.useState(createDemoOrders);
  const [mobileNavOpen, setMobileNavOpen] = reactExports.useState(false);
  const isLoginPage = location.pathname === "/admin-demo" || location.pathname === "/admin-demo/";
  reactExports.useEffect(() => {
    if (account && isLoginPage) navigate("/admin-demo/dashboard", { replace: true });
    if (!account && !isLoginPage) navigate("/admin-demo", { replace: true });
  }, [account, isLoginPage, navigate]);
  const signIn = (nextAccount) => {
    window.sessionStorage.setItem(DEMO_ROLE_STORAGE_KEY, nextAccount.id);
    setAccount(nextAccount);
    navigate("/admin-demo/dashboard", { replace: true });
  };
  const signOut = () => {
    window.sessionStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
    setAccount(null);
    setMobileNavOpen(false);
    navigate("/admin-demo", { replace: true });
  };
  const createOrder = (order) => {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    setOrders((previous) => [{
      ...order,
      id: `SWP-${String(261001 + previous.length).padStart(6, "0")}`,
      createdAt: now,
      updatedAt: now
    }, ...previous]);
  };
  if (!account) return /* @__PURE__ */ jsxRuntimeExports.jsx(DemoLogin, { onLogin: signIn });
  const activePage = location.pathname.endsWith("/transactions") ? "transactions" : "dashboard";
  const navItems = [
    { to: "/admin-demo/dashboard", label: "Dashboard", icon: LayoutDashboard, page: "dashboard" },
    { to: "/admin-demo/transactions", label: "Transactions", icon: Activity, page: "transactions" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-[#07120f] text-white", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/[0.06] bg-[#0a1511] lg:flex", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-[72px] items-center gap-3 border-b border-white/[0.06] px-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400 text-[#07120f]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-black", children: "S" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold tracking-tight", children: "SwiftPay" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-semibold tracking-[0.17em] text-emerald-300/75", children: "ADMIN BACKOFFICE" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-4 mt-5 rounded-xl border border-amber-300/10 bg-amber-300/[0.045] px-3 py-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-bold uppercase tracking-[0.13em] text-amber-200", children: "Demo workspace" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-slate-500", children: "Illustrative data only" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { "aria-label": "Demo navigation", className: "mt-6 space-y-1 px-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.17em] text-slate-600", children: "Workspace" }),
        navItems.map((item) => {
          const Icon = item.icon;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(NavLink, { to: item.to, className: ({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${isActive ? "bg-emerald-300/10 text-emerald-200" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 16 }),
            item.label
          ] }, item.to);
        })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-auto border-t border-white/[0.06] p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 rounded-xl p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-emerald-300/10 text-xs font-bold text-emerald-200", children: account.name.split(" ").map((part) => part[0]).join("") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs font-semibold text-slate-200", children: account.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-[10px] text-slate-500", children: account.role })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: signOut, title: "Sign out of demo", "aria-label": "Sign out of demo", className: "rounded-md p-2 text-slate-500 hover:bg-white/5 hover:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { size: 14 }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-20 border-b border-white/[0.06] bg-[#09140f]/95 px-4 backdrop-blur lg:ml-64 lg:px-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-[64px] items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Toggle navigation", onClick: () => setMobileNavOpen((open) => !open), className: "rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden", children: mobileNavOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 18 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { size: 18 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-slate-500", children: [
            "SwiftPay ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1 text-slate-700", children: "/" }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: activePage === "transactions" ? "Transactions" : "Dashboard" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "hidden items-center gap-1.5 rounded-full border border-emerald-300/10 bg-emerald-300/[0.04] px-2.5 py-1.5 text-[10px] text-emerald-200 sm:inline-flex", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-emerald-300" }),
            " Demo session"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-8 w-8 items-center justify-center rounded-full bg-emerald-300/10 text-[10px] font-bold text-emerald-200 lg:hidden", children: account.name.split(" ").map((part) => part[0]).join("") })
        ] })
      ] }),
      mobileNavOpen && /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { "aria-label": "Mobile demo navigation", className: "space-y-1 border-t border-white/[0.06] py-3 lg:hidden", children: [
        navItems.map((item) => {
          const Icon = item.icon;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(NavLink, { to: item.to, onClick: () => setMobileNavOpen(false), className: ({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs ${isActive ? "bg-emerald-300/10 text-emerald-200" : "text-slate-400"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 15 }),
            item.label
          ] }, item.to);
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: signOut, className: "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs text-slate-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { size: 15 }),
          "Sign out of demo"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-[1560px] px-4 py-6 sm:px-6 lg:ml-64 lg:px-8 lg:py-8", children: [
      activePage === "transactions" ? /* @__PURE__ */ jsxRuntimeExports.jsx(DemoTransactions, { orders, onCreateOrder: createOrder }) : /* @__PURE__ */ jsxRuntimeExports.jsx(DemoDashboard, { orders, operatorName: account.name, onTransactions: () => navigate("/admin-demo/transactions") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.05] pt-4 text-[10px] text-slate-600", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 12 }),
          " Demo interface only · Authentication is simulated"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => navigate("/"), className: "inline-flex items-center gap-1 hover:text-slate-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { size: 12 }),
          " Return to SwiftPay"
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminBackofficeDemo as default
};
