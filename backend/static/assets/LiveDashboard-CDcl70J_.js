import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { a as reactExports, N as Navigate, L as Link } from "./router-vendor-N0qZPfHZ.js";
import { u as useAuth, v as useCollectionCurrency, i as client, a2 as usePaymentEvents, l as fmtCurrency, a6 as AppLoadingScreen, w as Layout, a7 as ResponsiveContainer, a8 as XAxis, a9 as YAxis, aa as Tooltip, ab as Cell, a0 as getTransactionStatus, ac as getTransactionStatusLabel, a5 as formatTransactionDate } from "./index-DVjJBirV.js";
import { S as StatusPill } from "./StatusPill-2_bdgNUe.js";
import { o as Banknote, S as Send, m as Link2, aF as Store, j as CreditCard, d as ShieldCheck, a8 as Activity, R as RefreshCw, A as ArrowRight } from "./utils-vendor-Bm5lXE_Q.js";
import { L as LineChart, C as CartesianGrid, a as Line, P as PieChart, b as Pie } from "./PieChart-BZWWJjJx.js";
import "./ui-vendor-CXLHQPHT.js";
const PIE_COLORS = ["#34d399", "#2dd4bf", "#38bdf8", "#a78bfa", "#fbbf24"];
function Panel({ children, className = "" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: `rounded-2xl border border-white/[0.07] bg-[#0d1b16] ${className}`, children });
}
function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function LiveDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { collectionCurrency } = useCollectionCurrency();
  const [days, setDays] = reactExports.useState(7);
  const [stats, setStats] = reactExports.useState(null);
  const [recent, setRecent] = reactExports.useState([]);
  const [health, setHealth] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const load = reactExports.useCallback(async () => {
    var _a, _b;
    if (!user) return;
    setError("");
    try {
      const recentParams = new URLSearchParams({
        currency: collectionCurrency.toUpperCase(),
        limit: "8",
        skip: "0",
        sort: "-created_at"
      });
      const [statsRes, txRes] = await Promise.all([
        client.apiCall.invoke({
          url: `/api/v1/xend/dashboard-stats?days=${days}&currency=${collectionCurrency}`,
          method: "GET",
          data: {}
        }),
        client.get(`/api/v1/xend/transactions?${recentParams.toString()}`)
      ]);
      if (!statsRes.ok || !((_a = statsRes.data) == null ? void 0 : _a.payments)) {
        throw new Error(((_b = statsRes.data) == null ? void 0 : _b.detail) || "Unable to load dashboard statistics");
      }
      const recentBody = txRes.data && typeof txRes.data === "object" ? txRes.data : {};
      if (!txRes.ok) throw new Error(recentBody.detail || "Unable to load recent transactions");
      if (!Array.isArray(recentBody.items)) throw new Error("The recent transactions response is invalid");
      setStats(statsRes.data);
      setRecent(recentBody.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [user, days, collectionCurrency]);
  const checkHealth = reactExports.useCallback(async () => {
    const started = performance.now();
    try {
      const res = await fetch("/api/v1/health", { cache: "no-store" });
      if (!res.ok) {
        setHealth({ ok: false, latencyMs: Math.round(performance.now() - started) });
        return;
      }
      const body = await res.json();
      setHealth({ ok: body.status === "healthy", latencyMs: Math.round(performance.now() - started) });
    } catch {
      setHealth({ ok: false, latencyMs: null });
    }
  }, []);
  const { connected } = usePaymentEvents({
    enabled: !!user,
    onStatusChange: load,
    onWalletUpdate: load,
    pollInterval: 15e3
  });
  reactExports.useEffect(() => {
    void load();
  }, [load]);
  reactExports.useEffect(() => {
    void checkHealth();
    const timer = window.setInterval(() => void checkHealth(), 3e4);
    return () => window.clearInterval(timer);
  }, [checkHealth]);
  const money = reactExports.useCallback((value) => fmtCurrency(value, collectionCurrency), [collectionCurrency]);
  const kpis = reactExports.useMemo(() => {
    var _a, _b, _c;
    const bucket = (name) => stats == null ? void 0 : stats.status_breakdown.find((row) => row.status === name);
    const executed = toNumber((_a = bucket("Executed")) == null ? void 0 : _a.payment_count);
    const totalCount = toNumber(stats == null ? void 0 : stats.payments.total_count);
    const successRate = totalCount > 0 ? executed / totalCount * 100 : 0;
    return [
      { label: "Transaction volume", value: money(toNumber(stats == null ? void 0 : stats.payments.total_amount)), sub: `${totalCount} payments`, icon: Banknote, accent: "text-emerald-300 bg-emerald-300/10" },
      { label: "Disbursements", value: money(toNumber(stats == null ? void 0 : stats.disbursements.total_amount)), sub: `${toNumber(stats == null ? void 0 : stats.disbursements.total_count)} payouts`, icon: Send, accent: "text-sky-300 bg-sky-300/10" },
      { label: "Payment links", value: String(toNumber((_b = stats == null ? void 0 : stats.payment_links) == null ? void 0 : _b.total_count)), sub: `Last ${days} days`, icon: Link2, accent: "text-violet-300 bg-violet-300/10" },
      { label: "OTC activity", value: String(toNumber((_c = stats == null ? void 0 : stats.otc_activity) == null ? void 0 : _c.total_count)), sub: "Cash and over-the-counter orders", icon: Store, accent: "text-amber-300 bg-amber-300/10" },
      { label: "Transactions", value: String(totalCount), sub: `Last ${days} days`, icon: CreditCard, accent: "text-teal-300 bg-teal-300/10" },
      { label: "Success rate", value: totalCount > 0 ? `${successRate.toFixed(1)}%` : "—", sub: `Last ${days} days`, icon: ShieldCheck, accent: "text-lime-300 bg-lime-300/10" },
      {
        label: "API health",
        value: health ? health.ok ? "Operational" : "Degraded" : "Checking…",
        sub: (health == null ? void 0 : health.latencyMs) != null ? `${health.latencyMs} ms response` : "No response",
        icon: Activity,
        accent: health && !health.ok ? "text-rose-300 bg-rose-300/10" : "text-cyan-300 bg-cyan-300/10"
      },
      { label: "Payment events", value: connected ? "Connected" : "Polling", sub: "Realtime event stream", icon: Activity, accent: "text-green-300 bg-green-300/10" }
    ];
  }, [stats, health, connected, days, money]);
  if (authLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx(AppLoadingScreen, {});
  if (!user) return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/home", replace: true });
  const operator = user.name || user.email || "there";
  const chartData = ((stats == null ? void 0 : stats.daily_volumes) ?? []).map((row) => ({
    ...row,
    payments: toNumber(row.payments),
    disbursements: toNumber(row.disbursements)
  }));
  const methods = (stats == null ? void 0 : stats.payment_methods) ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { connected, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 rounded-3xl bg-[#08120e] p-4 text-slate-100 sm:p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col justify-between gap-4 sm:flex-row sm:items-end", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold uppercase tracking-[0.19em] text-emerald-300", children: [
          "Overview / ",
          collectionCurrency
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl", children: [
          "Welcome, ",
          operator.split(" ")[0]
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-400", children: "Live figures from your payment operations." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        [7, 30, 90].map((value) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setDays(value),
            "aria-pressed": days === value,
            className: `rounded-lg border px-3 py-1.5 text-xs font-medium transition ${days === value ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-200" : "border-white/[0.08] text-slate-400 hover:text-white"}`,
            children: [
              value,
              "d"
            ]
          },
          value
        )),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              void load();
              void checkHealth();
            },
            "aria-label": "Refresh",
            className: "rounded-lg border border-white/[0.08] p-2 text-slate-300 hover:text-white",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/dashboard/classic", className: "text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline", children: "Classic view" })
      ] })
    ] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "flex items-center justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => void load(), className: "font-semibold underline", children: "Retry" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { "aria-label": "Key performance indicators", className: "grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4", children: kpis.map((card) => {
      const Icon = card.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "rounded-2xl border border-white/[0.07] bg-[#0d1b16] p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-slate-400", children: card.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `flex h-8 w-8 items-center justify-center rounded-lg ${card.accent}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 16 }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 break-words text-2xl font-semibold tracking-tight text-white", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block h-7 w-24 animate-pulse rounded bg-white/10" }) : card.value }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[11px] text-slate-500", children: card.sub })
      ] }, card.label);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 xl:grid-cols-[1.65fr_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Panel, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-white", children: "7-day transaction volume" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [
          "Payments and disbursements · ",
          collectionCurrency
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 h-[260px] w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(LineChart, { data: chartData, margin: { top: 8, right: 8, left: -10, bottom: 0 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { stroke: "rgba(148,163,184,0.12)", vertical: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "day", tick: { fill: "#82918a", fontSize: 11 }, axisLine: false, tickLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { tick: { fill: "#82918a", fontSize: 10 }, axisLine: false, tickLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tooltip,
            {
              contentStyle: { background: "#12231c", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "#f8fafc", fontSize: 12 },
              formatter: (value) => money(value)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "payments", name: "Payments", stroke: "#6ee7b7", strokeWidth: 2.5, dot: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Line, { type: "monotone", dataKey: "disbursements", name: "Disbursements", stroke: "#0f766e", strokeWidth: 2.5, dot: false })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Panel, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-white", children: "Payment methods" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-slate-500", children: [
          "Share of payments, last ",
          days,
          " days"
        ] }),
        methods.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-16 text-center text-sm text-slate-500", children: "No payments in this period." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 h-[190px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(PieChart, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pie, { data: methods, dataKey: "count", nameKey: "name", innerRadius: 50, outerRadius: 78, paddingAngle: 3, stroke: "none", children: methods.map((entry, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(Cell, { fill: PIE_COLORS[index % PIE_COLORS.length] }, entry.name)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: { background: "#12231c", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, color: "#f8fafc", fontSize: 12 } })
          ] }) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 space-y-2 text-xs", children: methods.map((entry, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between text-slate-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("i", { className: "h-2 w-2 rounded-full", style: { background: PIE_COLORS[index % PIE_COLORS.length] } }),
              entry.name
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-500", children: [
              entry.count,
              " · ",
              money(entry.amount)
            ] })
          ] }, entry.name)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Panel, { className: "p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-white", children: "Recent transactions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/transactions", className: "flex items-center gap-1 text-xs font-medium text-emerald-300 hover:text-emerald-200", children: [
          "View all ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 13 })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[560px] text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-[11px] uppercase tracking-wider text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 font-medium", children: "Reference" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 font-medium", children: "Customer" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 font-medium", children: "Amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 font-medium", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "pb-2 font-medium", children: "Created" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-white/[0.05]", children: [
          recent.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "py-8 text-center text-slate-500", children: loading ? "Loading…" : "No transactions yet." }) }),
          recent.map((tx) => {
            const status = getTransactionStatus(tx);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "text-slate-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2.5 font-mono text-xs", children: tx.external_id || `#${tx.id}` }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2.5", children: tx.customer_name || tx.customer_email || "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2.5 font-medium text-white", children: fmtCurrency(toNumber(tx.amount), tx.currency || collectionCurrency) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StatusPill, { status, label: getTransactionStatusLabel(status) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2.5 text-xs text-slate-500", children: formatTransactionDate(tx.created_at) })
            ] }, tx.id);
          })
        ] })
      ] }) })
    ] })
  ] }) });
}
export {
  LiveDashboard as default
};
