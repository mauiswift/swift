import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { a as reactExports } from "./router-vendor-ugVG8BWW.js";
const LogoutCallbackPage = () => {
  reactExports.useEffect(() => {
    setTimeout(() => {
      window.location.href = "/";
    }, 2e3);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "h-6 w-6 text-emerald-500", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", viewBox: "0 0 24 24", stroke: "currentColor", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 13l4 4L19 7" }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold text-foreground mb-2", children: "Logout Successful" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-4", children: "You have been successfully logged out." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Redirecting to home page..." })
  ] }) });
};
export {
  LogoutCallbackPage as default
};
