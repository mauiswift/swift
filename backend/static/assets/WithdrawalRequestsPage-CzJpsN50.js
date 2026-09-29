import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports } from "./router-vendor-C2eKMart.js";
import { f as useCollectionCurrency, a as useLanguage, u as useAuth, g as client, L as Layout, P as PaymentBrandLogo, b as ue, h as fmtCurrency } from "./index-BPsF-pQS.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-scP9MW2M.js";
import { Z as Search, R as RefreshCw, aU as DollarSign, o as CircleCheckBig, aS as CircleX, aO as Clock } from "./utils-vendor-HFbfdctU.js";
import "./ui-vendor-DsSOT9J9.js";
const getStatusConfig = (isKrwFlow) => ({
  pending: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5" }) },
  transferring: { color: "bg-violet-500/20 text-violet-400 border-violet-500/30", dot: "bg-violet-400", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }) },
  processing: { color: "bg-blue-500/20 text-blue-400 border-blue-500/30", dot: "bg-blue-400", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }) },
  completed: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3.5 w-3.5" }) },
  cancelled: { color: "bg-red-500/20 text-red-400 border-red-500/30", dot: "bg-red-400", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5" }) },
  failed: { color: "bg-red-500/20 text-red-400 border-red-500/30", dot: "bg-red-400", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5" }) }
});
const fmt_time = (s) => s ? new Date(s).toLocaleString() : "—";
const normalizeCurrency = (currency) => currency.toUpperCase() === "USD" ? "USDT" : currency;
const fmt_amount = (amt, cur) => fmtCurrency(amt, normalizeCurrency(cur));
function WithdrawalRequestsPage() {
  const { collectionCurrency } = useCollectionCurrency();
  const { language } = useLanguage();
  const { isSuperAdmin } = useAuth();
  const isKrwFlow = collectionCurrency === "KRW" && !isSuperAdmin;
  const tx = (en, ko, zh) => language === "zh" ? en : language === "en" ? en : ko;
  const statusConfig = getStatusConfig();
  const uiText = {
    heading: tx("Withdrawal Requests", "출금 요청"),
    description: tx("Review and approve user withdrawal requests (PHP, KRW and USDT).", "KRW 출금 요청을 검토하고 승인하세요."),
    refresh: tx("Refresh", "새로 고침"),
    review: tx("Review", "검토"),
    cancel: tx("Cancel", "취소"),
    empty: tx("No withdrawal requests", "출금 요청이 없습니다"),
    requestPrefix: tx("Request #", "출금 요청 #")
  };
  const filterLabels = {
    pending: tx("Pending", "대기 중"),
    transferring: tx("Transferring", "이체 진행 중"),
    processing: tx("Processing", "처리 중"),
    completed: tx("Completed", "완료됨"),
    cancelled: tx("Cancelled", "취소됨"),
    failed: tx("Failed", "실패"),
    "": tx("All", "전체")
  };
  const [requests, setRequests] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [filter, setFilter] = reactExports.useState("pending");
  const [actionLoading, setActionLoading] = reactExports.useState(null);
  const [notes, setNotes] = reactExports.useState({});
  const [activeId, setActiveId] = reactExports.useState(null);
  const [error, setError] = reactExports.useState("");
  const [search, setSearch] = reactExports.useState("");
  const [selectedIds, setSelectedIds] = reactExports.useState([]);
  const fetchRequests = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const url = filter && filter !== "all" ? `/api/v1/wallet/admin/withdrawals?status=${filter}` : `/api/v1/wallet/admin/withdrawals`;
      const { data, ok } = await client.get(url);
      if (ok) {
        setRequests((data == null ? void 0 : data.items) || []);
      }
    } catch (e) {
      console.error(e);
      setError(isKrwFlow ? "출금 요청을 불러오지 못했습니다." : "Failed to load withdrawal requests");
    }
    setLoading(false);
  }, [filter]);
  reactExports.useEffect(() => {
    fetchRequests();
    const id = setInterval(fetchRequests, 3e4);
    return () => clearInterval(id);
  }, [fetchRequests]);
  if (loading && !requests.length) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" }) });
  const pending_count = requests.filter((r) => ["pending", "processing", "transferring"].includes(r.status)).length;
  const visibleRequests = requests.filter((req) => {
    const query = search.trim().toLowerCase();
    return !query || [req.user_id, req.account_number, req.account_name, req.bank_code, req.usdt_address, String(req.id)].some((value) => value == null ? void 0 : value.toLowerCase().includes(query));
  });
  const toggleSelected = (id) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
  const runBulk = async (action) => {
    for (const id of selectedIds) await doAction(id, action);
    setSelectedIds([]);
  };
  const reconcileWithdrawal = async (id) => {
    setActionLoading(id);
    setError("");
    try {
      const { data, ok } = await client.request(`/api/v1/wallet/admin/withdrawals/${id}/reconcile`, "POST");
      if (!ok) {
        const message = (data == null ? void 0 : data.detail) || "Failed to refresh SwiftPay withdrawal status";
        setError(message);
        ue.error(message);
        return;
      }
      ue.success((data == null ? void 0 : data.message) || "SwiftPay withdrawal status refreshed");
      await fetchRequests();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network error. Please try again.";
      setError(message);
      ue.error(message);
    } finally {
      setActionLoading(null);
    }
  };
  const doAction = async (id, action) => {
    setActionLoading(id);
    setError("");
    try {
      const endpoint = action === "approve" ? `/api/v1/wallet/admin/withdrawals/${id}/approve` : `/api/v1/wallet/admin/withdrawals/${id}/reject`;
      const payload = action === "cancel" ? { reason: notes[id] || "Rejected by admin" } : void 0;
      const { data, ok } = await client.request(endpoint, "POST", payload);
      if (ok) {
        setNotes((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
        setActiveId(null);
        ue.success(action === "approve" ? (data == null ? void 0 : data.message) || (isKrwFlow ? "출금이 처리되어 이체되었습니다." : "Withdrawal processed successfully") : (data == null ? void 0 : data.message) || (isKrwFlow ? "출금이 거절되었습니다." : "Withdrawal rejected"));
        fetchRequests();
      } else {
        const message = (data == null ? void 0 : data.detail) || (isKrwFlow ? `출금 ${action === "approve" ? "승인" : "거절"}에 실패했습니다.` : `Failed to ${action} withdrawal`);
        setError(message);
        ue.error(message);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : isKrwFlow ? "네트워크 오류가 발생했습니다. 다시 시도해주세요." : "Network error. Please try again.";
      setError(message);
      ue.error(message);
    }
    setActionLoading(null);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-5 sm:space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl", children: [
          uiText.heading,
          pending_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full", children: pending_count })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-0.5", children: uiText.description })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-0 flex-1 sm:w-64 lg:w-80", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: tx("Search user, bank, account, address, or request ID", "사용자, 은행, 계좌, 주소 또는 요청 ID 검색"), className: "w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-blue-500" })
        ] }),
        selectedIds.length > 0 && ["pending", "processing"].includes(filter) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 sm:flex", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => runBulk("approve"), className: "min-h-11 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white", children: [
            tx("Approve", "승인"),
            " ",
            selectedIds.length
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => runBulk("cancel"), className: "min-h-11 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white", children: [
            tx("Reject", "거절"),
            " ",
            selectedIds.length
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: fetchRequests,
          className: "flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:w-auto",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
            " ",
            uiText.refresh
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto [overflow-scrolling:touch]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 min-w-max", children: ["pending", "processing", "completed", "cancelled", "failed", ""].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setFilter(s),
        className: `min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${filter === s ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-white"}`,
        children: filterLabels[s || ""] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : tx("All", "전체"))
      },
      s || "all"
    )) }) }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-red-400 text-sm bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3", children: error }),
    visibleRequests.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl p-12 flex flex-col items-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-6 w-6 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-medium", children: uiText.empty })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: visibleRequests.map((req) => {
      var _a;
      const sc = statusConfig[req.status] || statusConfig.pending;
      const isActive = activeId === req.id;
      const currency = normalizeCurrency(req.currency || "PHP");
      const isPHP = currency !== "USDT" || !!req.bank_code;
      const brand = isPHP ? req.bank_code || "Bank transfer" : "USDT";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:gap-4 sm:p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 sm:contents", children: [
            ["pending", "processing"].includes(req.status) && /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: selectedIds.includes(req.id), onChange: () => toggleSelected(req.id), className: "h-5 w-5 self-start rounded border-border sm:mt-3 sm:h-4 sm:w-4", "aria-label": `Select request ${req.id}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 shrink-0 rounded-xl border border-blue-500/20 bg-blue-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand, size: "sm", className: "h-9 w-9 border-0 bg-transparent p-0 shadow-none" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold", children: req.user_id }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${sc.color}`, children: [
                sc.icon,
                " ",
                req.status
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 break-words text-sm leading-6 text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-400 font-semibold", children: fmt_amount(req.amount, currency) }),
              Boolean(req.processing_fee) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground text-xs", children: [
                " + fee ",
                fmt_amount(req.processing_fee || 0, req.currency)
              ] }),
              isPHP ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                " via ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-semibold", children: req.bank_code || "Bank Transfer" }),
                " · ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-xs", children: req.account_number }),
                " · ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-semibold", children: req.account_name })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                " to ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-semibold", children: req.usdt_platform }),
                " · ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono text-xs", children: [
                  (_a = req.usdt_address) == null ? void 0 : _a.slice(0, 20),
                  "..."
                ] })
              ] }),
              " · ",
              uiText.requestPrefix,
              req.id,
              " · ",
              fmt_time(req.created_at)
            ] }),
            (req.description || req.failure_reason) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mt-1", children: req.failure_reason ? `Reason: ${req.failure_reason}` : `Note: ${req.description}` })
          ] }),
          req.status === "transferring" && currency === "PHP" && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => reconcileWithdrawal(req.id),
              disabled: actionLoading === req.id,
              className: "flex min-h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg border border-blue-500/40 px-3 py-1.5 text-xs text-blue-300 transition-colors hover:border-blue-400 disabled:opacity-50 sm:min-h-9 sm:w-auto",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-3.5 w-3.5 ${actionLoading === req.id ? "animate-spin" : ""}` }),
                "Refresh status"
              ]
            }
          ),
          ["pending", "processing"].includes(req.status) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex w-full shrink-0 items-center gap-2 sm:w-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setActiveId(isActive ? null : req.id),
              className: "min-h-11 w-full rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-slate-400 sm:min-h-9 sm:w-auto",
              children: isActive ? uiText.cancel : uiText.review
            }
          ) })
        ] }),
        isActive && ["pending", "processing"].includes(req.status) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border/40 px-3 pb-3 pt-3 sm:px-4 sm:pb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 mb-3 text-xs text-blue-300", children: [
            "✅ Approving will process ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              fmt_amount(req.amount, req.currency),
              " ",
              req.currency
            ] }),
            " to the user"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-2", children: "Add a note (optional):" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: notes[req.id] || "",
              onChange: (e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value })),
              placeholder: "e.g., Processing initiated, expected completion in 1-2 business days",
              className: "w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 mb-3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-2 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => doAction(req.id, "approve"),
                disabled: actionLoading === req.id,
                className: "flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2 rounded-xl transition-colors text-sm",
                children: [
                  actionLoading === req.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4" }),
                  "Approve & Process"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => doAction(req.id, "cancel"),
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
  WithdrawalRequestsPage as default
};
