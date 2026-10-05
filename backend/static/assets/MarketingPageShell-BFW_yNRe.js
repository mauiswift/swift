import { j as jsxRuntimeExports } from "./query-vendor-DbSHy-Pt.js";
import { a as reactExports, L as Link } from "./router-vendor-BtBWUifS.js";
import { B as BrandLogo, w as AppFooter } from "./index-CgvbpU93.js";
import { Z as ChevronDown, X, q as Menu } from "./utils-vendor-Dj1Vigod.js";
function MarketingPageShell({ children, className = "" }) {
  const [mobileOpen, setMobileOpen] = reactExports.useState(false);
  const [solutionsOpen, setSolutionsOpen] = reactExports.useState(false);
  const [scrolled, setScrolled] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const solutionLinks = [
    { label: "온라인 결제", href: "/#solutions" },
    { label: "결제 알림", href: "/#solutions" },
    { label: "출금 및 정산", href: "/#solutions" },
    { label: "대금 정산 대조", href: "/#solutions" },
    { label: "이상 거래 감지", href: "/#security" },
    { label: "결제 라우팅", href: "/#solutions" },
    { label: "정기 결제", href: "/#solutions" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `min-h-screen overflow-x-hidden ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: `fixed inset-x-0 top-0 z-50 border-b border-[#e9e3db] transition-all duration-300 ${scrolled ? "bg-white/95 shadow-sm backdrop-blur-md" : "bg-[#fcfcfc]/90 backdrop-blur-sm"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { className: "h-8 w-auto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[22px] font-semibold tracking-tight text-[#1a1a1a] font-display", children: "SwiftPay" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden items-center gap-8 lg:flex", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setSolutionsOpen((v) => !v),
                className: "inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]",
                children: [
                  "솔루션 ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" })
                ]
              }
            ),
            solutionsOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-0 z-50 mt-3 w-64 rounded-[24px] border border-[#ece7e1] bg-white p-3 shadow-xl", children: solutionLinks.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: item.href,
                onClick: () => setSolutionsOpen(false),
                className: "block rounded-2xl px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#fcf6ef] hover:text-[#c04e15]",
                children: item.label
              },
              item.label
            )) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/#why", className: "text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]", children: "SwiftPay 특징" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", className: "text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]", children: "문의하기" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/privacy-policy", className: "text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]", children: "개인정보처리방침" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "text-[13px] font-semibold text-[#4d4d4d] transition-colors hover:text-[#1a1a1a]", children: "가맹점 포털" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "a",
            {
              href: "/contact",
              className: "rounded-full bg-[#1a1a1a] px-7 py-3 text-[13px] font-semibold text-white transition-all hover:bg-[#2b2b2b]",
              children: "데모 신청"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "rounded-full p-2 text-[#1a1a1a] lg:hidden",
            onClick: () => setMobileOpen((v) => !v),
            "aria-label": "Toggle menu",
            children: mobileOpen ? /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-7 w-7" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { className: "h-7 w-7" })
          }
        )
      ] }),
      mobileOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-[#e9e3db] bg-white/95 p-6 backdrop-blur-xl lg:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/#solutions", className: "text-lg font-semibold text-[#1a1a1a]", onClick: () => setMobileOpen(false), children: "솔루션" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/#why", className: "text-lg font-semibold text-[#1a1a1a]", onClick: () => setMobileOpen(false), children: "SwiftPay 특징" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", className: "text-lg font-semibold text-[#1a1a1a]", onClick: () => setMobileOpen(false), children: "문의하기" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/privacy-policy", className: "text-lg font-semibold text-[#1a1a1a]", onClick: () => setMobileOpen(false), children: "개인정보처리방침" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "text-lg font-semibold text-[#1a1a1a]", onClick: () => setMobileOpen(false), children: "가맹점 포털" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", className: "text-lg font-semibold text-[#1a1a1a]", onClick: () => setMobileOpen(false), children: "데모 신청" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-20", children }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppFooter, {})
  ] });
}
export {
  MarketingPageShell as M
};
