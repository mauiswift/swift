import { j as jsxRuntimeExports } from "./query-vendor-DbSHy-Pt.js";
import { a as reactExports, N as Navigate, L as Link } from "./router-vendor-BtBWUifS.js";
import { u as useAuth, g as useCollectionCurrency, h as client, aK as usePaymentEvents, aO as AppLoadingScreen, L as Layout, aI as getTransactionStatus, aw as getTransactionTypeLabel, i as fmtCurrency, aP as getTransactionStatusLabel, aN as formatTransactionDate, b as ue } from "./index-DaEfChDe.js";
import { S as StatusPill } from "./StatusPill-CoUP1hX-.js";
import { R as RefreshCw, ay as Plus, a3 as Search, b1 as ArrowUp, b2 as ArrowDown, v as ChevronLeft, u as ChevronRight, X, au as Copy, aD as ExternalLink } from "./utils-vendor-CNf7xaAj.js";
import "./ui-vendor-CliYdUyU.js";
const PAGE_SIZE = 20;
const STATUS_OPTIONS = ["paid", "pending", "processing", "failed", "rejected", "expired", "cancelled"];
const TYPE_OPTIONS = [
  { value: "invoice", label: "Invoice" },
  { value: "qr_code", label: "QR payment" },
  { value: "payment_link", label: "Payment link" }
];
const COLUMNS = [
  { key: "external_id", label: "Order ID" },
  { key: "customer", label: "Customer" },
  { key: "type", label: "Type" },
  { key: "method", label: "Method" },
  { key: "amount", label: "Amount", align: "right" },
  { key: "currency", label: "Currency" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Created" },
  { key: "paid_at", label: "Paid" },
  { key: "approval", label: "Approval" }
];
function sortValue(tx, key) {
  switch (key) {
    case "external_id":
      return (tx.external_id || "").toLowerCase();
    case "customer":
      return (tx.customer_name || tx.customer_email || "").toLowerCase();
    case "type":
      return (tx.transaction_type || "").toLowerCase();
    case "method":
      return (tx.payment_method || "").toLowerCase();
    case "amount":
      return Number(tx.amount) || 0;
    case "currency":
      return (tx.currency || "").toLowerCase();
    case "status":
      return getTransactionStatus(tx);
    case "created_at":
      return tx.created_at ? Date.parse(tx.created_at) || 0 : 0;
    case "paid_at":
      return tx.paid_at ? Date.parse(tx.paid_at) || 0 : 0;
    case "approval":
      return (tx.approval_status || "").toLowerCase();
  }
}
function DetailRow({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-4 border-b border-white/[0.05] py-2 text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-slate-500", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "break-all text-right text-slate-200", children: value || "—" })
  ] });
}
function LiveTransactions() {
  const { user, loading: authLoading } = useAuth();
  const { collectionCurrency } = useCollectionCurrency();
  const [items, setItems] = reactExports.useState([]);
  const [total, setTotal] = reactExports.useState(0);
  const [page, setPage] = reactExports.useState(0);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const [search, setSearch] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [typeFilter, setTypeFilter] = reactExports.useState("all");
  const [sort, setSort] = reactExports.useState({ key: "created_at", dir: "desc" });
  const [selected, setSelected] = reactExports.useState(null);
  const load = reactExports.useCallback(async () => {
    var _a, _b, _c, _d;
    if (!user) return;
    setError("");
    try {
      const query = { currency: collectionCurrency.toUpperCase() };
      if (statusFilter !== "all") query.status = statusFilter;
      if (typeFilter !== "all") query.transaction_type = typeFilter;
      const res = await client.entities.transactions.query({
        query,
        sort: "-created_at",
        limit: PAGE_SIZE,
        skip: page * PAGE_SIZE
      });
      if (!res.ok) throw new Error(((_a = res.data) == null ? void 0 : _a.detail) || "Unable to load transactions");
      if (!Array.isArray((_b = res.data) == null ? void 0 : _b.items)) throw new Error("The transactions response is invalid");
      setItems(Array.isArray((_c = res.data) == null ? void 0 : _c.items) ? res.data.items : []);
      setTotal(Number((_d = res.data) == null ? void 0 : _d.total) || 0);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Unable to load transactions");
    } finally {
      setLoading(false);
    }
  }, [user, page, statusFilter, typeFilter, collectionCurrency]);
  const { connected } = usePaymentEvents({ enabled: !!user, onStatusChange: load, pollInterval: 1e4 });
  reactExports.useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);
  reactExports.useEffect(() => {
    setPage(0);
  }, [collectionCurrency, statusFilter, typeFilter]);
  const rows = reactExports.useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term ? items.filter((tx) => [tx.external_id, tx.description, tx.customer_name, tx.customer_email, tx.xendit_id].some((value) => value == null ? void 0 : value.toLowerCase().includes(term))) : items;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = sortValue(a, sort.key);
      const right = sortValue(b, sort.key);
      return (left < right ? -1 : left > right ? 1 : 0) * factor;
    });
  }, [items, search, sort]);
  const toggleSort = (key) => setSort((current) => current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  const copy = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      ue.success("Copied");
    } catch {
      ue.error("Unable to copy");
    }
  };
  if (authLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx(AppLoadingScreen, {});
  if (!user) return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/home", replace: true });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const fieldClass = "rounded-lg border border-white/[0.08] bg-[#0d1b16] px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-300/40";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Layout, { connected, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 rounded-3xl bg-[#08120e] p-4 text-slate-100 sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex flex-col justify-between gap-4 sm:flex-row sm:items-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold uppercase tracking-[0.19em] text-emerald-300", children: [
            "Transactions / ",
            collectionCurrency
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-2 text-2xl font-semibold tracking-tight text-white", children: "Transaction management" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-slate-400", children: [
            total,
            " orders · live from your account"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/transactions/classic", className: "text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline", children: "Classic view" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => void load(), "aria-label": "Refresh", className: "rounded-lg border border-white/[0.08] p-2 text-slate-300 hover:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/pay-by-link/new", className: "flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-[#06140e] hover:bg-emerald-300", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 15 }),
            " Create order"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-[220px] flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: search,
              onChange: (event) => setSearch(event.target.value),
              placeholder: "Search this page by order, customer, description…",
              "aria-label": "Search transactions",
              className: `${fieldClass} w-full pl-9`
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: statusFilter, onChange: (event) => setStatusFilter(event.target.value), "aria-label": "Filter by status", className: fieldClass, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All statuses" }),
          STATUS_OPTIONS.map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value, children: value[0].toUpperCase() + value.slice(1) }, value))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: typeFilter, onChange: (event) => setTypeFilter(event.target.value), "aria-label": "Filter by type", className: fieldClass, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "all", children: "All types" }),
          TYPE_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value))
        ] })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "flex items-center justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => void load(), className: "font-semibold underline", children: "Retry" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0d1b16]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[1000px] text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-white/[0.07] text-[11px] uppercase tracking-wider text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: COLUMNS.map((column) => /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: `px-3 py-3 font-medium ${column.align === "right" ? "text-right" : ""}`, "aria-sort": sort.key === column.key ? sort.dir === "asc" ? "ascending" : "descending" : "none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => toggleSort(column.key), className: "inline-flex items-center gap-1 uppercase tracking-wider hover:text-slate-200", children: [
          column.label,
          sort.key === column.key && (sort.dir === "asc" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUp, { size: 11 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDown, { size: 11 }))
        ] }) }, column.key)) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-white/[0.05]", children: [
          loading && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: COLUMNS.length, className: "py-12 text-center text-slate-500", children: "Loading…" }) }),
          !loading && rows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: COLUMNS.length, className: "py-12 text-center text-slate-500", children: "No transactions match your filters." }) }),
          !loading && rows.map((tx) => {
            const status = getTransactionStatus(tx);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "tr",
              {
                tabIndex: 0,
                onClick: () => setSelected(tx),
                onKeyDown: (event) => {
                  if (event.key === "Enter") setSelected(tx);
                },
                className: "cursor-pointer text-slate-300 hover:bg-white/[0.03] focus:bg-white/[0.04] focus:outline-none",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 font-mono text-xs", children: tx.external_id || `#${tx.id}` }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3", children: tx.customer_name || tx.customer_email || "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3", children: getTransactionTypeLabel(tx.transaction_type) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3", children: tx.payment_method || "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-right font-medium text-white", children: fmtCurrency(Number(tx.amount) || 0, tx.currency || collectionCurrency) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3", children: (tx.currency || collectionCurrency).toUpperCase() }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StatusPill, { status, label: getTransactionStatusLabel(status) }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-xs text-slate-500", children: formatTransactionDate(tx.created_at) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-xs text-slate-500", children: formatTransactionDate(tx.paid_at) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-xs capitalize", children: tx.approval_status || "—" })
                ]
              },
              tx.id
            );
          })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Page ",
          page + 1,
          " of ",
          totalPages
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: page === 0, onClick: () => setPage((value) => value - 1), "aria-label": "Previous page", className: "rounded-lg border border-white/[0.08] p-2 disabled:opacity-40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 14 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: page + 1 >= totalPages, onClick: () => setPage((value) => value + 1), "aria-label": "Next page", className: "rounded-lg border border-white/[0.08] p-2 disabled:opacity-40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { size: 14 }) })
        ] })
      ] })
    ] }),
    selected && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex justify-end bg-black/60", onClick: () => setSelected(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "aside",
      {
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "Order details",
        onClick: (event) => event.stopPropagation(),
        className: "h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0a1611] p-6 text-slate-100",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs uppercase tracking-wider text-slate-500", children: "Order" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 break-all font-mono text-sm text-white", children: selected.external_id || `#${selected.id}` })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setSelected(null), "aria-label": "Close", className: "rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-3xl font-semibold text-white", children: fmtCurrency(Number(selected.amount) || 0, selected.currency || collectionCurrency) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(StatusPill, { status: getTransactionStatus(selected), label: getTransactionStatusLabel(getTransactionStatus(selected)) }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "mt-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Type", value: getTransactionTypeLabel(selected.transaction_type) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Method", value: selected.payment_method }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Customer", value: selected.customer_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Email", value: selected.customer_email }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Description", value: selected.description }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Gateway reference", value: selected.xendit_id }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Sender", value: [selected.sender_name, selected.sender_bank].filter(Boolean).join(" · ") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Created", value: formatTransactionDate(selected.created_at) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Paid", value: formatTransactionDate(selected.paid_at) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Approval", value: selected.approval_status }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Approved by", value: selected.approved_by }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Rejection reason", value: selected.rejection_reason })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => void copy(selected.external_id), className: "flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 13 }),
              " Copy order ID"
            ] }),
            selected.payment_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: selected.payment_url, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { size: 13 }),
              " Open payment page"
            ] })
          ] })
        ]
      }
    ) })
  ] });
}
export {
  LiveTransactions as default
};
