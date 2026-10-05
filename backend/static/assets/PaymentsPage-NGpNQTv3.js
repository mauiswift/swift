import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { f as useNavigate, j as useSearchParams, a as reactExports } from "./router-vendor-N0qZPfHZ.js";
import { v as useCollectionCurrency, a as useLanguage, i as client, a0 as getTransactionStatus, w as Layout, l as fmtCurrency, P as PaymentBrandLogo, a1 as PaymentStatusBadge } from "./index-C682rKfx.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-Bs5L13ZF.js";
import { R as RefreshCw, a5 as Search, b4 as EllipsisVertical, $ as ChevronDown, a1 as Check } from "./utils-vendor-Bm5lXE_Q.js";
import "./ui-vendor-CXLHQPHT.js";
function toLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}
function getPaymentDateRangeBounds(range, customStart, customEnd, now = /* @__PURE__ */ new Date()) {
  if (range === "all") return null;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);
  if (range === "custom") {
    const start = toLocalDate(customStart);
    const inclusiveEnd = toLocalDate(customEnd);
    if (!start || !inclusiveEnd || start > inclusiveEnd) return null;
    const end = new Date(inclusiveEnd);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
  if (range === "today") return { start: startOfToday, end: endOfToday };
  if (range === "yesterday") {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 1);
    return { start, end: startOfToday };
  }
  if (range === "last7") {
    const start = new Date(startOfToday);
    start.setDate(start.getDate() - 6);
    return { start, end: endOfToday };
  }
  if (range === "thisMonth") {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfToday };
  }
  const day = startOfToday.getDay();
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - (day === 0 ? 6 : day - 1));
  if (range === "lastWeek") {
    const start = new Date(startOfWeek);
    start.setDate(start.getDate() - 7);
    return { start, end: startOfWeek };
  }
  if (range === "lastMonth") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 1)
    };
  }
  return { start: startOfWeek, end: endOfToday };
}
const PAYMENT_PAGE_SIZE = 2e3;
const dateRangeLabels = {
  all: "All dates",
  last7: "Last 7 days",
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This week",
  lastWeek: "Last week",
  thisMonth: "This month",
  lastMonth: "Last month",
  custom: "Custom range"
};
const statusLabels = {
  all: "All",
  pending: "Pending",
  paid: "Paid",
  processing: "Processing",
  failed: "Failed",
  rejected: "Rejected",
  expired: "Expired",
  cancelled: "Cancelled",
  inactive: "Unknown"
};
const koreanDateRangeLabels = {
  all: "전체 기간",
  last7: "최근 7일",
  today: "오늘",
  yesterday: "어제",
  thisWeek: "이번 주",
  lastWeek: "지난주",
  thisMonth: "이번 달",
  lastMonth: "지난달",
  custom: "사용자 지정 기간"
};
const koreanStatusLabels = {
  all: "전체",
  pending: "대기 중",
  paid: "결제 완료",
  processing: "처리 중",
  failed: "실패",
  rejected: "거부됨",
  expired: "만료됨",
  cancelled: "취소됨",
  inactive: "알 수 없음"
};
function PaymentsPage() {
  const { collectionCurrency } = useCollectionCurrency();
  const { language } = useLanguage();
  const isKorean = language === "ko";
  const ui = isKorean ? {
    title: "결제",
    search: "검색...",
    refresh: "결제 새로고침",
    actions: "결제 작업",
    refreshData: "데이터 새로고침",
    viewTransactions: "거래 내역 보기",
    createdOn: "생성일:",
    status: "상태:",
    clearFilters: "필터 초기화",
    startDate: "시작일",
    endDate: "종료일",
    transactions: "거래",
    totalAmount: "총 금액",
    averageAmount: "평균 금액",
    history: "거래 내역",
    payment: "결제",
    reference: "참조 번호",
    date: "날짜",
    paymentStatus: "결제 상태",
    noTransactions: "거래 내역이 없습니다",
    loadError: "결제를 불러오지 못했습니다.",
    retry: "다시 시도",
    created: "생성:",
    executed: "실행:"
  } : {
    title: "Payments",
    search: "Search...",
    refresh: "Refresh payments",
    actions: "Open payment actions",
    refreshData: "Refresh data",
    viewTransactions: "View transactions",
    createdOn: "Created on:",
    status: "Status:",
    clearFilters: "Clear filters",
    startDate: "Start date",
    endDate: "End date",
    transactions: "Transactions",
    totalAmount: "Total amount",
    averageAmount: "Average amount",
    history: "Transactions history",
    payment: "PAYMENT",
    reference: "REFERENCE NO",
    date: "DATE",
    paymentStatus: "PAYMENT STATUS",
    noTransactions: "No transactions found",
    loadError: "Unable to load payments.",
    retry: "Try again",
    created: "Created:",
    executed: "Executed:"
  };
  const activeCurrency = String(collectionCurrency || "PHP").trim().toUpperCase();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySearchTerm = searchParams.get("search") || "";
  const [dateRange, setDateRange] = reactExports.useState(querySearchTerm ? "all" : "last7");
  const today = /* @__PURE__ */ new Date();
  const todayInput = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [customStart, setCustomStart] = reactExports.useState(todayInput);
  const [customEnd, setCustomEnd] = reactExports.useState(todayInput);
  const [status, setStatus] = reactExports.useState("all");
  const [searchTerm, setSearchTerm] = reactExports.useState(querySearchTerm);
  const [showDateDropdown, setShowDateDropdown] = reactExports.useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = reactExports.useState(false);
  const [showMenuDropdown, setShowMenuDropdown] = reactExports.useState(false);
  const [payments, setPayments] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [loadError, setLoadError] = reactExports.useState("");
  const fetchPayments = reactExports.useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const fetchAllPages = async (query) => {
        var _a;
        const items = [];
        let total = Number.POSITIVE_INFINITY;
        while (items.length < total) {
          const res = await client.entities.transactions.query({
            query,
            sort: "-created_at",
            limit: PAYMENT_PAGE_SIZE,
            skip: items.length
          });
          if (!res.ok || !res.data || !Array.isArray(res.data.items)) {
            throw new Error(((_a = res.data) == null ? void 0 : _a.detail) || "Unable to load payment history.");
          }
          const batch = res.data.items;
          total = Number(res.data.total);
          if (!Number.isFinite(total) || total < 0) {
            throw new Error("The payment history response has an invalid transaction count.");
          }
          items.push(...batch);
          if (batch.length === 0 && items.length < total) {
            throw new Error("Payment history changed while loading. Refresh to try again.");
          }
        }
        return items;
      };
      const rawItems = await fetchAllPages({ currency: activeCurrency });
      if (activeCurrency === "PHP") {
        rawItems.push(...await fetchAllPages({ currency: null }));
      }
      const locale = language === "zh" ? "zh-CN" : language === "en" ? "en-PH" : "ko-KR";
      const mapped = rawItems.map((item) => {
        const createdDate = item.created_at ? new Date(item.created_at) : null;
        const paidDate = item.paid_at || item.updated_at;
        const executedDate = getTransactionStatus(item) === "paid" && paidDate ? new Date(paidDate) : null;
        return {
          id: String(item.id),
          amount: Number(item.amount) || 0,
          currency: String(item.currency || "PHP").trim().toUpperCase(),
          method: item.transaction_type || "Transfer",
          provider: item.title || "SwiftPay",
          reference: item.order_no || item.external_id || "N/A",
          createdAt: createdDate && !Number.isNaN(createdDate.getTime()) ? createdDate.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : "N/A",
          executedAt: executedDate && !Number.isNaN(executedDate.getTime()) ? executedDate.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" }) : null,
          createdTimestamp: createdDate && !Number.isNaN(createdDate.getTime()) ? createdDate.getTime() : null,
          status: getTransactionStatus(item),
          approvalStatus: item.approval_status || null,
          paymentStatus: item.payment_status || null,
          paidAt: item.paid_at || null
        };
      });
      setPayments(mapped);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
      setLoadError(err instanceof Error ? err.message : "Unable to load payment history.");
    } finally {
      setLoading(false);
    }
  }, [activeCurrency, language]);
  reactExports.useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);
  reactExports.useEffect(() => {
    setSearchTerm(querySearchTerm);
    if (querySearchTerm) setDateRange("all");
  }, [querySearchTerm]);
  const filteredPayments = reactExports.useMemo(() => {
    const bounds = getPaymentDateRangeBounds(dateRange, customStart, customEnd);
    return payments.filter((p) => {
      if (p.currency !== activeCurrency) return false;
      if (dateRange === "custom" && !bounds) return false;
      if (bounds && (p.createdTimestamp === null || p.createdTimestamp < bounds.start.getTime() || p.createdTimestamp >= bounds.end.getTime())) return false;
      if (status !== "all" && p.status !== status) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return p.id.toLowerCase().includes(term) || p.reference.toLowerCase().includes(term) || p.provider.toLowerCase().includes(term) || p.method.toLowerCase().includes(term);
      }
      return true;
    });
  }, [payments, activeCurrency, dateRange, customStart, customEnd, status, searchTerm]);
  const transactionsCount = filteredPayments.length;
  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const avgAmount = transactionsCount > 0 ? totalAmount / transactionsCount : 0;
  if (loading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" }) });
  if (loadError) return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { role: "alert", className: "mx-auto max-w-xl py-20 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold text-slate-900", children: ui.loadError }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-slate-500", children: loadError }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => void fetchPayments(),
        className: "mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 15 }),
          " ",
          ui.retry
        ]
      }
    )
  ] }) });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 m-0", children: ui.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full flex-wrap items-center gap-2 md:w-auto md:flex-nowrap md:gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-0 w-full md:w-80", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: ui.search,
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => fetchPayments(),
            type: "button",
            "aria-label": ui.refresh,
            title: ui.refresh,
            className: "app-touch-target h-10 w-10 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 shadow-sm",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 18, className: loading ? "animate-spin" : "" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setShowMenuDropdown(!showMenuDropdown),
            type: "button",
            "aria-label": ui.actions,
            title: ui.actions,
            className: "app-touch-target h-10 w-10 shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-50 shadow-sm",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(EllipsisVertical, { size: 18 })
          }
        ),
        showMenuDropdown && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-11 z-30 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setShowMenuDropdown(false);
                fetchPayments();
              },
              className: "block w-full px-3 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-50",
              children: ui.refreshData
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                setShowMenuDropdown(false);
                navigate("/transactions");
              },
              className: "block w-full px-3 py-2 text-left text-[12px] font-medium text-slate-700 hover:bg-slate-50",
              children: ui.viewTransactions
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-nowrap items-center gap-2 mb-8 overflow-x-auto pb-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setShowDateDropdown(!showDateDropdown),
            className: "flex min-w-max items-center gap-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: ui.createdOn }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-900 font-semibold", children: isKorean ? koreanDateRangeLabels[dateRange] : dateRangeLabels[dateRange] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14, className: "text-slate-400" })
            ]
          }
        ),
        showDateDropdown && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: () => setShowDateDropdown(false), className: "fixed inset-0 z-10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-0 top-full mt-2 w-[200px] bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden page-enter", children: Object.keys(dateRangeLabels).map((key) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                setDateRange(key);
                setShowDateDropdown(false);
              },
              className: `flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold ${dateRange === key ? "bg-slate-50 text-[#FF6B00]" : "text-slate-600 hover:bg-slate-50"}`,
              children: [
                isKorean ? koreanDateRangeLabels[key] : dateRangeLabels[key],
                dateRange === key && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14 })
              ]
            },
            key
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setShowStatusDropdown(!showStatusDropdown),
            className: "flex min-w-max items-center gap-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: ui.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-900 font-semibold", children: isKorean ? koreanStatusLabels[status] : statusLabels[status] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14, className: "text-slate-400" })
            ]
          }
        ),
        showStatusDropdown && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { onClick: () => setShowStatusDropdown(false), className: "fixed inset-0 z-10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-0 top-full mt-2 w-[180px] bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden page-enter", children: Object.keys(statusLabels).map((key) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                setStatus(key);
                setShowStatusDropdown(false);
              },
              className: `flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold ${status === key ? "bg-slate-50 text-[#FF6B00]" : "text-slate-600 hover:bg-slate-50"}`,
              children: [
                isKorean ? koreanStatusLabels[key] : statusLabels[key],
                status === key && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { size: 14 })
              ]
            },
            key
          )) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => {
            setDateRange("all");
            setCustomStart(todayInput);
            setCustomEnd(todayInput);
            setStatus("all");
            setSearchTerm("");
            navigate("/payments", { replace: true });
          },
          className: "flex min-w-max items-center gap-2 h-10 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50",
          children: ui.clearFilters
        }
      )
    ] }),
    dateRange === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "grid gap-1 text-xs font-semibold text-slate-600", children: [
        ui.startDate,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "date",
            value: customStart,
            max: customEnd,
            onChange: (event) => setCustomStart(event.target.value),
            className: "h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "grid gap-1 text-xs font-semibold text-slate-600", children: [
        ui.endDate,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "date",
            value: customEnd,
            min: customStart,
            onChange: (event) => setCustomEnd(event.target.value),
            className: "h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal text-slate-900"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-8 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900 mb-6", children: ui.transactions }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-semibold text-slate-900 tracking-tight", children: transactionsCount })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-8 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900 mb-6", children: ui.totalAmount }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-semibold text-slate-900 tracking-tight", children: fmtCurrency(totalAmount, activeCurrency) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-8 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900 mb-6", children: ui.averageAmount }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-semibold text-slate-900 tracking-tight", children: fmtCurrency(avgAmount, activeCurrency) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[18px] font-semibold text-slate-900 mb-6", children: ui.history }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "app-table-scroll bg-white border border-slate-200 rounded-xl shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[680px] text-left border-collapse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50/50 border-b border-slate-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: ui.payment }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: ui.reference }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: ui.date }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: ui.paymentStatus })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 4, className: "px-6 py-10 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 24, className: "animate-spin mx-auto text-slate-300" }) }) }) : filteredPayments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 4, className: "px-6 py-10 text-center text-slate-400 text-sm", children: ui.noTransactions }) }) : filteredPayments.map((payment) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "tr",
        {
          onClick: () => navigate(`/payments/${payment.id}`),
          className: "cursor-pointer hover:bg-slate-50/50 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: payment.method, size: "sm", className: "border-0 bg-transparent p-0 shadow-none" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900", children: fmtCurrency(payment.amount, payment.currency) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-500", children: [
                  payment.provider,
                  " • ",
                  payment.method
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] text-slate-600 font-medium", children: payment.reference }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "#CBD5E1", strokeWidth: "2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-500", children: [
                ui.created,
                " ",
                payment.createdAt
              ] }),
              payment.executedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-500", children: [
                ui.executed,
                " ",
                payment.executedAt
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              PaymentStatusBadge,
              {
                transaction: {
                  status: payment.status,
                  approval_status: payment.approvalStatus,
                  payment_status: payment.paymentStatus,
                  paid_at: payment.paidAt
                },
                size: "sm",
                showDot: true
              }
            ) })
          ]
        },
        payment.id
      )) })
    ] }) })
  ] }) });
}
export {
  PaymentsPage as default
};
