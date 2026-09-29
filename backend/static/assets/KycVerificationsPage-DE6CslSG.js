import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { L as Layout } from "./index-DI9hQtnS.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-scP9MW2M.js";
import { R as RefreshCw, U as UserCheck, aK as ChevronUp, _ as ChevronDown, aS as CircleX, o as CircleCheckBig, aO as Clock } from "./utils-vendor-HFbfdctU.js";
import "./ui-vendor-DsSOT9J9.js";
const statusConfig = {
  pending_review: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5" }) },
  in_progress: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5" }) },
  approved: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3.5 w-3.5" }) },
  rejected: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5" }) }
};
const fmt_time = (s) => s ? new Date(s).toLocaleString() : "—";
function KycVerificationsPage() {
  var _a;
  const [verifications, setVerifications] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [filter, setFilter] = reactExports.useState("pending_review");
  const [actionLoading, setActionLoading] = reactExports.useState(null);
  const [activeId, setActiveId] = reactExports.useState(null);
  const [rejectReason, setRejectReason] = reactExports.useState("");
  const [rejectMode, setRejectMode] = reactExports.useState(false);
  const [expandedId, setExpandedId] = reactExports.useState(null);
  const [error, setError] = reactExports.useState("");
  const fetchVerifications = reactExports.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = filter ? `/api/v1/kyc?status=${filter}` : "/api/v1/kyc";
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setVerifications(d.items || []);
      } else {
        setError("Failed to load KYC verifications. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setError("Network error while loading KYC verifications.");
    }
    setLoading(false);
  }, [filter]);
  reactExports.useEffect(() => {
    fetchVerifications();
    const id = setInterval(fetchVerifications, 3e4);
    return () => clearInterval(id);
  }, [fetchVerifications]);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" }) });
  const doAction = async (id, action) => {
    setActionLoading(id);
    setError("");
    try {
      const body = action === "approve" ? { note: "" } : { reason: rejectReason || "Rejected by admin." };
      const res = await fetch(`/api/v1/kyc/${id}/${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setRejectReason("");
        setActiveId(null);
        setRejectMode(false);
        fetchVerifications();
      } else {
        const d = await res.json();
        setError(d.detail || `Failed to ${action}`);
      }
    } catch (e) {
      setError(e.message);
    }
    setActionLoading(null);
  };
  const pending_count = verifications.filter((v) => v.status === "pending_review").length;
  const filters = [
    { value: "pending_review", label: "Pending Review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "in_progress", label: "In Progress" },
    { value: "", label: "All" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap", children: [
          "KYC Verifications",
          pending_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full", children: pending_count })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-0.5", children: "Review and approve Know Your Customer identity verification submissions" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: fetchVerifications,
          className: "flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm border border-border px-3 py-1.5 rounded-lg transition-colors shrink-0",
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
        className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === value ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-white"}`,
        children: label
      },
      value || "all"
    )) }) }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3", children: error }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [...Array(3)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-background border border-border/40 rounded-2xl p-4 animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-muted/50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-40 bg-muted/50 rounded" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-56 bg-muted/30 rounded" })
      ] })
    ] }) }, i)) }) : verifications.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl p-12 flex flex-col items-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { className: "h-6 w-6 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground font-medium", children: [
        "No ",
        (((_a = filters.find((f) => f.value === filter)) == null ? void 0 : _a.label) ?? filter).toLowerCase(),
        " verifications"
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: verifications.map((kyc) => {
      const sc = statusConfig[kyc.status] || statusConfig.pending_review;
      const isActive = activeId === kyc.id;
      const isExpanded = expandedId === kyc.id;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 flex items-start gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { className: "h-5 w-5 text-emerald-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold", children: kyc.full_name || (kyc.telegram_username ? `@${kyc.telegram_username}` : kyc.chat_id) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${sc.color}`, children: [
                sc.icon,
                " ",
                kyc.status.replace("_", " ")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-sm mt-0.5", children: [
              kyc.telegram_username ? `@${kyc.telegram_username}` : `ID: ${kyc.chat_id}`,
              " · ",
              "Verification #",
              kyc.id,
              " · ",
              fmt_time(kyc.created_at)
            ] }),
            kyc.rejection_reason && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-red-400 text-xs mt-1", children: [
              "Rejection reason: ",
              kyc.rejection_reason
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setExpandedId(isExpanded ? null : kyc.id),
                className: "text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-slate-400 transition-colors flex items-center gap-1",
                children: [
                  "Details ",
                  isExpanded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-3 w-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-3 w-3" })
                ]
              }
            ),
            kyc.status === "pending_review" && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => {
                  setActiveId(isActive ? null : kyc.id);
                  setRejectMode(false);
                  setRejectReason("");
                  setError("");
                },
                className: "text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-slate-400 transition-colors",
                children: isActive ? "Cancel" : "Review"
              }
            )
          ] })
        ] }),
        isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-4 border-t border-border/40 pt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "Full Name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground", children: kyc.full_name || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "Date of Birth" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground", children: kyc.date_of_birth || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "Nationality" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground", children: kyc.nationality || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "ID Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground capitalize", children: kyc.id_type ? kyc.id_type.replace("_", " ") : "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "ID Number" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-mono text-xs", children: kyc.id_number || "—" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "Telegram Chat ID" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-mono text-xs", children: kyc.chat_id })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "ID Photo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs font-medium ${kyc.id_photo_file_id ? "text-emerald-400" : "text-amber-400"}`, children: kyc.id_photo_file_id ? "📎 Uploaded" : "⚠️ Not uploaded" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-0.5", children: "Selfie" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-xs font-medium ${kyc.selfie_file_id ? "text-emerald-400" : "text-amber-400"}`, children: kyc.selfie_file_id ? "📎 Uploaded" : "⚠️ Not uploaded" })
          ] })
        ] }) }),
        isActive && kyc.status === "pending_review" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-4 border-t border-border/40 pt-3", children: rejectMode ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-2", children: "Rejection reason:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: rejectReason,
              onChange: (e) => setRejectReason(e.target.value),
              placeholder: "e.g. Invalid ID photo, blurry selfie, mismatched information",
              className: "w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 mb-3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setRejectMode(false),
                className: "flex-1 py-2 rounded-xl border border-border text-muted-foreground hover:border-slate-400 text-sm transition-colors",
                children: "Back"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => doAction(kyc.id, "reject"),
                disabled: actionLoading === kyc.id,
                className: "flex-1 flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm",
                children: [
                  actionLoading === kyc.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4" }),
                  "Confirm Reject"
                ]
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => doAction(kyc.id, "approve"),
              disabled: actionLoading === kyc.id,
              className: "flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm",
              children: [
                actionLoading === kyc.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4" }),
                "Approve & Verify Identity"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setRejectMode(true),
              disabled: actionLoading === kyc.id,
              className: "flex-1 flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4" }),
                " Reject"
              ]
            }
          )
        ] }) })
      ] }, kyc.id);
    }) })
  ] }) });
}
export {
  KycVerificationsPage as default
};
