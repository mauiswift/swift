import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { e as Button } from "./index-fim1zet6.js";
import { aJ as LayoutDashboard, b as CreditCard, aG as FileText, C as ChartColumn, H as House } from "./utils-vendor-B--1aD6k.js";
import { L as Link } from "./router-vendor-C2eKMart.js";
import "./ui-vendor-DsSOT9J9.js";
const QUICK_LINKS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/payments", icon: CreditCard, label: "Payments" },
  { to: "/transactions", icon: FileText, label: "Transactions" },
  { to: "/reports", icon: ChartColumn, label: "Reports" }
];
function NotFound() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background flex items-center justify-center px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md w-full text-center space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-8xl font-semibold text-slate-100 select-none", children: "404" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold text-foreground -mt-4", children: "Page not found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "The page you're looking for doesn't exist or has been moved." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: QUICK_LINKS.map(({ to, icon: Icon, label }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Link,
      {
        to,
        className: "flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-slate-300 transition-colors",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label })
        ]
      },
      to
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "bg-primary hover:bg-primary/90 text-primary-foreground gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(House, { className: "h-4 w-4" }),
      "Back to Dashboard"
    ] }) })
  ] }) });
}
export {
  NotFound as default
};
