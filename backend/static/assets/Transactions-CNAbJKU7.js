import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { f as useNavigate, a as reactExports, L as Link } from "./router-vendor-N0qZPfHZ.js";
import { u as useAuth, v as useCollectionCurrency, a as useLanguage, i as client, a2 as usePaymentEvents, w as Layout, e as Button, o as Card, s as CardContent, I as Input, K as Select, M as SelectTrigger, N as SelectValue, O as SelectContent, R as SelectItem, a3 as LoadingSpinner, P as PaymentBrandLogo, a1 as PaymentStatusBadge, l as fmtCurrency, a4 as normalizePublicCurrency, a5 as formatTransactionDate, b as ue, a0 as getTransactionStatus } from "./index-C682rKfx.js";
import { S as SiteContainer } from "./SiteContainer-CKI0kKxk.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-Bs5L13ZF.js";
import { g as getTransactionPaymentMethodBrand } from "./paymentMethodBranding-D-Svemwz.js";
/* empty css                         */
import { aD as Wifi, b5 as WifiOff, R as RefreshCw, aT as Plus, a5 as Search, h as CircleCheck, aC as Clock3, a2 as CircleX, F as FileText, aG as Copy, aI as ExternalLink, b6 as CopyPlus, J as ChevronLeft, G as ChevronRight } from "./utils-vendor-Bm5lXE_Q.js";
import "./ui-vendor-CXLHQPHT.js";
function getDisplayStatus(transaction) {
  return getTransactionStatus(transaction);
}
function Transactions() {
  const { user } = useAuth();
  const { collectionCurrency } = useCollectionCurrency();
  const { language } = useLanguage();
  const isKorean = language === "ko";
  const isChinese = language === "zh";
  const dateLocale = isChinese ? "zh-CN" : isKorean ? "ko-KR" : "en-PH";
  const ui = isChinese ? {
    title: "交易记录",
    description: "实时查看支付活动、状态和客户详情。",
    live: "实时更新",
    offline: "离线更新",
    newPayment: "新支付",
    search: "按 ID、说明、客户搜索...",
    status: "状态",
    allStatus: "全部状态",
    allTypes: "全部类型",
    noTransactions: "没有找到交易记录",
    transaction: "交易",
    descriptionHeader: "说明",
    customer: "客户",
    amount: "金额",
    date: "日期",
    created: "创建",
    paid: "已支付",
    actions: "操作",
    success: "成功",
    processing: "处理中",
    failed: "失败",
    noResultsHint: "尝试调整筛选条件或创建一笔新支付。",
    invoiceType: "发票",
    qrType: "二维码支付",
    paymentLinkType: "付款链接",
    type: "类型",
    customerFallback: "未提供客户信息",
    descriptionFallback: "支付交易",
    showing: "显示",
    of: "共",
    activeFilters: " 个筛选条件",
    transactionCount: " 笔交易",
    clearFilters: "清除筛选"
  } : isKorean ? {
    title: "거래 내역",
    description: "결제 활동, 상태 및 고객 정보를 실시간으로 확인하세요.",
    live: "실시간 업데이트",
    offline: "오프라인 업데이트",
    newPayment: "새 결제",
    search: "ID, 설명, 고객 검색...",
    status: "상태",
    allStatus: "모든 상태",
    allTypes: "모든 유형",
    noTransactions: "거래 내역이 없습니다",
    transaction: "거래",
    descriptionHeader: "설명",
    customer: "고객",
    amount: "금액",
    date: "날짜",
    created: "생성",
    paid: "결제 완료",
    actions: "작업",
    success: "성공",
    processing: "처리 중",
    failed: "실패",
    noResultsHint: "필터를 변경하거나 새 결제를 만들어 보세요.",
    invoiceType: "인보이스",
    qrType: "QR 결제",
    paymentLinkType: "결제 링크",
    type: "유형",
    customerFallback: "고객 정보 없음",
    descriptionFallback: "결제 거래",
    showing: "표시 중",
    of: "/",
    activeFilters: "개 필터 적용",
    transactionCount: "건의 거래",
    clearFilters: "필터 초기화"
  } : {
    title: "Transactions",
    description: "Track payment activity, statuses, and customer details in real time.",
    live: "Live updates",
    offline: "Offline updates",
    newPayment: "New Payment",
    search: "Search by ID, description, customer...",
    status: "Status",
    allStatus: "All Status",
    allTypes: "All Types",
    noTransactions: "No transactions found",
    transaction: "Transaction",
    descriptionHeader: "Description",
    customer: "Customer",
    amount: "Amount",
    date: "Date",
    created: "Created",
    paid: "Paid",
    actions: "Actions",
    success: "Success",
    processing: "Processing",
    failed: "Failed",
    noResultsHint: "Try changing filters or create a new payment to get started.",
    invoiceType: "Invoice",
    qrType: "QR payment",
    paymentLinkType: "Payment link",
    type: "Type",
    customerFallback: "Customer not provided",
    descriptionFallback: "Payment transaction",
    showing: "Showing",
    of: "of",
    activeFilters: " filters active",
    transactionCount: " transactions",
    clearFilters: "Clear filters"
  };
  const navigate = useNavigate();
  const [transactions, setTransactions] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [total, setTotal] = reactExports.useState(0);
  const [page, setPage] = reactExports.useState(0);
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [typeFilter, setTypeFilter] = reactExports.useState("all");
  const [updatedTxnIds, setUpdatedTxnIds] = reactExports.useState(/* @__PURE__ */ new Set());
  const [loadError, setLoadError] = reactExports.useState("");
  const limit = 10;
  const fetchTransactions = reactExports.useCallback(async () => {
    var _a, _b, _c;
    if (!user) return;
    setLoadError("");
    try {
      const query = {};
      query.currency = collectionCurrency.toUpperCase();
      if (statusFilter !== "all") query.status = statusFilter;
      if (typeFilter !== "all") query.transaction_type = typeFilter;
      const res = await Promise.race([
        client.entities.transactions.query({
          query,
          sort: "-created_at",
          limit,
          skip: page * limit
        }),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("Transaction request timed out")), 1e4))
      ]);
      if (!res.ok) throw new Error(((_a = res.data) == null ? void 0 : _a.detail) || "Unable to load transactions");
      const items = Array.isArray((_b = res.data) == null ? void 0 : _b.items) ? res.data.items : [];
      setTransactions(items);
      setTotal(Number((_c = res.data) == null ? void 0 : _c.total) || 0);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
      setTransactions([]);
      setTotal(0);
      setLoadError(err instanceof Error ? err.message : "Unable to load transactions");
    } finally {
      setLoading(false);
    }
  }, [user, page, statusFilter, typeFilter, collectionCurrency]);
  const onStatusChangeCallback = reactExports.useCallback((event) => {
    fetchTransactions();
    if (event.transaction_id) {
      setUpdatedTxnIds((prev) => new Set(prev).add(event.transaction_id));
      setTimeout(() => {
        setUpdatedTxnIds((prev) => {
          const next = new Set(prev);
          next.delete(event.transaction_id);
          return next;
        });
      }, 3e3);
    }
  }, [fetchTransactions]);
  const paymentEventsOptions = reactExports.useMemo(
    () => ({
      enabled: !!user,
      onStatusChange: onStatusChangeCallback,
      pollInterval: 5e3
    }),
    [user, onStatusChangeCallback]
  );
  const { connected } = usePaymentEvents(paymentEventsOptions);
  reactExports.useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchTransactions();
    };
    load();
  }, [fetchTransactions]);
  reactExports.useEffect(() => {
    setPage(0);
  }, [collectionCurrency]);
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { connected, children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" }) });
  const filteredTxns = searchTerm ? transactions.filter(
    (t) => {
      var _a, _b, _c, _d;
      return ((_a = t.external_id) == null ? void 0 : _a.toLowerCase().includes(searchTerm.toLowerCase())) || ((_b = t.description) == null ? void 0 : _b.toLowerCase().includes(searchTerm.toLowerCase())) || ((_c = t.customer_name) == null ? void 0 : _c.toLowerCase().includes(searchTerm.toLowerCase())) || ((_d = t.customer_email) == null ? void 0 : _d.toLowerCase().includes(searchTerm.toLowerCase()));
    }
  ) : transactions;
  const totalPages = Math.ceil(total / limit);
  const activeFilterCount = [searchTerm, statusFilter !== "all" ? statusFilter : "", typeFilter !== "all" ? typeFilter : ""].filter(Boolean).length;
  const formatDate = (value) => formatTransactionDate(value, dateLocale);
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    ue.success("Copied to clipboard");
  };
  const cloneTransaction = (txn) => {
    const params = new URLSearchParams();
    params.set("type", txn.transaction_type);
    params.set("amount", String(txn.amount));
    if (txn.description) params.set("description", txn.description);
    if (txn.customer_name) params.set("customer_name", txn.customer_name);
    if (txn.customer_email) params.set("customer_email", txn.customer_email);
    navigate(`/pay-by-link/new?${params.toString()}`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { connected, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SiteContainer, { className: "payment-workspace !max-w-none !px-2 py-5 space-y-4 sm:!px-6 sm:py-8 sm:space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl sm:text-2xl font-semibold text-foreground", children: ui.title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500 mt-1", children: ui.description })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600", children: [
          connected ? /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { className: "h-3.5 w-3.5 text-slate-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { className: "h-3.5 w-3.5 text-slate-400" }),
          connected ? ui.live : ui.offline
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            size: "sm",
            onClick: () => {
              setLoading(true);
              void fetchTransactions();
            },
            "aria-label": "Refresh transactions",
            className: "h-9 w-9 border-slate-200 bg-white p-0",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/pay-by-link/new", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "bg-slate-900 hover:bg-slate-700 text-white shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 sm:mr-2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: ui.newPayment })
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-white border border-slate-200 mb-6 shadow-sm animate-fade-in-up animate-stagger-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              placeholder: ui.search,
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "pl-9 bg-slate-50 border-slate-200 text-foreground placeholder:text-muted-foreground"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: statusFilter, onValueChange: (v) => {
          setStatusFilter(v);
          setPage(0);
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full sm:w-[140px] bg-slate-50 border-slate-200 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: ui.status }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "bg-white border-slate-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", className: "text-foreground", children: ui.allStatus }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "paid", className: "text-emerald-700", children: isKorean ? "완료" : "Paid" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "completed", className: "text-emerald-700", children: isKorean ? "완료됨" : "Completed" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pending", className: "text-amber-700", children: isKorean ? "대기 중" : "Pending" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "processing", className: "text-amber-700", children: isKorean ? "처리 중" : "Processing" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "expired", className: "text-red-700", children: isKorean ? "만료" : "Expired" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "cancelled", className: "text-slate-700", children: isKorean ? "취소됨" : "Cancelled" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "failed", className: "text-red-700", children: isKorean ? "실패" : "Failed" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "rejected", className: "text-red-700", children: isKorean ? "거부됨" : "Rejected" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: typeFilter, onValueChange: (v) => {
          setTypeFilter(v);
          setPage(0);
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full sm:w-[160px] bg-slate-50 border-slate-200 text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: ui.type }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "bg-white border-slate-200", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", className: "text-foreground", children: ui.allTypes }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "invoice", className: "text-blue-700", children: ui.invoiceType }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "qr_code", className: "text-purple-700", children: ui.qrType }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "payment_link", className: "text-cyan-700", children: ui.paymentLinkType })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between gap-3 text-xs text-slate-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: activeFilterCount ? `${activeFilterCount}${ui.activeFilters}` : `${total}${ui.transactionCount}` }),
        activeFilterCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setSearchTerm("");
              setStatusFilter("all");
              setTypeFilter("all");
              setPage(0);
            },
            className: "font-semibold text-blue-600 hover:text-blue-700",
            children: ui.clearFilters
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 sm:gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-3 sm:p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-slate-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-lg font-semibold text-slate-900", children: transactions.filter((txn) => getDisplayStatus(txn) === "paid").length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs", children: ui.success })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-3 sm:p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock3, { className: "h-4 w-4 text-slate-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-lg font-semibold text-slate-900", children: transactions.filter((txn) => ["pending", "processing"].includes(getDisplayStatus(txn))).length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs", children: ui.processing })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-3 sm:p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 text-slate-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-lg font-semibold text-slate-900", children: transactions.filter((txn) => ["failed", "expired", "cancelled"].includes(getDisplayStatus(txn))).length }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs", children: ui.failed })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-white border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up animate-stagger-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-0", children: [
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSpinner, { message: "Fetching records" }) : loadError ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-6 py-16 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-slate-700", children: "Unable to load transactions" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-500", children: loadError }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", className: "mt-4", onClick: () => {
          setLoading(true);
          void fetchTransactions();
        }, children: "Try again" })
      ] }) : filteredTxns.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-16 px-6 animate-fade-in-up", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-7 w-7" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-700 font-medium", children: ui.noTransactions }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500 mt-1", children: ui.noResultsHint })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 p-3 md:hidden", children: filteredTxns.map((txn) => {
          const isUpdated = updatedTxnIds.has(txn.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "article",
            {
              onClick: () => navigate(`/payments/${txn.id}`),
              className: `rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition ${isUpdated ? "ring-2 ring-blue-400/50" : "active:bg-slate-50"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: getTransactionPaymentMethodBrand(txn), size: "sm", className: "h-9 min-w-12 max-w-16" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-semibold text-slate-900", children: getTransactionPaymentMethodBrand(txn) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "max-w-[180px] truncate text-[11px] text-slate-500", children: txn.external_id || `#${txn.id}` }),
                        txn.external_id && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Copy transaction ID", onClick: (event) => {
                          event.stopPropagation();
                          copyToClipboard(txn.external_id);
                        }, className: "text-slate-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3" }) })
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    PaymentStatusBadge,
                    {
                      transaction: txn,
                      size: "sm",
                      className: isUpdated ? "animate-pulse ring-2 ring-current scale-110" : void 0
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-end justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-600", children: txn.description || ui.descriptionFallback }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-slate-500", children: txn.customer_name || ui.customerFallback }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-slate-400", children: formatDate(txn.created_at) }),
                    txn.paid_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[11px] font-medium text-emerald-700", children: [
                      ui.paid,
                      ": ",
                      formatDate(txn.paid_at)
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-nowrap text-base font-semibold text-slate-900", children: fmtCurrency(Number(txn.amount || 0), normalizePublicCurrency(txn.currency)) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-end gap-1 border-t border-slate-100 pt-3", children: [
                  txn.payment_url && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: txn.payment_url, target: "_blank", rel: "noopener noreferrer", onClick: (event) => event.stopPropagation(), className: "rounded-lg p-2 text-blue-600 hover:bg-blue-50", "aria-label": "Open payment link", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" }) }),
                  txn.payment_url && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: (event) => {
                    event.stopPropagation();
                    copyToClipboard(txn.payment_url);
                  }, className: "rounded-lg p-2 text-slate-500 hover:bg-slate-100", "aria-label": "Copy payment link", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: (event) => {
                    event.stopPropagation();
                    cloneTransaction(txn);
                  }, className: "rounded-lg p-2 text-slate-500 hover:bg-slate-100", "aria-label": "Clone transaction", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CopyPlus, { className: "h-4 w-4" }) })
                ] })
              ]
            },
            txn.id
          );
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "app-table-scroll hidden md:block", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[720px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-slate-200 bg-slate-50/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3", children: ui.transaction }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3 hidden md:table-cell", children: ui.descriptionHeader }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3 hidden md:table-cell", children: ui.customer }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3", children: ui.amount }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3", children: ui.status }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("th", { className: "text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-4 py-3 hidden lg:table-cell", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: ui.date }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block normal-case tracking-normal font-normal", children: ui.paid })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 md:px-6 py-3", children: ui.actions })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: filteredTxns.map((txn) => {
            const isUpdated = updatedTxnIds.has(txn.id);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "tr",
              {
                onClick: () => navigate(`/payments/${txn.id}`),
                className: `border-b border-border/30 transition-all duration-500 ${isUpdated ? "bg-blue-500/10 ring-1 ring-inset ring-blue-500/30" : "hover:bg-muted/50"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 md:px-6 py-3 md:py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-[170px] items-center gap-2.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: getTransactionPaymentMethodBrand(txn), size: "sm", className: "h-7 min-w-12 max-w-16" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-sm font-medium text-foreground", children: getTransactionPaymentMethodBrand(txn) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-0.5 flex items-center gap-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "max-w-[150px] truncate text-[11px] text-muted-foreground font-mono", children: txn.external_id || `#${txn.id}` }),
                        txn.external_id && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", "aria-label": "Copy external transaction ID", title: "Copy external transaction ID", onClick: (event) => {
                          event.stopPropagation();
                          copyToClipboard(txn.external_id);
                        }, className: "shrink-0 text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3" }) })
                      ] })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 md:px-6 py-3 md:py-4 hidden md:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-foreground", children: txn.description || "-" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 md:px-6 py-3 md:py-4 hidden md:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-foreground", children: txn.customer_name || "-" }),
                    txn.customer_email && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: txn.customer_email })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 md:px-6 py-3 md:py-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-mono font-medium text-foreground", children: fmtCurrency(
                    typeof txn.amount === "number" ? txn.amount : Number(txn.amount || 0),
                    normalizePublicCurrency(txn.currency)
                  ) }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 md:px-6 py-3 md:py-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentStatusBadge, { transaction: txn, size: "sm" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 md:px-4 py-3 md:py-4 hidden lg:table-cell", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                    txn.created_at ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mr-1 text-[10px] uppercase tracking-wide text-slate-400", children: ui.created }),
                      formatDate(txn.created_at)
                    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "—" }),
                    txn.paid_at ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-emerald-600", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-medium", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mr-1 text-[10px] uppercase tracking-wide text-emerald-500/70", children: ui.paid }),
                      formatDate(txn.paid_at)
                    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "—" })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 md:px-6 py-3 md:py-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end space-x-1", children: [
                    txn.payment_url && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: txn.payment_url, target: "_blank", rel: "noopener noreferrer", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-blue-400 hover:text-blue-300 h-8 w-8 p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3.5 w-3.5" }) }) }),
                    txn.payment_url && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => copyToClipboard(txn.payment_url), className: "text-muted-foreground hover:text-foreground p-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        onClick: () => cloneTransaction(txn),
                        title: "Clone transaction",
                        className: "text-muted-foreground hover:text-foreground p-1",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(CopyPlus, { className: "h-3.5 w-3.5" })
                      }
                    )
                  ] }) })
                ]
              },
              txn.id
            );
          }) })
        ] }) })
      ] }),
      totalPages > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-6 py-4 border-t border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          ui.showing,
          " ",
          page * limit + 1,
          "-",
          Math.min((page + 1) * limit, total),
          " ",
          ui.of,
          " ",
          total
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              disabled: page === 0,
              onClick: () => setPage(page - 1),
              className: "text-muted-foreground hover:text-foreground",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: isKorean ? `${page + 1} / ${totalPages} 페이지` : `Page ${page + 1} of ${totalPages}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "sm",
              disabled: page >= totalPages - 1,
              onClick: () => setPage(page + 1),
              className: "text-muted-foreground hover:text-foreground",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
            }
          )
        ] })
      ] })
    ] }) })
  ] }) });
}
export {
  Transactions as default
};
