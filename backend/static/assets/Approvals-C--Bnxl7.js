import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { e as useNavigate, a as reactExports } from "./router-vendor-C2eKMart.js";
import { a as useLanguage, L as Layout } from "./index-BWilGeH7.js";
import { _ as ChevronDown, R as RefreshCw, aO as Clock } from "./utils-vendor-DoKCqRlq.js";
import "./ui-vendor-DsSOT9J9.js";
const filterLabels = {
  kyb: "KYB Registrations",
  all: "All",
  payments: "Payments",
  bank_deposits: "Bank Deposits",
  topups: "Top-up Requests",
  disbursements: "Disbursements",
  usdt_send: "USDT Send Requests",
  kyc: "KYC Verifications",
  toss_accounts: "TOSS Bank Accounts"
};
const approvalPaths = {
  payments: "/payment-approvals",
  bank_deposits: "/bank-deposits",
  topups: "/topup-requests",
  disbursements: "/withdrawals",
  usdt_send: "/withdrawals/usdt-send-requests",
  kyc: "/kyc-verifications",
  toss_accounts: "/toss-account-approvals"
};
const statusConfig = {
  pending_review: { color: "bg-amber-100 text-amber-800 border-amber-300", label: "Pending Review" },
  in_progress: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "In Progress" },
  approved: { color: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "Approved" },
  rejected: { color: "bg-red-100 text-red-800 border-red-300", label: "Rejected" }
};
function Approvals() {
  const { language } = useLanguage();
  const tx = (en, ko, zh) => language === "zh" ? zh ?? en : language === "en" ? en : ko;
  const isKorean = language === "ko";
  const localizedFilterLabels = isKorean ? {
    kyb: "KYB 등록",
    all: "전체",
    payments: "결제",
    bank_deposits: "은행 입금",
    topups: "충전 요청",
    disbursements: "지급",
    usdt_send: "USDT 전송 요청",
    kyc: "KYC 인증",
    toss_accounts: "TOSS 계좌"
  } : filterLabels;
  const localizedStatusLabels = isKorean ? { pending_review: "검토 대기", in_progress: "진행 중", approved: "승인됨", rejected: "거부됨" } : Object.fromEntries(Object.entries(statusConfig).map(([key, value]) => [key, value.label]));
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = reactExports.useState("pending");
  const [filter, setFilter] = reactExports.useState("kyb");
  const [showFilterDropdown, setShowFilterDropdown] = reactExports.useState(false);
  const [registrations, setRegistrations] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [error, setError] = reactExports.useState("");
  const fetchRegistrations = reactExports.useCallback(async () => {
    if (filter !== "kyb") {
      setRegistrations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const statusParam = activeTab === "pending" ? "pending_review" : "";
      const url = statusParam ? `/api/v1/kyb?status=${statusParam}` : "/api/v1/kyb";
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data.items || []);
      } else {
        setError(isKorean ? "등록을 불러오지 못했습니다. 다시 시도해 주세요." : "Failed to load registrations. Please try again.");
      }
    } catch (e) {
      console.error(e);
      setError(isKorean ? "등록을 불러오는 중 네트워크 오류가 발생했습니다." : "Network error while loading registrations.");
    }
    setLoading(false);
  }, [filter, activeTab, isKorean]);
  reactExports.useEffect(() => {
    fetchRegistrations();
    const interval = setInterval(fetchRegistrations, 3e4);
    return () => clearInterval(interval);
  }, [fetchRegistrations]);
  const getStatusDisplay = (status) => {
    return statusConfig[status] || statusConfig.in_progress;
  };
  const fmt_time = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(isKorean ? "ko-KR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 m-0 mb-2", children: tx("Approvals", "승인") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500 mb-6", children: tx("Review and manage pending registrations and approvals", "대기 중인 등록 및 승인 요청을 검토하고 관리하세요") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-200 mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setActiveTab("pending"),
          className: `pb-4 text-[13px] font-semibold transition-all border-b-2 -mb-[2px] ${activeTab === "pending" ? "text-[#FF6B00] border-[#FF6B00]" : "text-slate-400 border-transparent hover:text-slate-600"}`,
          children: tx("Pending", "대기 중")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setActiveTab("history"),
          className: `pb-4 text-[13px] font-semibold transition-all border-b-2 -mb-[2px] ${activeTab === "history" ? "text-[#FF6B00] border-[#FF6B00]" : "text-slate-400 border-transparent hover:text-slate-600"}`,
          children: tx("History", "기록")
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative inline-block", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setShowFilterDropdown(!showFilterDropdown),
            className: "flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-all",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-medium", children: activeTab === "pending" ? tx("Show:", "표시:") : tx("Status:", "상태:") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-900 font-semibold", children: localizedFilterLabels[filter] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14, className: "text-slate-400" })
            ]
          }
        ),
        showFilterDropdown && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              onClick: () => setShowFilterDropdown(false),
              className: "fixed inset-0 z-10"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full mt-2 left-0 w-[240px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl z-20 page-enter", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-slate-50", children: Object.keys(filterLabels).map((key) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => {
                const path = approvalPaths[key];
                if (path) {
                  setShowFilterDropdown(false);
                  navigate(path);
                  return;
                }
                setFilter(key);
                setShowFilterDropdown(false);
              },
              className: `flex w-full items-center justify-between px-6 py-4 text-sm font-semibold transition-colors ${filter === key ? "bg-slate-50 text-[#FF6B00]" : "text-slate-600 hover:bg-slate-50/50"}`,
              children: [
                localizedFilterLabels[key],
                filter === key && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-[#FF6B00]" })
              ]
            },
            key
          )) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: fetchRegistrations,
          className: "flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-sm border border-slate-200 px-3 py-1.5 rounded-lg transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14 }),
            " ",
            tx("Refresh", "새로고침")
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden", children: [
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-200 bg-red-50 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-red-700", children: error }) }),
      loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-12 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" }) }) : registrations.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-slate-400 mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { size: 32, className: "mx-auto mb-2 opacity-50" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-slate-600 font-medium", children: filter === "kyb" ? activeTab === "pending" ? tx("No pending KYB registrations", "대기 중인 KYB 등록이 없습니다") : tx("No KYB registration history", "KYB 등록 기록이 없습니다") : tx("Select an approval category", "승인 카테고리를 선택하세요") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 text-sm mt-1", children: filter === "kyb" ? tx("New KYB applications will appear here", "새 KYB 신청이 여기에 표시됩니다") : tx("Use the category menu to review requests", "카테고리 메뉴에서 요청을 검토하세요") })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-slate-50 border-b border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left font-semibold text-slate-700", children: tx("Name", "이름") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left font-semibold text-slate-700", children: "Telegram" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left font-semibold text-slate-700", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left font-semibold text-slate-700", children: tx("Status", "상태") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left font-semibold text-slate-700", children: tx("Submitted", "제출일") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-3 text-left font-semibold text-slate-700", children: tx("Action", "작업") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-200", children: registrations.map((reg) => {
          const statusDisplay = getStatusDisplay(reg.status);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-slate-900", children: reg.full_name || "—" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs bg-slate-100 px-2 py-1 rounded text-slate-700", children: reg.telegram_username ? `@${reg.telegram_username}` : reg.chat_id }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-slate-600", children: reg.email || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${statusDisplay.color}`, children: localizedStatusLabels[reg.status] || statusDisplay.label }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-slate-600 text-xs", children: fmt_time(reg.created_at) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: `/kyb-registrations#${reg.id}`,
                className: "text-blue-600 hover:text-blue-800 font-medium text-xs",
                children: tx("Review", "검토")
              }
            ) })
          ] }, reg.id);
        }) })
      ] }) })
    ] })
  ] }) });
}
export {
  Approvals as default
};
