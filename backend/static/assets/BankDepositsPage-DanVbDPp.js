import { j as jsxRuntimeExports } from "./query-vendor-DbSHy-Pt.js";
import { a as reactExports } from "./router-vendor-BtBWUifS.js";
import { a as useLanguage, h as client, L as Layout, i as fmtCurrency, P as PaymentBrandLogo, b as ue } from "./index-DaEfChDe.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-BXMma-RE.js";
import { a3 as Search, R as RefreshCw, Y as Building2, aW as Eye, o as CircleCheckBig, a0 as CircleX, a1 as Clock } from "./utils-vendor-CNf7xaAj.js";
import "./ui-vendor-CliYdUyU.js";
const statusConfig = {
  pending: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5" }) },
  approved: { color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-3.5 w-3.5" }) },
  rejected: { color: "bg-red-500/20 text-red-400 border-red-500/30", dot: "bg-red-400", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-3.5 w-3.5" }) }
};
const fmt_time = (s) => s ? new Date(s).toLocaleString() : "—";
function BankDepositsPage() {
  const { language } = useLanguage();
  const tx = (en, ko, zh) => language === "zh" ? zh ?? en : language === "en" ? en : ko;
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
      const url = filter ? `/api/v1/bank-deposits?status=${filter}` : "/api/v1/bank-deposits";
      const { data, ok } = await client.get(url);
      if (ok) {
        setRequests((data == null ? void 0 : data.items) || []);
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
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" }) });
  const doAction = async (id, action) => {
    setActionLoading(id);
    setError("");
    try {
      const { data, ok } = await client.request(`/api/v1/bank-deposits/${id}/${action}`, "POST", {
        note: notes[id] || (action === "approve" ? "Approved" : "Rejected by admin")
      });
      if (ok) {
        if (action === "approve") {
          ue.success((data == null ? void 0 : data.message) || "Deposit approved and credited to the user wallet");
        } else {
          ue.success("Deposit rejected successfully");
        }
        setNotes((prev) => {
          const n = { ...prev };
          delete n[id];
          return n;
        });
        setActiveId(null);
        fetchRequests();
      } else {
        setError((data == null ? void 0 : data.detail) || `Failed to ${action}`);
      }
    } catch (e) {
      setError(e.message);
    }
    setActionLoading(null);
  };
  const openReceiptFile = async (fileId) => {
    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      setError("Popup blocked. Please allow popups and try again.");
      return;
    }
    newWindow.document.write('<p style="font-family: sans-serif; padding: 1rem;">Loading receipt...</p>');
    try {
      const endpoint = fileId.startsWith("private-receipt:") || fileId.startsWith("/uploads/") ? `/api/v1/receipts/${encodeURIComponent(fileId)}` : `/api/v1/telegram/file/${encodeURIComponent(fileId)}`;
      const res = await client.fetch(endpoint);
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
  const pending_count = requests.filter((r) => r.status === "pending").length;
  const visibleRequests = requests.filter((req) => {
    const query = search.trim().toLowerCase();
    return !query || [req.user_name, req.telegram_username, req.chat_id, req.account_number, req.channel, String(req.id)].some((value) => value == null ? void 0 : value.toLowerCase().includes(query));
  });
  const toggleSelected = (id) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
  const runBulk = async (action) => {
    for (const id of selectedIds) await doAction(id, action);
    setSelectedIds([]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto w-full max-w-7xl space-y-5 sm:space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl", children: [
          tx("Bank Deposit Requests", "은행 입금 요청"),
          pending_count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full", children: pending_count })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-0.5", children: tx("Review bank and e-wallet deposits waiting for confirmation", "확인을 기다리는 은행 및 전자지갑 입금을 검토하세요") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-0 flex-1 sm:w-64 lg:w-80", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: tx("Search user, account, channel, or request ID", "사용자, 계좌, 채널 또는 요청 ID 검색"), className: "w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-blue-500" })
        ] }),
        selectedIds.length > 0 && filter === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 sm:flex", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => runBulk("approve"), className: "min-h-11 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white", children: [
            tx("Approve", "승인"),
            " ",
            selectedIds.length
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => runBulk("reject"), className: "min-h-11 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white", children: [
            tx("Reject", "거부"),
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
            tx("Refresh", "새로고침")
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto [overflow-scrolling:touch]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 min-w-max", children: ["pending", "approved", "rejected", ""].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setFilter(s),
        className: `min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${filter === s ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-white"}`,
        children: s ? language === "ko" ? { pending: "대기 중", approved: "승인됨", rejected: "거부됨" }[s] : s.charAt(0).toUpperCase() + s.slice(1) : tx("All", "전체")
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
    ] }) }, i)) }) : visibleRequests.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl p-12 flex flex-col items-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-6 w-6 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground font-medium", children: filter ? tx(`No ${filter} requests`, `${filter === "pending" ? "대기 중인" : filter === "approved" ? "승인된" : "거부된"} 입금 요청이 없습니다`) : tx("No bank deposit requests", "은행 입금 요청이 없습니다") })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: visibleRequests.map((req) => {
      const sc = statusConfig[req.status] || statusConfig.pending;
      const isActive = activeId === req.id;
      const depositCurrency = req.currency || "PHP";
      const amountFormatted = fmtCurrency(req.amount_php, depositCurrency);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-background border border-border/40 rounded-2xl overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 p-3 sm:flex-row sm:items-start sm:gap-4 sm:p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 sm:contents", children: [
            req.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: selectedIds.includes(req.id), onChange: () => toggleSelected(req.id), className: "h-5 w-5 self-start rounded border-border sm:mt-3 sm:h-4 sm:w-4", "aria-label": `Select request ${req.id}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 shrink-0 rounded-xl border border-blue-500/20 bg-blue-500/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: req.channel, size: "sm", className: "border-0 bg-transparent" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-foreground font-semibold", children: req.user_name || (req.telegram_username ? `@${req.telegram_username}` : req.chat_id) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${sc.color}`, children: [
                sc.icon,
                " ",
                req.status
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground text-sm mt-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-400 font-semibold", children: amountFormatted }),
              " via ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground font-semibold", children: req.channel }),
              " · ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-mono text-xs", children: req.account_number }),
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
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-x-2 gap-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs ${req.receipt_file_id ? "text-emerald-400" : "text-amber-400"}`, children: req.receipt_file_id ? "📎 Receipt uploaded" : "⚠️ No receipt yet" }),
              req.receipt_file_id && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => openReceiptFile(req.receipt_file_id),
                  className: "app-touch-target -my-1 inline-flex items-center gap-1 text-xs text-blue-400 transition-colors hover:text-blue-300",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
                    " View"
                  ]
                }
              )
            ] })
          ] }),
          req.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex w-full shrink-0 items-center gap-2 sm:w-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => setActiveId(isActive ? null : req.id),
              className: "min-h-11 w-full rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-slate-400 sm:min-h-9 sm:w-auto",
              children: isActive ? tx("Cancel", "취소") : tx("Review", "검토")
            }
          ) })
        ] }),
        isActive && req.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border/40 px-3 pb-3 pt-3 sm:px-4 sm:pb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2 mb-3 text-xs text-blue-300", children: [
            "✅ ",
            tx("Approving will credit", "승인하면"),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: amountFormatted }),
            " ",
            tx("to the user's wallet", "이용자 지갑에 충전됩니다")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-xs mb-2", children: tx("Add a note (optional):", "메모 추가(선택 사항):") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: notes[req.id] || "",
              onChange: (e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value })),
              placeholder: "e.g. Receipt verified, transfer confirmed",
              className: "w-full bg-muted/60 border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 mb-3"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-2 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => doAction(req.id, "approve"),
                disabled: actionLoading === req.id,
                className: "flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50",
                children: [
                  actionLoading === req.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4" }),
                  "Approve & Credit ",
                  amountFormatted
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => doAction(req.id, "reject"),
                disabled: actionLoading === req.id,
                className: "flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-red-600/80 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50",
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
  BankDepositsPage as default
};
