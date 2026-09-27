import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { L as Layout, x as getStoredToken, b as ue } from "./index-DrbT3WcF.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-scP9MW2M.js";
import { S as SiteContainer } from "./SiteContainer-BLG-Vbyp.js";
import { S as StatusBadge, g as getStatusType } from "./StatusBadge-BXTEIHI6.js";
import { Y as Search, Z as RefreshCw, a0 as TrendingUp, aq as Save, X, aT as Pencil, aU as DollarSign, aQ as Eye, o as CircleCheckBig, aS as CircleX } from "./utils-vendor-BFordG78.js";
import "./ui-vendor-DsSOT9J9.js";
const fmt_time = (s) => s ? new Date(s).toLocaleString() : "—";
const uniqueRequests = (items) => {
  const seen = /* @__PURE__ */ new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};
const authHeaders = (json = false) => {
  const token = getStoredToken();
  return {
    ...json ? { "Content-Type": "application/json" } : {},
    ...token ? { Authorization: `Bearer ${token}` } : {}
  };
};
function TopupRequestsPage() {
  const [requests, setRequests] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [filter, setFilter] = reactExports.useState("pending");
  const [actionLoading, setActionLoading] = reactExports.useState(null);
  const [notes, setNotes] = reactExports.useState({});
  const [activeId, setActiveId] = reactExports.useState(null);
  const [error, setError] = reactExports.useState("");
  const [requestsError, setRequestsError] = reactExports.useState("");
  const hasLoadedRequests = reactExports.useRef(false);
  const [usdtPhpRate, setUsdtPhpRate] = reactExports.useState(58);
  const [rateSource, setRateSource] = reactExports.useState("");
  const [rateLoading, setRateLoading] = reactExports.useState(false);
  const [rateInput, setRateInput] = reactExports.useState("");
  const [rateEditMode, setRateEditMode] = reactExports.useState(false);
  const [liveRateLoading, setLiveRateLoading] = reactExports.useState(false);
  const [liveRate, setLiveRate] = reactExports.useState(null);
  const [trc20Address, setTrc20Address] = reactExports.useState("");
  const [addressLoading, setAddressLoading] = reactExports.useState(false);
  const [addressInput, setAddressInput] = reactExports.useState("");
  const [addressEditMode, setAddressEditMode] = reactExports.useState(false);
  const [search, setSearch] = reactExports.useState("");
  const [selectedIds, setSelectedIds] = reactExports.useState([]);
  const fetchRate = reactExports.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/app-settings/usdt-php-rate", { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        setUsdtPhpRate(d.rate);
        setRateSource(d.source || "Standard SwiftPay rate");
        setRateInput(String(d.rate));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);
  const fetchLiveRate = async () => {
    setLiveRateLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/app-settings/usdt-php-rate/live", { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        setLiveRate(d.rate);
        setRateInput(d.rate.toFixed(2));
        if (!rateEditMode) setRateEditMode(true);
      } else {
        const d = await res.json();
        setError(d.detail || "Failed to fetch live rate.");
      }
    } catch (e) {
      setError(e.message || "Failed to fetch live rate.");
    }
    setLiveRateLoading(false);
  };
  const fetchAddress = reactExports.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/app-settings/usdt-trc20-address");
      if (res.ok) {
        const d = await res.json();
        setTrc20Address(d.address);
        setAddressInput(d.address);
      } else {
        setError("Failed to load TRC20 deposit address.");
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load TRC20 deposit address.");
    }
  }, []);
  const saveRate = async () => {
    const parsed = parseFloat(rateInput);
    if (!parsed || parsed <= 0) {
      setError("Rate must be a positive number.");
      return;
    }
    setRateLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/app-settings/usdt-php-rate", {
        method: "PUT",
        credentials: "include",
        headers: authHeaders(true),
        body: JSON.stringify({ rate: parsed })
      });
      if (res.ok) {
        const d = await res.json();
        setUsdtPhpRate(d.rate);
        setRateInput(String(d.rate));
        setRateEditMode(false);
        setLiveRate(null);
      } else {
        const d = await res.json();
        setError(d.detail || "Failed to update rate");
      }
    } catch (e) {
      setError(e.message);
    }
    setRateLoading(false);
  };
  const cancelRateEdit = () => {
    setRateEditMode(false);
    setRateInput(String(usdtPhpRate));
    setLiveRate(null);
  };
  const saveAddress = async () => {
    const addr = addressInput.trim();
    if (!addr) {
      setError("Address must not be empty.");
      return;
    }
    if (!addr.startsWith("T") || addr.length !== 34) {
      setError("Invalid TRC20 address. Must start with 'T' and be exactly 34 characters.");
      return;
    }
    setAddressLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/app-settings/usdt-trc20-address", {
        method: "PUT",
        credentials: "include",
        headers: authHeaders(true),
        body: JSON.stringify({ address: addr })
      });
      if (res.ok) {
        const d = await res.json();
        setTrc20Address(d.address);
        setAddressInput(d.address);
        setAddressEditMode(false);
      } else {
        const d = await res.json();
        setError(d.detail || "Failed to update address");
      }
    } catch (e) {
      setError(e.message);
    }
    setAddressLoading(false);
  };
  const openReceiptFile = async (fileId) => {
    const token = getStoredToken();
    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      setError("Popup blocked. Please allow popups and try again.");
      return;
    }
    newWindow.document.write('<p style="font-family: sans-serif; padding: 1rem;">Loading receipt...</p>');
    try {
      const headers = new Headers();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const res = await fetch(`/api/v1/telegram/file/${encodeURIComponent(fileId)}`, { headers });
      if (!res.ok) {
        throw new Error(`Failed to load receipt (${res.status})`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      newWindow.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 6e4);
    } catch (err) {
      newWindow.close();
      setError((err == null ? void 0 : err.message) || "Unable to open receipt.");
    }
  };
  const fetchRequests = reactExports.useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const url = filter ? `/api/v1/topup?status=${filter}` : "/api/v1/topup";
      const res = await fetch(url, { credentials: "include", headers: authHeaders() });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error((data == null ? void 0 : data.detail) || `Failed to load top-up requests (${res.status}).`);
      }
      if (!Array.isArray(data == null ? void 0 : data.items)) {
        throw new Error("The server returned an invalid top-up request list.");
      }
      setRequests(data.items);
      setRequestsError("");
    } catch (e) {
      console.error("Top-up request fetch failed:", e);
      setRequestsError(e instanceof Error ? e.message : "Failed to load top-up requests.");
    } finally {
      hasLoadedRequests.current = true;
      setLoading(false);
    }
  }, [filter]);
  reactExports.useEffect(() => {
    fetchRate();
    fetchAddress();
    void fetchRequests(!hasLoadedRequests.current);
    const id = setInterval(() => void fetchRequests(), 3e4);
    return () => clearInterval(id);
  }, [fetchRate, fetchAddress, fetchRequests]);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" }) });
  const doAction = async (id, action) => {
    setActionLoading(id);
    setError("");
    try {
      const res = await fetch(`/api/v1/topup/${id}/${action}`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(true),
        body: JSON.stringify({ note: notes[id] || (action === "approve" ? "Approved" : "Rejected by admin") })
      });
      if (res.ok) {
        ue.success(`Top-up ${action}d successfully`);
        setNotes((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
        setActiveId(null);
        void fetchRequests();
      } else {
        const d = await res.json();
        setError(d.detail || `Failed to ${action}`);
      }
    } catch (e) {
      setError(e.message);
    }
    setActionLoading(null);
  };
  const uniqueRequestList = uniqueRequests(requests);
  const pending_count = uniqueRequestList.filter((r) => r.status === "pending").length;
  const visibleRequests = uniqueRequestList.filter((req) => {
    const query = search.trim().toLowerCase();
    return !query || [req.user_name, req.telegram_username, req.chat_id, String(req.id)].some((value) => value == null ? void 0 : value.toLowerCase().includes(query));
  });
  const toggleSelected = (id) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
  const runBulk = async (action) => {
    for (const id of selectedIds) await doAction(id, action);
    setSelectedIds([]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SiteContainer, { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-xl font-semibold text-foreground flex items-center gap-2 flex-wrap", children: [
          "Topup Requests",
          pending_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full", children: pending_count })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-0.5", children: "Review and approve USDT TRC20 → PHP wallet top-ups" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search user, chat ID, or request ID", className: "w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-blue-500" })
        ] }),
        selectedIds.length > 0 && filter === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => runBulk("approve"), className: "rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white", children: [
            "Approve ",
            selectedIds.length
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => runBulk("reject"), className: "rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white", children: [
            "Reject ",
            selectedIds.length
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => void fetchRequests(),
          type: "button",
          "aria-label": "Refresh top-up requests",
          title: "Refresh top-up requests",
          className: "flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm border border-border px-3 py-1.5 rounded-lg transition-colors shrink-0",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
            " Refresh"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-background border border-blue-500/20 rounded-2xl p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-blue-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs", children: "USDT → PHP Exchange Rate" }),
          rateSource && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-[10px] mt-0.5", children: [
            "Source: ",
            rateSource
          ] }),
          rateEditMode ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-sm", children: "₱" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                value: rateInput,
                onChange: (e) => setRateInput(e.target.value),
                step: "0.01",
                min: "0.01",
                className: "w-28 bg-muted border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:border-blue-500/50"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-xs", children: "PHP per USDT" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-foreground font-semibold text-lg", children: [
            "₱",
            usdtPhpRate.toFixed(2),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-sm font-normal", children: "per USDT" })
          ] }),
          liveRate !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-blue-400 text-xs mt-0.5", children: [
            "Live market rate: ₱",
            liveRate.toFixed(2),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "(CoinGecko)" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: fetchLiveRate,
            disabled: liveRateLoading,
            type: "button",
            className: "text-xs px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `inline-block mr-1.5 h-3.5 w-3.5 ${liveRateLoading ? "animate-spin" : ""}` }),
              liveRateLoading ? "Fetching…" : "Live Rate"
            ]
          }
        ),
        rateEditMode ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: saveRate,
              disabled: rateLoading,
              type: "button",
              className: "text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors",
              children: rateLoading ? "Saving…" : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "inline-block mr-1.5 h-3.5 w-3.5" }),
                "Save Rate"
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: cancelRateEdit,
              type: "button",
              className: "text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "inline-block mr-1.5 h-3.5 w-3.5" }),
                "Cancel"
              ]
            }
          )
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setRateEditMode(true),
            type: "button",
            className: "text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "inline-block mr-1.5 h-3.5 w-3.5" }),
              "Edit Rate"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-background border border-teal-500/20 rounded-2xl p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4 text-teal-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs", children: "USDT TRC20 Deposit Address" }),
          addressEditMode ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: addressInput,
              onChange: (e) => setAddressInput(e.target.value),
              placeholder: "T… (34-char TRC20 address)",
              className: "mt-1 w-full bg-muted border border-border rounded-lg px-2 py-1 text-sm text-foreground font-mono focus:outline-none focus:border-teal-500/50"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-mono text-sm mt-0.5 break-all", children: trc20Address || "—" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 shrink-0", children: addressEditMode ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: saveAddress,
            disabled: addressLoading,
            type: "button",
            className: "text-xs px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white disabled:opacity-50 transition-colors",
            children: addressLoading ? "Saving…" : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "inline-block mr-1.5 h-3.5 w-3.5" }),
              "Save Address"
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => {
              setAddressEditMode(false);
              setAddressInput(trc20Address);
            },
            type: "button",
            className: "text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "inline-block mr-1.5 h-3.5 w-3.5" }),
              "Cancel"
            ]
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setAddressEditMode(true),
          type: "button",
          className: "text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "inline-block mr-1.5 h-3.5 w-3.5" }),
            "Edit Address"
          ]
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto [overflow-scrolling:touch]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 min-w-max", children: ["pending", "approved", "rejected", ""].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setFilter(s),
        className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === s ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-white"}`,
        children: s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"
      },
      s || "all"
    )) }) }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3", children: error }),
    requestsError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        requestsError,
        requests.length > 0 ? " Showing previously loaded requests." : ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => void fetchRequests(),
          className: "inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-1.5 font-medium hover:bg-red-500/10",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
            " Retry"
          ]
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [...Array(3)].map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-background border border-border/40 rounded-2xl p-4 animate-pulse", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-muted/50" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-32 bg-muted/50 rounded" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-48 bg-muted/30 rounded" })
      ] })
    ] }) }, i)) }) : visibleRequests.length === 0 && requestsError ? null : visibleRequests.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl p-12 flex flex-col items-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-6 w-6 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground font-medium", children: [
        "No ",
        filter,
        " requests"
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: visibleRequests.map((req) => {
      const isActive = activeId === req.id;
      const phpEquivalent = (req.amount_usdt * usdtPhpRate).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 flex items-start gap-4", children: [
          req.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: selectedIds.includes(req.id), onChange: () => toggleSelected(req.id), className: "mt-3 h-4 w-4 rounded border-border", "aria-label": `Select request ${req.id}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-5 w-5 text-emerald-400" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold", children: "Top-up request" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                StatusBadge,
                {
                  status: req.status === "approved" ? "completed" : getStatusType(req.status),
                  size: "sm",
                  showDot: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-sm mt-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-medium", children: req.user_name || req.telegram_username || req.chat_id }),
              " · ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-emerald-400 font-semibold", children: [
                "$",
                req.amount_usdt.toFixed(2),
                " USDT"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground mx-1", children: "→" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-blue-400 font-semibold", children: [
                "₱",
                phpEquivalent,
                " PHP"
              ] }),
              " · ",
              "Request #",
              req.id,
              " · ",
              fmt_time(req.created_at)
            ] }),
            req.note && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-xs mt-1", children: [
              "Note: ",
              req.note
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs ${req.receipt_file_id ? "text-emerald-400" : "text-amber-400"}`, children: req.receipt_file_id ? "📎 Receipt uploaded" : "⚠️ No receipt yet" }),
              req.receipt_file_id && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => openReceiptFile(req.receipt_file_id),
                  className: "text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition-colors",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
                    " View"
                  ]
                }
              )
            ] })
          ] }),
          req.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setActiveId(isActive ? null : req.id),
              className: "text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-slate-400 transition-colors",
              children: isActive ? "Cancel" : "Review"
            }
          ) })
        ] }),
        isActive && req.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-4 border-t border-border/40 pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 mb-3 text-xs text-blue-300", children: [
            "💱 Approving will credit ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              "₱",
              phpEquivalent,
              " PHP"
            ] }),
            " to the user's wallet",
            " ",
            "($",
            req.amount_usdt.toFixed(2),
            " USDT × ₱",
            usdtPhpRate.toFixed(2),
            " rate)"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-2", children: "Add a note (optional):" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: notes[req.id] || "",
              onChange: (e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value })),
              placeholder: "e.g. Receipt verified, transaction confirmed",
              className: "w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 mb-3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => doAction(req.id, "approve"),
                disabled: actionLoading === req.id,
                className: "flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm",
                children: [
                  actionLoading === req.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4" }),
                  "Approve & Credit ₱",
                  phpEquivalent,
                  " PHP"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => doAction(req.id, "reject"),
                disabled: actionLoading === req.id,
                className: "flex-1 flex items-center justify-center gap-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4" }),
                  " Reject"
                ]
              }
            )
          ] })
        ] })
      ] }, req.id);
    }) })
  ] }) });
}
export {
  TopupRequestsPage as default
};
