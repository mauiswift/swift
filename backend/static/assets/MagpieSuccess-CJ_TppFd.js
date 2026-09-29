import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { L as Link, u as useLocation, d as React } from "./router-vendor-C2eKMart.js";
import { A as APP_NAME, p as Card, q as CardHeader, s as CardTitle, t as CardDescription, v as CardContent, w as CardFooter, e as Button } from "./index-CUwlCgQ8.js";
import { j as Bot, J as CircleCheck, d as ShieldCheck, am as Download, H as House } from "./utils-vendor-HFbfdctU.js";
import "./ui-vendor-DsSOT9J9.js";
function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}
function MagpieSuccess() {
  const query = useQuery();
  const session = query.get("session_id") || query.get("checkout_id") || query.get("external_id") || "";
  query.get("payment_url") || query.get("checkout_url") || "";
  const amount = query.get("amount") || "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-[#080E1A] text-white selection:bg-blue-500/30 flex flex-col items-center justify-center p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-12 animate-logo-entrance", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-2xl shadow-blue-600/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-6 w-6 text-white" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-2xl font-semibold tracking-tight", children: [
        APP_NAME,
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-400 font-medium", children: "Verified" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "max-w-xl w-full border-white/[0.08] bg-white/[0.03] backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden animate-fade-in-up", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-full bg-gradient-to-r from-emerald-500 to-blue-500" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pt-10 pb-8 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-10 w-10 text-emerald-400" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-3xl font-semibold tracking-tight text-white mb-2", children: "Payment Successful" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-slate-400 text-base", children: "Your transaction has been processed and verified." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-8 pb-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center py-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-emerald-400 font-semibold text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4" }),
            "Verified"
          ] })
        ] }),
        amount && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center py-1 border-t border-white/[0.05] pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold", children: "Amount Paid" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-lg font-semibold text-white", children: [
            "₱ ",
            parseFloat(amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })
          ] })
        ] }),
        session && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center py-1 border-t border-white/[0.05] pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold", children: "Reference" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-xs font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg", children: session })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardFooter, { className: "px-8 pb-10 flex flex-col gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 w-full", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1 h-12 rounded-2xl bg-white text-[#080E1A] hover:bg-slate-200 font-semibold shadow-lg shadow-white/5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4 mr-2" }),
            " Save Receipt"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", className: "flex-1 h-12 rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-4 w-4 mr-2" }),
            " Home"
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-center text-slate-600 uppercase tracking-widest mt-2", children: [
          "Securely processed by ",
          APP_NAME,
          " Financial Services"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-12 text-slate-600 text-xs flex gap-6 font-medium uppercase tracking-[0.2em]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", className: "hover:text-blue-400 transition-colors", children: "Support" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/privacy-policy", className: "hover:text-blue-400 transition-colors", children: "Privacy" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/terms-of-service", className: "hover:text-blue-400 transition-colors", children: "Terms" })
    ] })
  ] });
}
export {
  MagpieSuccess as default
};
