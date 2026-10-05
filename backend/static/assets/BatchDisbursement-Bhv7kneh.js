import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { L as Layout } from "./index-CCyidPsK.js";
import { f as useNavigate } from "./router-vendor-ugVG8BWW.js";
import { v as ChevronLeft, b0 as CloudUpload, I as Info } from "./utils-vendor-DtbvWOtt.js";
import "./ui-vendor-D6MKKEiL.js";
function BatchDisbursement() {
  const navigate = useNavigate();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[12px] text-slate-400 mb-8 font-medium", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-pointer hover:text-slate-600 transition-colors", onClick: () => navigate("/disbursements"), children: "Disbursements" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "/" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-semibold", children: "Import from file" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5 mb-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => navigate("/disbursements"),
          className: "w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 m-0", children: "New batch disbursement" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-2xl p-10 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] text-slate-500 mb-10 font-medium", children: "Upload file with your new batch disbursement." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: "Batch disbursement name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                placeholder: "e.g. My New Batch Disbursement #1",
                className: "w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] focus:ring-1 focus:ring-[#FF6B00]/20 transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[14px] font-semibold text-slate-900 block mb-3", children: "Your CSV file:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-2 border-dashed border-slate-100 rounded-2xl p-14 text-center bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-14 h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloudUpload, { size: 28, className: "text-slate-400" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[14px] font-semibold text-slate-900", children: [
                "Click to upload ",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-medium", children: "or drag and drop" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-400 mt-2 font-medium", children: "CSV format only (max of 10 MB)" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "bg-[#A3A3A3] text-white px-12 py-3 rounded-xl font-semibold text-[14px] shadow-sm hover:brightness-95 transition-all", children: "Import" }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-8 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { size: 18 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[16px] font-semibold text-slate-900", children: "File rules" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "h-8 px-4 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2", children: "Download sample" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-slate-500 mb-8", children: "Please follow these guidelines when uploading your CSV file." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-slate-50 border border-slate-100 rounded-xl p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-4", children: "Use this exact order of columns:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-3 text-[13px] text-slate-700 font-medium", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-[#FF6B00]" }),
              "Merchant reference no"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-[#FF6B00]" }),
              "SWIFT code of recipient's bank"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-[#FF6B00]" }),
              "Recipient account number"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-[#FF6B00]" }),
              "Transfer amount"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-[#FF6B00]" }),
              "Recipient name"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-[#FF6B00]" }),
              "Recipient address (optional)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-[#FF6B00]" }),
              "Remarks"
            ] })
          ] })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  BatchDisbursement as default
};
