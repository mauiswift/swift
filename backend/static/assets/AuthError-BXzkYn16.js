import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { h as useSearchParams, a as reactExports } from "./router-vendor-C2eKMart.js";
import { e as Button } from "./index-BaRDtvhG.js";
import { p as CircleAlert } from "./utils-vendor-DoKCqRlq.js";
import "./ui-vendor-DsSOT9J9.js";
function AuthErrorPage() {
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = reactExports.useState(3);
  const errorMessage = searchParams.get("msg") || "Sorry, your authentication information is invalid or has expired";
  reactExports.useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = "/";
          return 0;
        }
        return prev - 1;
      });
    }, 1e3);
    return () => clearInterval(timer);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-red-100 blur-xl rounded-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "relative h-12 w-12 text-red-500", strokeWidth: 1.5 })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold text-foreground", children: "Authentication Error" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base text-muted-foreground", children: errorMessage }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: countdown > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        "Will automatically return to the home page in",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary font-semibold text-base", children: countdown }),
        " ",
        "seconds"
      ] }) : "Redirecting..." }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => window.location.href = "/", className: "px-6", children: "Return to Home" }) })
  ] }) });
}
export {
  AuthErrorPage as default
};
