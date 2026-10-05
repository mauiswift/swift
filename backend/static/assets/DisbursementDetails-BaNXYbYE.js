import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { k as useParams, f as useNavigate, a as reactExports } from "./router-vendor-N0qZPfHZ.js";
import { a6 as AppLoadingScreen, w as Layout, l as fmtCurrency, Y as StatusBadge, Z as getStatusType, P as PaymentBrandLogo, i as client, b as ue } from "./index-C682rKfx.js";
import { J as ChevronLeft, aG as Copy } from "./utils-vendor-Bm5lXE_Q.js";
import "./ui-vendor-CXLHQPHT.js";
function DisbursementDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState(null);
  reactExports.useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await client.apiCall.invoke({
          url: `/api/v1/entities/disbursements/${id}`,
          method: "GET",
          data: {}
        });
        if (res.ok && res.data) {
          setData(res.data);
        } else {
          setError("Failed to load disbursement details");
        }
      } catch (err) {
        setError("Error loading disbursement details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(AppLoadingScreen, {});
  if (error || !data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter flex flex-col items-center justify-center min-h-[400px] gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600 font-medium", children: error || "Disbursement not found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => navigate("/disbursements"),
          className: "px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors",
          children: "Back to disbursements"
        }
      )
    ] }) });
  }
  const currency = data.currency || "PHP";
  const history = data.history || [];
  const shortId = data.short_id;
  const merchantReference = data.merchant_reference;
  const recipientAccount = data.recipient_account;
  const copyToClipboard = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      ue.success("Copied to clipboard");
    } catch {
      ue.error("Unable to copy value");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter mx-auto max-w-6xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[12px] text-slate-400 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-pointer hover:text-slate-600", onClick: () => navigate("/disbursements"), children: "Disbursements" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: ">" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-medium", children: "Disbursement details" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => navigate("/disbursements"),
          className: "app-touch-target rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 m-0", children: "Disbursement details" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel mb-8 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400", children: "Disbursement amount" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl", children: data.total_amount !== void 0 ? fmtCurrency(data.total_amount, currency) : "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: getStatusType(data.status), size: "sm", showDot: false }),
        data.destination && /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: data.destination, size: "sm" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "app-panel p-5 sm:p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[16px] font-semibold text-slate-900 mb-6 border-b border-slate-100 pb-2", children: "History" }),
          history.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: history.map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${i === 0 ? "bg-teal-400" : "bg-slate-200"}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] font-semibold text-slate-900", children: h.event }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400 mt-0.5", children: h.date })
            ] })
          ] }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: "No history details available." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "app-panel p-5 sm:p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-6 border-b border-slate-100 pb-2 text-[16px] font-semibold text-slate-900", children: "Disbursement breakdown" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-[13px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BreakdownRow, { label: "Disbursement amount", value: fmtCurrency(data.amount, currency) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(BreakdownRow, { label: "Processing fee", value: data.commission !== void 0 ? fmtCurrency(data.commission, currency) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3.5 text-white", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: "Total debit" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-base font-semibold", children: data.total_amount !== void 0 ? fmtCurrency(data.total_amount, currency) : "—" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel h-fit p-5 sm:p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[16px] font-semibold text-slate-900 border-b border-slate-100 pb-2", children: "Details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Disbursement ID", value: data.id, showCopy: true, onCopy: () => void copyToClipboard(data.id) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Short ID", value: shortId || "—", showCopy: Boolean(shortId), onCopy: shortId ? () => void copyToClipboard(shortId) : void 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Destination", value: data.destination || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Merchant reference number", value: merchantReference || "—", showCopy: Boolean(merchantReference), onCopy: merchantReference ? () => void copyToClipboard(merchantReference) : void 0 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Channel reference number", value: data.channel_reference || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Recipient name", value: data.recipient_name || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DetailRow, { label: "Recipient account number", value: recipientAccount || "—", showCopy: Boolean(recipientAccount), onCopy: recipientAccount ? () => void copyToClipboard(recipientAccount) : void 0 })
        ] })
      ] })
    ] })
  ] }) });
}
function DetailRow({ label, value, showCopy, onCopy }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[13px] text-slate-600 ${showCopy ? "font-mono" : "font-medium"}`, children: value }),
      showCopy && onCopy && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": `Copy ${label}`, title: `Copy ${label}`, onClick: onCopy, className: "app-touch-target h-8 min-h-0 min-w-0 rounded-md bg-white p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 14 }) })
    ] })
  ] });
}
function BreakdownRow({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-medium text-slate-900", children: value })
  ] });
}
export {
  DisbursementDetails as default
};
