import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { l as useParams, f as useNavigate, a as reactExports } from "./router-vendor-ugVG8BWW.js";
import { g as client, b as ue, a1 as normalizePublicCurrency, L as Layout, Z as getTransactionStatus, aQ as isSuccessfulTransaction, aR as isPendingTransaction, H as getTransactionTypeLabel, h as fmtCurrency, _ as PaymentStatusBadge, a2 as formatTransactionDate, P as PaymentBrandLogo } from "./index-CbMbBdjh.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-DEQaxaN_.js";
import { g as getTransactionPaymentMethodBrand } from "./paymentMethodBranding-BucxK2in.js";
import { R as RefreshCw, v as ChevronLeft, aL as FileText, au as Copy } from "./utils-vendor-DtbvWOtt.js";
import "./ui-vendor-D6MKKEiL.js";
function PaymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [txn, setTxn] = reactExports.useState(null);
  const [serviceFee, setServiceFee] = reactExports.useState(0);
  const [loading, setLoading] = reactExports.useState(true);
  const [loadError, setLoadError] = reactExports.useState("");
  const fetchTransaction = reactExports.useCallback(async () => {
    var _a, _b;
    if (!id) {
      setLoadError("Transaction ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const response = await client.get(`/api/v1/entities/transactions/${encodeURIComponent(id)}`);
      if (!response.ok || !response.data) {
        if (response.status === 404) {
          navigate("/payments");
          ue.error("Transaction not found");
          return;
        }
        throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || "Unable to load transaction.");
      }
      setTxn(response.data);
      const transaction = response.data;
      const currency = normalizePublicCurrency(transaction.currency);
      setServiceFee(0);
      try {
        const walletResponse = await client.get(
          `/api/v1/wallet/transactions?currency=${encodeURIComponent(currency)}&limit=100`
        );
        if (walletResponse.ok && Array.isArray((_b = walletResponse.data) == null ? void 0 : _b.items)) {
          const reference = transaction.external_id || transaction.xendit_id;
          const feeTransaction = walletResponse.data.items.find((item) => item.transaction_type === "fee" && reference && item.reference_id === `${reference}-fee`);
          setServiceFee(Math.abs(Number((feeTransaction == null ? void 0 : feeTransaction.amount) || 0)));
        } else {
          console.warn("Unable to load wallet fee transaction for payment details");
        }
      } catch (error) {
        console.warn("Unable to load wallet fee transaction for payment details:", error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load transaction details.";
      setLoadError(message);
      ue.error("Failed to load transaction details");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);
  reactExports.useEffect(() => {
    void fetchTransaction();
  }, [fetchTransaction]);
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      ue.success("Copied to clipboard");
    } catch (error) {
      console.error("Failed to copy transaction value:", error);
      ue.error("Unable to copy value");
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" }) });
  }
  if (loadError) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-xl py-20 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold text-slate-900", children: "Unable to load transaction" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: loadError }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => void fetchTransaction(), className: "mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 15 }),
        " Try again"
      ] })
    ] }) });
  }
  if (!txn) return null;
  const displayStatus = getTransactionStatus(txn);
  const successful = isSuccessfulTransaction(displayStatus);
  const pending = isPendingTransaction(displayStatus);
  const displayCurrency = normalizePublicCurrency(txn.currency);
  const receivedAmount = Math.max(0, Number(txn.amount || 0) - serviceFee);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter mx-auto max-w-6xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex items-center gap-2 text-xs font-medium text-slate-400", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "hover:text-slate-600", onClick: () => navigate("/payments"), children: "Payments" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: ">" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-600", children: "Transaction details" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => navigate("/payments"), "aria-label": "Back to payments", className: "app-touch-target rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "m-0 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl", children: "Transaction details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: getTransactionTypeLabel(txn.transaction_type) })
      ] })
    ] }),
    successful && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-emerald-900", children: "Finished contract available" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-emerald-700", children: "Print or save the completed payment record for legal recordkeeping." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => navigate(`/payments/${encodeURIComponent(String(txn.id))}/contract`),
          className: "inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 15 }),
            " View contract"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel mb-8 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400", children: "Transaction amount" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl", children: fmtCurrency(txn.amount, displayCurrency) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentStatusBadge, { transaction: txn, size: "sm" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "app-panel p-5 sm:p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { children: "History" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TimelineItem, { label: "Payment created", date: txn.created_at, color: "bg-blue-500" }),
            successful && /* @__PURE__ */ jsxRuntimeExports.jsx(TimelineItem, { label: "Payment confirmed", date: txn.paid_at || txn.updated_at, color: "bg-emerald-500" }),
            pending && /* @__PURE__ */ jsxRuntimeExports.jsx(TimelineItem, { label: "Payment is being processed", date: txn.updated_at, color: "bg-blue-500" }),
            !successful && !pending && /* @__PURE__ */ jsxRuntimeExports.jsx(TimelineItem, { label: `Payment ${displayStatus}`, date: txn.updated_at, color: "bg-rose-500" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "app-panel p-5 sm:p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { children: "Payment breakdown" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-[13px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BreakdownRow, { label: "Payment amount", value: fmtCurrency(txn.amount, displayCurrency) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(BreakdownRow, { label: "Service fee deducted", value: serviceFee > 0 ? `-${fmtCurrency(serviceFee, displayCurrency)}` : fmtCurrency(0, displayCurrency), muted: serviceFee === 0 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3.5 text-white", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Total received" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-base font-semibold", children: fmtCurrency(receivedAmount, displayCurrency) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "app-panel p-5 sm:p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { children: "Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-slate-600", children: txn.description || "No description provided" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel h-fit p-5 sm:p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { children: "Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Transaction ID", value: String(txn.id), onCopy: () => void copyToClipboard(String(txn.id)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Reference no", value: txn.external_id || "—", onCopy: txn.external_id ? () => void copyToClipboard(txn.external_id) : void 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Gateway ID", value: txn.xendit_id || "—", onCopy: txn.xendit_id ? () => void copyToClipboard(txn.xendit_id) : void 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            DetailRow,
            {
              label: "Payment method",
              value: getTransactionPaymentMethodBrand(txn),
              icon: true,
              methodId: getTransactionPaymentMethodBrand(txn)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Created", value: formatTransactionDate(txn.created_at) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Updated", value: formatTransactionDate(txn.updated_at) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Customer name", value: txn.customer_name || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Customer email", value: txn.customer_email || "—" }),
          (txn.sender_name || txn.sender_bank) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Sender name", value: txn.sender_name || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Sender bank", value: txn.sender_bank || "—" })
          ] }),
          txn.rejection_reason && /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Rejection reason", value: txn.rejection_reason })
        ] })
      ] })
    ] })
  ] }) });
}
function SectionTitle({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-6 border-b border-slate-100 pb-2 text-[16px] font-semibold text-slate-900", children });
}
function TimelineItem({ label, date, color }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${color}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] font-semibold text-slate-900", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-[11px] text-slate-400", children: formatTransactionDate(date) })
    ] })
  ] });
}
function BreakdownRow({ label, value, muted = false }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-mono font-medium ${muted ? "text-slate-400" : "text-slate-900"}`, children: value })
  ] });
}
function DetailRow({ label, value, onCopy, icon, methodId }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1 text-[11px] font-medium uppercase tracking-widest text-slate-400", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
        icon && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100 text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: methodId || "", size: "sm", className: "border-0 bg-transparent" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `truncate text-[13px] text-slate-600 ${onCopy ? "font-mono" : "font-medium"}`, children: value })
      ] }),
      onCopy && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": `Copy ${label}`, title: `Copy ${label}`, onClick: onCopy, className: "rounded-md bg-white p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 14 }) })
    ] })
  ] });
}
export {
  PaymentDetails as default
};
