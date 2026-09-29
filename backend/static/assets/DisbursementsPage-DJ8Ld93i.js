import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { e as useNavigate, a as reactExports } from "./router-vendor-C2eKMart.js";
import { u as useAuth, f as useCollectionCurrency, a as useLanguage, g as client, L as Layout, h as fmtCurrency, e as Button } from "./index-DI9hQtnS.js";
import { i as isPaymentChannelEnabled, f as fetchPaymentChannels } from "./paymentChannels-DKsIp7Ah.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BImqhazV.js";
import { _ as ChevronDown, Z as Search, ak as Receipt, al as Plus } from "./utils-vendor-HFbfdctU.js";
import "./ui-vendor-DsSOT9J9.js";
function DisbursementsPage() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const { collectionCurrency } = useCollectionCurrency();
  const { language } = useLanguage();
  const isKorean = language === "ko";
  const tx = (en, ko, zh) => language === "zh" ? en : language === "en" ? en : ko;
  const ui = {
    title: tx("Disbursements", "출금"),
    balance: tx("Balance left", "잔액"),
    send: tx("Send Funds", "자금 보내기"),
    history: tx("History", "기록"),
    batch: tx("Batch Processing", "일괄 처리"),
    range: tx("Range:", "기간:"),
    last7: tx("Last 7 days", "최근 7일"),
    status: tx("Status:", "상태:"),
    all: tx("All", "전체"),
    search: tx("Search...", "검색..."),
    total: tx("Total count", "총 건수"),
    average: tx("Average amount", "평균 금액"),
    totalAmount: tx("Total amount", "총 금액"),
    transactions: tx("Transactions history", "거래 내역"),
    empty: tx("No disbursement history found.", "출금 내역이 없습니다"),
    disbursement: tx("Disbursement", "출금"),
    reference: tx("Merchant reference number", "가맹점 참조 번호"),
    date: tx("Date", "날짜"),
    statusLabel: tx("Status", "상태"),
    registered: tx("Registered:", "등록:"),
    settled: tx("Settled:", "정산:"),
    noBatch: tx("No batch processing found", "일괄 처리 내역이 없습니다"),
    upload: tx("Upload a file to process multiple disbursements at once.", "파일을 업로드하여 여러 출금을 한 번에 처리하세요."),
    importFile: tx("Import from file", "파일에서 가져오기")
  };
  const [mainTab, setMainTab] = reactExports.useState("history");
  const [disbursements, setDisbursements] = reactExports.useState([]);
  const [listLoading, setListLoading] = reactExports.useState(true);
  const [balance, setBalance] = reactExports.useState(0);
  const [paymentChannels, setPaymentChannels] = reactExports.useState(null);
  const [loadError, setLoadError] = reactExports.useState(null);
  const disbursementEnabled = isSuperAdmin && isPaymentChannelEnabled(paymentChannels, collectionCurrency, "disbursement", "bank_transfer");
  const fetchAll = reactExports.useCallback(async () => {
    var _a, _b, _c;
    if (!user) return;
    setListLoading(true);
    setLoadError(null);
    try {
      const [localRes, balRes] = await Promise.all([
        client.get("/api/v1/wallet/withdraw-requests"),
        client.apiCall.invoke({ url: `/api/v1/wallet/balance?currency=${collectionCurrency}`, method: "GET", data: {} })
      ]);
      if (!localRes.ok || !Array.isArray((_a = localRes.data) == null ? void 0 : _a.requests)) {
        throw new Error(((_b = localRes.data) == null ? void 0 : _b.detail) || "Unable to load disbursement history");
      }
      setDisbursements(localRes.data.requests.map((request) => ({
        id: request.id,
        merchantReferenceNo: request.external_id || `WD-${request.id}`,
        registrationTime: request.created_at ? new Date(request.created_at).toLocaleString() : null,
        settlementTime: request.processed_at ? new Date(request.processed_at).toLocaleString() : null,
        status: request.status,
        creditInformation: { amount: request.amount, remarks: "" },
        recipientInformation: {
          accountNumber: request.account_number || "—",
          firstName: "",
          lastName: ""
        },
        institutionCode: request.bank_code || "—"
      })));
      if (((_c = balRes.data) == null ? void 0 : _c.balance) != null) setBalance(balRes.data.balance);
    } catch (err) {
      setDisbursements([]);
      setLoadError(err instanceof Error ? err.message : "Unable to load disbursement history");
    }
    setListLoading(false);
  }, [user, collectionCurrency]);
  reactExports.useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  reactExports.useEffect(() => {
    fetchPaymentChannels().then(setPaymentChannels).catch(() => void 0);
  }, []);
  const statusBadge = (s) => {
    const cfg = {
      completed: "bg-[#F0FDFA] text-[#0D9488]",
      pending: "bg-[#EFF6FF] text-[#2563EB]",
      transferring: "bg-[#FFF7ED] text-[#C2410C]",
      failed: "bg-[#FEF2F2] text-[#B91C1C]"
    };
    const dot = {
      completed: "#10B981",
      pending: "#3B82F6",
      transferring: "#F97316",
      failed: "#EF4444"
    };
    const labels = {
      completed: isKorean ? "완료" : "Completed",
      pending: isKorean ? "대기 중" : "Pending",
      transferring: isKorean ? "이체 중" : "Transferring",
      failed: isKorean ? "실패" : "Failed"
    };
    const label = labels[s] || "Executed";
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${cfg[s] || "bg-slate-50 text-slate-500"} text-[11px] font-semibold capitalize`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-1.5 h-1.5 rounded-full", style: { backgroundColor: dot[s] || "#94A3B8" } }),
      label
    ] });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "m-0 mb-8 flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900", children: [
      ui.title,
      collectionCurrency === "PHP" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: "/logos/instapay.png",
          alt: "InstaPay",
          className: "h-5 w-auto"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl px-8 py-5 shadow-sm min-w-[240px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-500 mb-2 font-medium uppercase tracking-wider", children: ui.balance }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-semibold text-slate-900 tracking-tighter", children: fmtCurrency(balance, collectionCurrency) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => navigate("/disbursements/single/new"),
          disabled: !disbursementEnabled,
          className: "h-11 bg-[#111111] text-white px-6 rounded-lg font-semibold text-[14px] flex items-center gap-3 shadow-lg hover:bg-black transition-all",
          children: [
            isSuperAdmin ? ui.send : tx("Super admin only", "슈퍼 관리자만 사용 가능"),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 16 })
          ]
        }
      )
    ] }),
    loadError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800", children: loadError }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: mainTab, onValueChange: setMainTab, className: "space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-200", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "flex items-center gap-8 bg-transparent p-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabsTrigger,
          {
            value: "history",
            className: "pb-4 text-[13px] font-semibold transition-all border-b-2 -mb-[2px] data-[state=active]:text-[#FF6B00] data-[state=active]:border-[#FF6B00] data-[state=inactive]:text-slate-400 data-[state=inactive]:border-transparent bg-transparent rounded-none",
            children: ui.history
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TabsTrigger,
          {
            value: "batch",
            className: "pb-4 text-[13px] font-semibold transition-all border-b-2 -mb-[2px] data-[state=active]:text-[#FF6B00] data-[state=active]:border-[#FF6B00] data-[state=inactive]:text-slate-400 data-[state=inactive]:border-transparent bg-transparent rounded-none",
            children: ui.batch
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "history", className: "mt-0 space-y-6 animate-in fade-in duration-500", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "inline-flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-all", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: ui.range }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-900 font-semibold", children: ui.last7 }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14, className: "text-slate-400" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "inline-flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-all", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: ui.status }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-900 font-semibold", children: ui.all }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14, className: "text-slate-400" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-full xl:w-80", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 16, className: "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                placeholder: ui.search,
                className: "w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-8 shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900 mb-6", children: ui.total }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-semibold text-slate-900 tracking-tight", children: disbursements.length })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-8 shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900 mb-6", children: ui.average }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-semibold text-slate-900 tracking-tight", children: fmtCurrency(disbursements.length ? disbursements.reduce((s, x) => {
              var _a;
              return s + (typeof x.amount === "number" ? x.amount : parseFloat(String(((_a = x.creditInformation) == null ? void 0 : _a.amount) || 0)));
            }, 0) / disbursements.length : 0, collectionCurrency) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-8 shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900 mb-6", children: ui.totalAmount }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-3xl font-semibold text-slate-900 tracking-tight", children: fmtCurrency(disbursements.reduce((s, x) => {
              var _a;
              return s + (typeof x.amount === "number" ? x.amount : parseFloat(String(((_a = x.creditInformation) == null ? void 0 : _a.amount) || 0)));
            }, 0), collectionCurrency) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[16px] font-semibold text-slate-900 mb-4", children: ui.transactions }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left border-collapse", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50/50 border-b border-slate-100", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: ui.disbursement }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: ui.reference }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: ui.date }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: ui.statusLabel })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: disbursements.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 4, className: "px-6 py-10 text-center text-sm text-slate-500", children: ui.empty }) }) : disbursements.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/50 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { size: 16 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900", children: fmtCurrency(parseFloat(String(d.creditInformation.amount)), collectionCurrency) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-500", children: [
                    d.institutionCode,
                    " • ",
                    d.recipientInformation.accountNumber
                  ] })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] text-slate-600 font-medium", children: d.merchantReferenceNo }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "#CBD5E1", strokeWidth: "2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-500", children: [
                  ui.registered,
                  " ",
                  d.registrationTime || "—"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[11px] text-slate-500", children: [
                  ui.settled,
                  " ",
                  d.settlementTime || "—"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: statusBadge(d.status.toLowerCase()) })
            ] }, d.id)) })
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "batch", className: "mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 32, className: "text-slate-300" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-semibold text-slate-900 mb-2", children: ui.noBatch }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500 mb-8 max-w-sm mx-auto", children: ui.upload }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "bg-[#111111] text-white rounded-lg px-8", children: ui.importFile })
      ] }) })
    ] })
  ] }) });
}
export {
  DisbursementsPage as default
};
