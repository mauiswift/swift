import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { a as reactExports, N as Navigate, L as Link } from "./router-vendor-N0qZPfHZ.js";
import { i as client, b as ue, u as useAuth, v as useCollectionCurrency, a2 as usePaymentEvents, a6 as AppLoadingScreen, w as Layout, a0 as getTransactionStatus, J as getTransactionTypeLabel, l as fmtCurrency, ac as getTransactionStatusLabel, a5 as formatTransactionDate } from "./index-CpEIrYHf.js";
import { X, h as CircleCheck, aG as Copy, aI as ExternalLink, b as LoaderCircle, R as RefreshCw, aT as Plus, a5 as Search, b7 as ArrowUp, b8 as ArrowDown, J as ChevronLeft, G as ChevronRight, ap as Fingerprint } from "./utils-vendor-Bm5lXE_Q.js";
import { S as StatusPill } from "./StatusPill-2_bdgNUe.js";
import "./ui-vendor-CXLHQPHT.js";
const ORDER_ENDPOINTS = {
  invoice: "/api/v1/xend/create-invoice",
  payment_link: "/api/v1/xend/create-payment-link",
  qr_code: "/api/v1/xend/create-qr-code"
};
function getPaymentUrl(data) {
  if (!data || typeof data !== "object") return "";
  const response = data;
  const nested = response.data && typeof response.data === "object" ? response.data : {};
  for (const candidate of [
    nested.payment_url,
    nested.paymentUrl,
    nested.checkout_url,
    nested.redirect_url,
    nested.qr_code_url,
    response.payment_url,
    response.checkout_url,
    response.redirect_url
  ]) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return "";
}
function CreateOrderModal({ currency, onClose, onCreated }) {
  const [kind, setKind] = reactExports.useState("invoice");
  const [amount, setAmount] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [customerName, setCustomerName] = reactExports.useState("");
  const [customerEmail, setCustomerEmail] = reactExports.useState("");
  const [method, setMethod] = reactExports.useState("");
  const [methods, setMethods] = reactExports.useState([]);
  const [methodsLoading, setMethodsLoading] = reactExports.useState(true);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const [paymentUrl, setPaymentUrl] = reactExports.useState("");
  const [orderId, setOrderId] = reactExports.useState("");
  reactExports.useEffect(() => {
    let active = true;
    const loadMethods = async () => {
      setMethodsLoading(true);
      setMethods([]);
      setMethod("");
      setError("");
      try {
        const response = await client.get(`/api/v1/xend/payment-methods?currency=${encodeURIComponent(currency.toUpperCase())}`);
        const values = response.data && typeof response.data === "object" ? response.data.payment_methods : null;
        if (!response.ok || !Array.isArray(values)) {
          throw new Error("Unable to load payment methods enabled for this currency.");
        }
        const available = values.filter((value) => typeof value === "string" && value.trim().length > 0);
        if (active) {
          setMethods(available);
          setMethod(available.includes("gcash") ? "gcash" : available[0] || "");
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load payment methods enabled for this currency.");
      } finally {
        if (active) setMethodsLoading(false);
      }
    };
    void loadMethods();
    return () => {
      active = false;
    };
  }, [currency]);
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!description.trim()) {
      setError("Enter an order description.");
      return;
    }
    if (methodsLoading || methods.length === 0 || !method) {
      setError("No payment methods are enabled for this currency.");
      return;
    }
    setSubmitting(true);
    try {
      const response = await client.post(ORDER_ENDPOINTS[kind], {
        amount: numericAmount,
        currency: currency.toUpperCase(),
        description: description.trim(),
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        external_id: `SP-${crypto.randomUUID()}`,
        payment_methods: [method]
      });
      const body = response.data && typeof response.data === "object" ? response.data : {};
      if (!response.ok || body.success === false) {
        throw new Error(String(body.detail || body.message || body.error || "Unable to create the order."));
      }
      onCreated();
      const url = getPaymentUrl(body);
      const nested = body.data && typeof body.data === "object" ? body.data : {};
      const id = nested.payment_id || nested.transaction_id || body.payment_id || body.transaction_id;
      if (!url) {
        throw new Error("The provider did not return a checkout URL. Check the transaction list before retrying to avoid creating a duplicate order.");
      }
      setOrderId(id == null ? "" : String(id));
      setPaymentUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create the order.");
    } finally {
      setSubmitting(false);
    }
  };
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      ue.success("Checkout link copied.");
    } catch {
      ue.error("Unable to copy the checkout link.");
    }
  };
  const fieldClass = "mt-1 w-full rounded-lg border border-white/10 bg-[#08120e] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-emerald-300/50";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4", onMouseDown: (event) => {
    if (event.target === event.currentTarget && !submitting) onClose();
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { role: "dialog", "aria-modal": "true", "aria-labelledby": "create-order-title", className: "my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1712] p-5 text-slate-100 shadow-2xl sm:p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300", children: "Payments" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "create-order-title", className: "mt-1 text-xl font-semibold text-white", children: paymentUrl ? "Order created" : "Create order" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-400", children: paymentUrl ? "The payment request was submitted to your configured provider." : "Create a payment request using a channel enabled for this currency." })
      ] }),
      !submitting && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, "aria-label": "Close", className: "rounded-lg border border-white/10 p-2 text-slate-400 hover:text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 16 }) })
    ] }),
    paymentUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-3 text-sm text-emerald-200", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 17 }),
        " Payment request created"
      ] }),
      orderId && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-slate-400", children: [
        "Provider reference: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-slate-200", children: orderId })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "break-all rounded-lg border border-white/10 bg-[#08120e] p-3 text-xs text-slate-300", children: paymentUrl }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => void copyUrl(), className: "flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 14 }),
          " Copy link"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: paymentUrl, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-[#06140e] hover:bg-emerald-300", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { size: 14 }),
          " Open checkout"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "ml-auto rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5", children: "Done" })
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "mt-5 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-medium text-slate-400", children: [
          "Order type",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: kind, onChange: (event) => setKind(event.target.value), className: fieldClass, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "invoice", children: "Invoice" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "payment_link", children: "Payment link" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "qr_code", children: "QR payment" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-medium text-slate-400", children: [
          "Amount (",
          currency.toUpperCase(),
          ")",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: "0.01", step: "0.01", required: true, value: amount, onChange: (event) => setAmount(event.target.value), className: fieldClass })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-slate-400", children: [
        "Enabled payment method",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: method, onChange: (event) => setMethod(event.target.value), disabled: methodsLoading || methods.length === 0, className: fieldClass, children: [
          methodsLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Loading methods…" }),
          !methodsLoading && methods.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "No methods available" }),
          methods.map((value) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value, children: value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()) }, value))
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-medium text-slate-400", children: [
        "Description",
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, maxLength: 255, value: description, onChange: (event) => setDescription(event.target.value), className: fieldClass })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-medium text-slate-400", children: [
          "Customer name",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { maxLength: 200, value: customerName, onChange: (event) => setCustomerName(event.target.value), className: fieldClass })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-medium text-slate-400", children: [
          "Customer email",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", maxLength: 254, value: customerEmail, onChange: (event) => setCustomerEmail(event.target.value), className: fieldClass })
        ] })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "rounded-lg border border-rose-300/20 bg-rose-300/5 p-3 text-sm text-rose-200", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "flex justify-end gap-2 border-t border-white/[0.06] pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled: submitting, onClick: onClose, className: "rounded-lg border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5", children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: submitting || methodsLoading, className: "rounded-lg bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-[#06140e] hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50", children: submitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 15, className: "animate-spin" }),
          " Creating…"
        ] }) : "Create payment request" })
      ] })
    ] })
  ] }) });
}
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
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [typeFilter, setTypeFilter] = reactExports.useState("all");
  const [sort, setSort] = reactExports.useState({ key: "created_at", dir: "desc" });
  const [selected, setSelected] = reactExports.useState(null);
  const [webhookEvents, setWebhookEvents] = reactExports.useState([]);
  const [webhookLoading, setWebhookLoading] = reactExports.useState(false);
  const [webhookError, setWebhookError] = reactExports.useState("");
  const [createOrderOpen, setCreateOrderOpen] = reactExports.useState(false);
  const load = reactExports.useCallback(async () => {
    if (!user) return;
    setError("");
    try {
      const params = new URLSearchParams({
        currency: collectionCurrency.toUpperCase(),
        skip: String(page * PAGE_SIZE),
        limit: String(PAGE_SIZE),
        sort: `${sort.dir === "desc" ? "-" : ""}${sort.key}`
      });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("transaction_type", typeFilter);
      if (searchQuery) params.set("search", searchQuery);
      const res = await client.get(`/api/v1/xend/transactions?${params.toString()}`);
      const body = res.data && typeof res.data === "object" ? res.data : {};
      if (!res.ok) throw new Error(body.detail || "Unable to load transactions");
      if (!Array.isArray(body.items)) throw new Error("The transactions response is invalid");
      setItems(body.items);
      setTotal(Number(body.total) || 0);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Unable to load transactions");
    } finally {
      setLoading(false);
    }
  }, [user, page, statusFilter, typeFilter, collectionCurrency, searchQuery, sort]);
  const { connected } = usePaymentEvents({ enabled: !!user, onStatusChange: load, pollInterval: 1e4 });
  reactExports.useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);
  reactExports.useEffect(() => {
    setPage(0);
  }, [collectionCurrency, statusFilter, typeFilter]);
  reactExports.useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(0);
      setSearchQuery(search.trim());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  reactExports.useEffect(() => {
    let active = true;
    if (!selected) {
      setWebhookEvents([]);
      setWebhookError("");
      return;
    }
    const loadWebhookEvents = async () => {
      setWebhookLoading(true);
      setWebhookError("");
      try {
        const response = await client.get(`/api/v1/xend/transactions/${selected.id}/webhook-events`);
        const body = response.data && typeof response.data === "object" ? response.data : {};
        if (!response.ok || !Array.isArray(body.items)) {
          throw new Error(body.detail || "Unable to load verified webhook events.");
        }
        if (active) setWebhookEvents(body.items);
      } catch (err) {
        if (active) setWebhookError(err instanceof Error ? err.message : "Unable to load verified webhook events.");
      } finally {
        if (active) setWebhookLoading(false);
      }
    };
    void loadWebhookEvents();
    return () => {
      active = false;
    };
  }, [selected]);
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setCreateOrderOpen(true), className: "flex items-center gap-1.5 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-[#06140e] hover:bg-emerald-300", children: [
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
              placeholder: "Search all orders by ID, customer, email, or description…",
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
          !loading && items.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: COLUMNS.length, className: "py-12 text-center text-slate-500", children: "No transactions match your filters." }) }),
          !loading && items.map((tx) => {
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
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { "aria-labelledby": "webhook-events-title", className: "mt-7 border-t border-white/[0.07] pt-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Fingerprint, { size: 16, className: "text-emerald-300" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { id: "webhook-events-title", className: "text-sm font-semibold text-white", children: "Webhook and signature events" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-500", children: "Only provider-verified events are shown. Raw signatures and signing secrets are never exposed in the browser." }),
            webhookLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-slate-500", children: "Loading verified events…" }),
            webhookError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "mt-4 rounded-lg border border-rose-300/20 bg-rose-300/5 p-3 text-xs text-rose-200", children: webhookError }),
            !webhookLoading && !webhookError && webhookEvents.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-slate-500", children: "No verified provider webhook events have been recorded for this order." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "mt-4 space-y-3", children: webhookEvents.map((event) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "rounded-xl border border-white/[0.07] bg-white/[0.02] p-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-medium capitalize text-slate-200", children: [
                    event.provider,
                    " · ",
                    event.event_type.replace(/\./g, " ")
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-slate-500", children: formatTransactionDate(event.processed_at || event.created_at) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] font-medium text-emerald-200", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 11 }),
                  " Verified"
                ] })
              ] }),
              event.transaction_status && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-slate-400", children: [
                "Recorded status: ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "capitalize text-slate-200", children: event.transaction_status })
              ] }),
              event.signature_fingerprint && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 break-all font-mono text-[10px] text-slate-500", children: [
                "Signature fingerprint · SHA-256 · ",
                event.signature_fingerprint
              ] })
            ] }, event.id)) })
          ] })
        ]
      }
    ) }),
    createOrderOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(
      CreateOrderModal,
      {
        currency: collectionCurrency,
        onClose: () => setCreateOrderOpen(false),
        onCreated: () => {
          void load();
        }
      }
    )
  ] });
}
export {
  LiveTransactions as default
};
