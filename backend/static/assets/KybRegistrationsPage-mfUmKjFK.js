import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { a as reactExports } from "./router-vendor-N0qZPfHZ.js";
import { i as client, w as Layout } from "./index-DVjJBirV.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-Bs5L13ZF.js";
import { R as RefreshCw, bn as ClipboardList, a0 as ChevronUp, $ as ChevronDown, a2 as CircleX, y as CircleCheckBig, a3 as Clock, aU as KeyRound, X, T as TriangleAlert, a1 as Check, aG as Copy } from "./utils-vendor-Bm5lXE_Q.js";
import "./ui-vendor-CXLHQPHT.js";
const statusConfig = {
  pending_review: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5" }) },
  in_progress: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5" }) },
  approved: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3.5 w-3.5" }) },
  rejected: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5" }) }
};
const fmt_time = (s) => s ? new Date(s).toLocaleString() : "—";
function CopyField({ label, value }) {
  const [copied, setCopied] = reactExports.useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-1", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 bg-muted/60 border border-border/40 rounded-xl px-3 py-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "flex-1 min-w-0 truncate text-foreground text-sm font-mono", children: value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: copy,
          className: "shrink-0 text-muted-foreground hover:text-foreground transition-colors",
          title: "Copy to clipboard",
          children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-emerald-400" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" })
        }
      )
    ] })
  ] });
}
function CredentialsModal({ creds, onClose }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border rounded-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto p-4 sm:p-6 space-y-4 shadow-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "h-5 w-5 text-emerald-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-foreground font-semibold", children: "Merchant Access Granted" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs", children: creds.email })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "text-muted-foreground hover:text-foreground transition-colors shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-amber-400 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-amber-300 text-xs leading-relaxed", children: "These credentials are shown only once and are not stored in plaintext. Copy and share them with the merchant securely now." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CopyField, { label: "Dashboard Login Password", value: creds.password }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CopyField, { label: "SwiftPay Access Key — TEST", value: creds.test_access_key }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CopyField, { label: "SwiftPay Access Key — LIVE", value: creds.live_access_key }),
      creds.usdt_deposit_address && /* @__PURE__ */ jsxRuntimeExports.jsx(CopyField, { label: "USDT Receiving Address — TRON (TRC20)", value: creds.usdt_deposit_address })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: onClose,
        className: "w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm",
        children: "Done"
      }
    )
  ] }) });
}
function KybRegistrationsPage() {
  var _a;
  const [registrations, setRegistrations] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [filter, setFilter] = reactExports.useState("pending_review");
  const [actionLoading, setActionLoading] = reactExports.useState(null);
  const [activeId, setActiveId] = reactExports.useState(null);
  const [rejectReason, setRejectReason] = reactExports.useState("");
  const [rejectMode, setRejectMode] = reactExports.useState(false);
  const [expandedId, setExpandedId] = reactExports.useState(null);
  const [error, setError] = reactExports.useState("");
  const [successMessage, setSuccessMessage] = reactExports.useState("");
  const netbankDefaults = {
    bank_name: "Netbank",
    bank_account_number: "041-105-00037-6",
    bank_account_name: "Swift Technology Ventures Inc.",
    bank_address: ""
  };
  const [approvalForm, setApprovalForm] = reactExports.useState({
    vip_gold: false,
    bank_name: "",
    bank_account_number: "",
    bank_account_name: "",
    bank_address: "",
    usdt_wallet_address: "",
    settlement_type: "Bank Transfer",
    settlement_currency: "PHP"
  });
  const [issuedCredentials, setIssuedCredentials] = reactExports.useState(null);
  const fetchRegistrations = reactExports.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = filter ? `/api/v1/kyb?status=${filter}` : "/api/v1/kyb";
      const { data, ok } = await client.get(url);
      if (ok) {
        setRegistrations((data == null ? void 0 : data.items) || []);
      } else {
        setError("Failed to load KYB registrations. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setError("Network error while loading KYB registrations.");
    }
    setLoading(false);
  }, [filter]);
  reactExports.useEffect(() => {
    fetchRegistrations();
    const id = setInterval(fetchRegistrations, 3e4);
    return () => clearInterval(id);
  }, [fetchRegistrations]);
  reactExports.useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const registrationId = parseInt(hash, 10);
      if (!isNaN(registrationId)) {
        setExpandedId(registrationId);
      }
    }
  }, []);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" }) });
  const doAction = async (id, action) => {
    setActionLoading(id);
    setError("");
    setSuccessMessage("");
    try {
      const body = action === "approve" ? {
        note: "",
        vip_gold: approvalForm.vip_gold,
        bank_name: approvalForm.bank_name,
        bank_account_number: approvalForm.bank_account_number,
        bank_account_name: approvalForm.bank_account_name,
        bank_address: approvalForm.bank_address,
        usdt_wallet_address: approvalForm.usdt_wallet_address,
        settlement_type: approvalForm.settlement_type,
        settlement_currency: approvalForm.settlement_currency
      } : { reason: rejectReason || "Rejected by admin." };
      const { data, ok } = await client.request(`/api/v1/kyb/${id}/${action}`, "POST", body);
      if (ok) {
        const successText = action === "approve" ? "KYB registration approved successfully." : "KYB registration rejected successfully.";
        setSuccessMessage(successText);
        if (action === "approve" && (data == null ? void 0 : data.credentials)) {
          setIssuedCredentials(data.credentials);
        }
        setRejectReason("");
        setActiveId(null);
        setRejectMode(false);
        await fetchRegistrations();
      } else {
        setError((data == null ? void 0 : data.detail) || `Failed to ${action}`);
      }
    } catch (e) {
      setError(e.message);
    }
    setActionLoading(null);
  };
  const pending_count = registrations.filter((r) => r.status === "pending_review").length;
  const filters = [
    { value: "pending_review", label: "Pending Review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "in_progress", label: "In Progress" },
    { value: "", label: "All" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Layout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-5 sm:space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl", children: [
            "KYB Registrations",
            pending_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full", children: pending_count })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-0.5", children: "Review and approve Know Your Business registration applications" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: fetchRegistrations,
            className: "flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:w-auto",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
              " Refresh"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto [overflow-scrolling:touch]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 min-w-max", children: filters.map(({ value, label }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setFilter(value),
          className: `min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${filter === value ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-white"}`,
          children: label
        },
        value || "all"
      )) }) }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3", children: error }),
      successMessage && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-emerald-400 text-sm bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3", children: successMessage }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [...Array(3)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-background border border-border/40 rounded-2xl p-4 animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-muted/50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-40 bg-muted/50 rounded" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-56 bg-muted/30 rounded" })
        ] })
      ] }) }, i)) }) : registrations.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl p-12 flex flex-col items-center text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "h-6 w-6 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground font-medium", children: [
          "No ",
          (((_a = filters.find((f) => f.value === filter)) == null ? void 0 : _a.label) ?? filter).toLowerCase(),
          " registrations"
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: registrations.map((reg) => {
        var _a2;
        const sc = statusConfig[reg.status] || statusConfig.pending_review;
        const isActive = activeId === reg.id;
        const isExpanded = expandedId === reg.id;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 sm:p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ClipboardList, { className: "h-5 w-5 text-blue-400" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold break-words", children: reg.full_name || (reg.telegram_username ? `@${reg.telegram_username}` : reg.chat_id) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${sc.color}`, children: [
                    sc.icon,
                    " ",
                    reg.status.replace("_", " ")
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-sm mt-0.5 break-words", children: [
                  reg.telegram_username ? `@${reg.telegram_username}` : `ID: ${reg.chat_id}`,
                  " · ",
                  "Application #",
                  reg.id,
                  " · ",
                  fmt_time(reg.created_at)
                ] }),
                reg.rejection_reason && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-red-400 text-xs mt-1 break-words", children: [
                  "Rejection reason: ",
                  reg.rejection_reason
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 sm:flex items-center gap-2 shrink-0 pt-3 sm:pt-0 border-t border-border/30 sm:border-t-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => setExpandedId(isExpanded ? null : reg.id),
                  className: "text-xs px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:border-slate-400 transition-colors flex items-center justify-center gap-1 min-h-[44px] sm:min-h-[36px]",
                  children: [
                    "Details ",
                    isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3 w-3" })
                  ]
                }
              ),
              reg.status === "pending_review" && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => {
                    setActiveId(isActive ? null : reg.id);
                    setRejectMode(false);
                    setRejectReason("");
                    setError("");
                    setSuccessMessage("");
                    if (!isActive) {
                      setApprovalForm({
                        vip_gold: false,
                        bank_name: reg.bank_name || netbankDefaults.bank_name,
                        bank_account_number: reg.bank_account_number || netbankDefaults.bank_account_number,
                        bank_account_name: reg.bank_account_name || netbankDefaults.bank_account_name,
                        bank_address: reg.bank_address || netbankDefaults.bank_address,
                        usdt_wallet_address: reg.usdt_wallet_address || "",
                        settlement_type: reg.settlement_type || "Bank Transfer",
                        settlement_currency: reg.settlement_currency || "PHP"
                      });
                    }
                  },
                  className: "text-xs px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:border-slate-400 transition-colors min-h-[44px] sm:min-h-[36px]",
                  children: isActive ? "Cancel" : "Review"
                }
              )
            ] })
          ] }),
          isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 sm:px-4 pb-4 border-t border-border/40 pt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "Full Name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground", children: reg.full_name || "—" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "Email" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground", children: reg.email || "—" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "Phone" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground", children: reg.phone || "—" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "Address" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground", children: reg.address || "—" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: ((_a2 = reg.chat_id) == null ? void 0 : _a2.startsWith("web-")) ? "Business Name" : "Bank Name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground", children: reg.bank_name || "—" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "Telegram Chat ID" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-mono text-xs", children: reg.chat_id })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "ID Photo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs font-medium ${reg.id_photo_file_id ? "text-emerald-400" : "text-amber-400"}`, children: reg.id_photo_file_id ? "📎 Uploaded" : "⚠️ Not uploaded" })
            ] })
          ] }) }),
          isActive && reg.status === "pending_review" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 sm:px-4 pb-4 border-t border-border/40 pt-3", children: rejectMode ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-2", children: "Rejection reason:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: rejectReason,
                onChange: (e) => setRejectReason(e.target.value),
                placeholder: "e.g. Invalid ID photo, incomplete information",
                className: "w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 mb-3"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  onClick: () => setRejectMode(false),
                  className: "min-h-[44px] rounded-xl border border-border text-muted-foreground hover:border-slate-400 text-sm transition-colors",
                  children: "Back"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => doAction(reg.id, "reject"),
                  disabled: actionLoading === reg.id,
                  className: "min-h-[44px] flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm",
                  children: [
                    actionLoading === reg.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4" }),
                    "Confirm Reject"
                  ]
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "sm:col-span-2 flex items-center gap-2 cursor-pointer", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: approvalForm.vip_gold,
                    onChange: (e) => setApprovalForm((prev) => ({ ...prev, vip_gold: e.target.checked })),
                    className: "h-4 w-4 rounded border-border bg-muted accent-amber-500"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground text-sm font-medium", children: "VIP Gold" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Bank Name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    value: approvalForm.bank_name,
                    onChange: (e) => setApprovalForm((prev) => ({ ...prev, bank_name: e.target.value })),
                    className: "w-full min-h-[44px] bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50",
                    placeholder: "BDO, GCash, Maya, etc."
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Account Number" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    value: approvalForm.bank_account_number,
                    onChange: (e) => setApprovalForm((prev) => ({ ...prev, bank_account_number: e.target.value })),
                    className: "w-full min-h-[44px] bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50",
                    placeholder: "001234567890"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Account Holder Name" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    value: approvalForm.bank_account_name,
                    onChange: (e) => setApprovalForm((prev) => ({ ...prev, bank_account_name: e.target.value })),
                    className: "w-full min-h-[44px] bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50",
                    placeholder: "Juan dela Cruz"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Settlement Currency" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "select",
                  {
                    value: approvalForm.settlement_currency,
                    onChange: (e) => setApprovalForm((prev) => ({ ...prev, settlement_currency: e.target.value })),
                    className: "w-full min-h-[44px] bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-blue-500/50",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "PHP", children: "PHP" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "USDT", children: "USDT" })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1 sm:col-span-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground text-xs", children: [
                  "Withdrawal USDT Address ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground/70", children: "(optional)" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    value: approvalForm.usdt_wallet_address,
                    onChange: (e) => setApprovalForm((prev) => ({ ...prev, usdt_wallet_address: e.target.value })),
                    className: "w-full min-h-[44px] bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50",
                    placeholder: "T... (leave blank to auto-assign a receiving address)"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1 sm:col-span-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Settlement Type / Notes" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    value: approvalForm.settlement_type,
                    onChange: (e) => setApprovalForm((prev) => ({ ...prev, settlement_type: e.target.value })),
                    className: "w-full min-h-[44px] bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50",
                    placeholder: "Bank Transfer"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "space-y-1 sm:col-span-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "Bank Address" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    value: approvalForm.bank_address,
                    onChange: (e) => setApprovalForm((prev) => ({ ...prev, bank_address: e.target.value })),
                    className: "w-full min-h-[44px] bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50",
                    placeholder: "Bank branch / e-wallet notes"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 pt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => doAction(reg.id, "approve"),
                  disabled: actionLoading === reg.id,
                  title: "Approve registration and grant dashboard access",
                  className: "min-h-[48px] flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm",
                  children: [
                    actionLoading === reg.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4" }),
                    "Approve"
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => setRejectMode(true),
                  disabled: actionLoading === reg.id,
                  title: "Reject registration",
                  className: "min-h-[48px] flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4" }),
                    " Reject"
                  ]
                }
              )
            ] })
          ] }) })
        ] }, reg.id);
      }) })
    ] }),
    issuedCredentials && /* @__PURE__ */ jsxRuntimeExports.jsx(CredentialsModal, { creds: issuedCredentials, onClose: () => setIssuedCredentials(null) })
  ] });
}
export {
  KybRegistrationsPage as default
};
