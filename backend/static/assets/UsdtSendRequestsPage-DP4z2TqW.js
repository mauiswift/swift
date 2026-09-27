import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { L as Layout, b as ue } from "./index-DrbT3WcF.js";
import { S as Send, Z as RefreshCw, bh as ShieldAlert, aS as CircleX, o as CircleCheckBig, aO as Clock } from "./utils-vendor-BFordG78.js";
import "./ui-vendor-DsSOT9J9.js";
const statusConfig = {
  pending: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5" }) },
  approved: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3.5 w-3.5" }) },
  denied: { color: "bg-red-500/20 text-red-400 border-red-500/30", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5" }) }
};
const fmt_time = (s) => s ? new Date(s).toLocaleString() : "—";
function UsdtSendRequestsPage() {
  const [requests, setRequests] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [filter, setFilter] = reactExports.useState("pending");
  const [actionLoading, setActionLoading] = reactExports.useState(null);
  const [activeId, setActiveId] = reactExports.useState(null);
  const [denialReason, setDenialReason] = reactExports.useState("");
  const [denyMode, setDenyMode] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  const fetchRequests = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/wallet/usdt-send-requests", { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        const items = d.items || [];
        setRequests(filter ? items.filter((r) => r.status === filter) : items);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [filter]);
  reactExports.useEffect(() => {
    fetchRequests();
    const id = setInterval(fetchRequests, 3e4);
    return () => clearInterval(id);
  }, [fetchRequests]);
  const openReview = (id, deny) => {
    setActiveId(id);
    setDenyMode(deny);
    setDenialReason("");
    setError("");
  };
  const cancelReview = () => {
    setActiveId(null);
    setDenyMode(false);
    setDenialReason("");
    setError("");
  };
  const doApprove = async (id) => {
    setActionLoading(id);
    setError("");
    try {
      const res = await fetch(`/api/v1/wallet/usdt-send-requests/${id}/approve`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        ue.success("USDT send request approved");
        cancelReview();
        fetchRequests();
      } else {
        const d = await res.json();
        setError(d.detail || "Failed to approve");
      }
    } catch (e) {
      setError(e.message);
    }
    setActionLoading(null);
  };
  const doDeny = async (id) => {
    if (!denialReason.trim()) {
      setError("Denial reason is required.");
      return;
    }
    setActionLoading(id);
    setError("");
    try {
      const res = await fetch(`/api/v1/wallet/usdt-send-requests/${id}/deny`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: denialReason.trim() })
      });
      if (res.ok) {
        ue.success("USDT send request denied");
        cancelReview();
        fetchRequests();
      } else {
        const d = await res.json();
        setError(d.detail || "Failed to deny");
      }
    } catch (e) {
      setError(e.message);
    }
    setActionLoading(null);
  };
  const pendingCount = requests.filter((r) => r.status === "pending").length;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-5 w-5 text-teal-400 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "USDT Send Requests" }),
          pendingCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full", children: pendingCount })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-0.5", children: "Approve or deny USDT TRC20 outgoing transfer requests" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: fetchRequests,
          className: "flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm border border-border px-3 py-1.5 rounded-lg transition-colors shrink-0",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
            " Refresh"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto [overflow-scrolling:touch]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 min-w-max", children: ["pending", "approved", "denied", ""].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setFilter(s),
        className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === s ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-white"}`,
        children: s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"
      },
      s || "all"
    )) }) }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3", children: error }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [...Array(3)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-background border border-border/40 rounded-2xl p-4 animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-muted/50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-32 bg-muted/50 rounded" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-48 bg-muted/30 rounded" })
      ] })
    ] }) }, i)) }) : requests.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl p-12 flex flex-col items-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-6 w-6 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground font-medium", children: [
        "No ",
        filter || "",
        " send requests"
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: requests.map((req) => {
      const sc = statusConfig[req.status] || statusConfig.pending;
      const isActive = activeId === req.id;
      const shortAddr = `${req.to_address.slice(0, 10)}...${req.to_address.slice(-6)}`;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 flex items-start gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-5 w-5 text-teal-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold font-mono text-sm", children: shortAddr }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${sc.color}`, children: [
                sc.icon,
                " ",
                req.status
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-sm mt-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-teal-400 font-semibold", children: [
                "$",
                req.amount.toFixed(2),
                " USDT"
              ] }),
              " · ",
              "Request #",
              req.id,
              " · ",
              fmt_time(req.created_at)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mt-0.5 font-mono break-all", children: req.to_address }),
            req.note && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-xs mt-1", children: [
              "Note: ",
              req.note
            ] }),
            req.status === "denied" && req.denial_reason && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-1.5 mt-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-3 w-3 text-red-400 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-red-400 text-xs", children: [
                "Denial reason: ",
                req.denial_reason
              ] })
            ] })
          ] }),
          req.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-row items-center gap-2 shrink-0", children: !isActive ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => openReview(req.id, false),
                className: "text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 transition-colors whitespace-nowrap",
                children: "Approve"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => openReview(req.id, true),
                className: "text-xs px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition-colors whitespace-nowrap",
                children: "Deny"
              }
            )
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: cancelReview,
              className: "text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-slate-400 transition-colors",
              children: "Cancel"
            }
          ) })
        ] }),
        isActive && req.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-4 border-t border-border/40 pt-3", children: denyMode ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-red-400 text-sm font-medium mb-2 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-4 w-4" }),
            "Denial reason ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: denialReason,
              onChange: (e) => setDenialReason(e.target.value),
              placeholder: "Explain why this request is being denied (required)…",
              rows: 3,
              className: "w-full bg-muted/60 border border-red-500/30 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-red-500/60 mb-3 resize-none"
            }
          ),
          error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-xs mb-2", children: error }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: cancelReview,
                className: "flex-1 py-2 rounded-xl border border-border text-muted-foreground hover:border-slate-400 text-sm transition-colors",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => doDeny(req.id),
                disabled: actionLoading === req.id,
                className: "flex-1 flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm",
                children: [
                  actionLoading === req.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4" }),
                  "Confirm Deny"
                ]
              }
            )
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-sm mb-3", children: [
            "Approve sending ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-teal-400 font-semibold", children: [
              "$",
              req.amount.toFixed(2),
              " USDT"
            ] }),
            " to",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-muted-foreground", children: shortAddr }),
            "? This will deduct from the user's USD wallet."
          ] }),
          error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-xs mb-2", children: error }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: cancelReview,
                className: "flex-1 py-2 rounded-xl border border-border text-muted-foreground hover:border-slate-400 text-sm transition-colors",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => doApprove(req.id),
                disabled: actionLoading === req.id,
                className: "flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm",
                children: [
                  actionLoading === req.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4" }),
                  "Approve & Deduct Wallet"
                ]
              }
            )
          ] })
        ] }) })
      ] }, req.id);
    }) })
  ] }) });
}
export {
  UsdtSendRequestsPage as default
};
