import { u as useQuery, j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { a as reactExports } from "./router-vendor-ugVG8BWW.js";
import { a as useLanguage, L as Layout, b as ue, g as client } from "./index-CbMbBdjh.js";
import { Z as ChevronDown, aq as Download } from "./utils-vendor-DtbvWOtt.js";
import "./ui-vendor-D6MKKEiL.js";
const rangeDaysMap = {
  "Last 7 days": 7,
  "Last 30 days": 30,
  "Last 90 days": 90
};
function ReportsPage() {
  const { language } = useLanguage();
  const tx = (en, ko, zh) => language === "zh" ? en : language === "en" ? en : ko;
  const [range, setRange] = reactExports.useState("Last 7 days");
  const [dropdownOpen, setDropdownOpen] = reactExports.useState(false);
  const { data: reportsData, isLoading, error } = useQuery({
    queryKey: ["reports", range],
    queryFn: async () => {
      var _a;
      const days = rangeDaysMap[range];
      const response = await client.apiCall.invoke({
        url: `/api/v1/reports?days=${days}`,
        method: "GET",
        data: {}
      });
      if (!response.ok) {
        throw new Error(((_a = response.data) == null ? void 0 : _a.detail) || "Failed to load reports");
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1e3
    // 5 minutes
  });
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  };
  const handleDownload = (report) => {
    if (report.available && report.file_url) {
      const opened = window.open(report.file_url, "_blank", "noopener,noreferrer");
      if (!opened) {
        ue.error(tx("The download window was blocked. Please allow pop-ups and try again.", "다운로드 창이 차단되었습니다. 팝업을 허용해 주세요."));
      }
      return;
    }
    ue.error(tx("This report is not available for download yet.", "이 보고서는 아직 다운로드할 수 없습니다."));
  };
  const reports = (reportsData == null ? void 0 : reportsData.data) || [];
  const ui = {
    title: tx("Reports", "보고서"),
    range: tx("Range:", "기간:"),
    last7: tx("Last 7 days", "최근 7일"),
    last30: tx("Last 30 days", "최근 30일"),
    last90: tx("Last 90 days", "최근 90일"),
    loading: tx("Loading reports...", "보고서를 불러오는 중..."),
    error: tx("Failed to load reports", "보고서를 불러오지 못했습니다."),
    empty: tx("No reports found for the selected range", "선택한 기간에 보고서가 없습니다."),
    name: tx("NAME", "이름"),
    date: tx("DATE", "날짜"),
    download: tx("Download", "다운로드"),
    noData: tx("No report data", "보고서 데이터 없음")
  };
  const rangeLabels = {
    "Last 7 days": ui.last7,
    "Last 30 days": ui.last30,
    "Last 90 days": ui.last90
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 m-0", children: ui.title }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative inline-block", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setDropdownOpen(!dropdownOpen),
          className: "inline-flex items-center gap-2 h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 shadow-sm hover:border-slate-300 transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400", children: ui.range }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-900 font-semibold", children: rangeLabels[range] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { size: 14, className: "text-slate-400" })
          ]
        }
      ),
      dropdownOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10", children: Object.keys(rangeDaysMap).map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            setRange(option);
            setDropdownOpen(false);
          },
          className: `w-full text-left px-4 py-3 text-[13px] font-medium transition-colors ${range === option ? "bg-slate-50 text-slate-900" : "text-slate-600 hover:bg-slate-50"}`,
          children: rangeLabels[option]
        },
        option
      )) })
    ] }) }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-slate-600", children: ui.loading }) }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-red-600", children: ui.error }) }),
    !isLoading && !error && reports.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-slate-600", children: ui.empty }) }),
    !isLoading && !error && reports.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-slate-50/50 border-b border-slate-100", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: "ID" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: ui.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest", children: ui.date }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-8 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-slate-50", children: reports.map((report) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-slate-50/50 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-5 text-[13px] text-slate-600 font-medium", children: report.id }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-5 text-[13px] text-slate-900 font-semibold", children: report.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-5 text-[13px] text-slate-600", children: formatDate(report.report_date) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-8 py-5 text-right", children: report.available ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => handleDownload(report),
            className: "inline-flex items-center gap-2 text-[13px] font-semibold text-slate-900 hover:text-[#FF6B00] transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { size: 16 }),
              ui.download
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[12px] text-slate-400 font-medium", children: ui.noData }) })
      ] }, report.id)) })
    ] }) })
  ] }) });
}
export {
  ReportsPage as default
};
