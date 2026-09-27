import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
function LoadingSkeleton({ variant = "page" }) {
  if (variant === "hero") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full rounded-2xl bg-white/80 p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 h-8 w-3/4 skeleton-shimmer rounded-lg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-3 h-4 w-1/2 skeleton-shimmer rounded-lg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid grid-cols-1 gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-40 skeleton-shimmer rounded-lg" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-40 skeleton-shimmer rounded-lg" })
      ] })
    ] });
  }
  if (variant === "card") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-28 w-full rounded-lg p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-1/3 skeleton-shimmer rounded" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 h-8 w-2/3 skeleton-shimmer rounded" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen w-full p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-[1200px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-1/3 skeleton-shimmer rounded-lg mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-6 w-1/2 skeleton-shimmer rounded-lg" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-40 skeleton-shimmer rounded-lg md:col-span-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-40 skeleton-shimmer rounded-lg" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid gap-4 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-28 skeleton-shimmer rounded-lg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-28 skeleton-shimmer rounded-lg" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-28 skeleton-shimmer rounded-lg" })
    ] })
  ] }) });
}
export {
  LoadingSkeleton as L
};
