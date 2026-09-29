import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports, L as Link } from "./router-vendor-C2eKMart.js";
import { P as PaymentBrandLogo, C as COMPANY_NAME } from "./index-C9--HWz5.js";
import { n as ArrowRight, F as Sparkles, ag as QrCode, $ as Check, d as ShieldCheck, ah as Zap, ai as Earth } from "./utils-vendor-DoKCqRlq.js";
import "./ui-vendor-DsSOT9J9.js";
const paymentRails = [
  { code: "GCASH", label: "GCash", detail: "필리핀 고객을 위한 앱 결제" },
  { code: "QRPH", label: "QRPH", detail: "은행과 전자지갑을 하나의 QR로" },
  { code: "KRW", label: "KRW", detail: "한국 원화 정산" }
];
const highlights = [
  { icon: Zap, title: "빠른 결제 연결", body: "하나의 결제 페이지와 API로 한국과 필리핀 고객을 함께 지원합니다." },
  { icon: ShieldCheck, title: "운영에 필요한 보안", body: "거래 상태, 정산 기록, 승인 흐름을 한 곳에서 확인할 수 있습니다." },
  { icon: Earth, title: "국경을 넘는 판매", body: "고객의 익숙한 결제 방식을 유지하면서 판매자는 단일 운영 화면을 사용합니다." }
];
function KoreaPublicPage() {
  reactExports.useEffect(() => {
    document.title = "SwiftPay Korea | 한국과 필리핀을 잇는 결제";
    const description = "KRW 정산과 GCash, QRPH 결제를 하나의 운영 화면에서 관리하세요.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950", lang: "ko", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative isolate bg-[#08111f] text-white", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_15%,rgba(38,132,255,0.35),transparent_30%),linear-gradient(125deg,#08111f_0%,#102b48_58%,#063b55_100%)]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-5 pb-20 pt-6 sm:px-8 lg:px-12 lg:pb-28", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex items-center justify-between border-b border-white/10 pb-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/kr", className: "flex items-center gap-3", "aria-label": "SwiftPay 한국 홈", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-10 w-10 place-items-center rounded-xl bg-white text-[#08111f] font-black", children: "S" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold tracking-tight", children: "SwiftPay" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-blue-100 sm:inline-flex", children: "KOREA" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "hidden px-3 py-2 text-sm font-semibold text-blue-100 transition hover:text-white sm:inline-flex", children: "로그인" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/register", className: "inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-[#0b2440] transition hover:bg-blue-50", children: [
              "시작하기 ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid items-center gap-14 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-24", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-300/10 px-3 py-1.5 text-xs font-bold tracking-wide text-blue-100", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5" }),
              " 한국 사업자를 위한 글로벌 결제"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "max-w-2xl text-4xl font-black leading-[1.08] tracking-[-0.04em] sm:text-6xl", children: [
              "한국과 필리핀을 잇는",
              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[#74c8ff]", children: "한 번의 결제 경험" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 max-w-xl text-base leading-8 text-blue-100 sm:text-lg", children: "SwiftPay는 KRW 정산과 GCash, QRPH 결제를 하나의 운영 화면으로 연결합니다. 고객은 익숙한 방식으로 결제하고, 판매자는 더 단순하게 관리하세요." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-9 flex flex-col gap-3 sm:flex-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/register", className: "inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f9bff] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-[#55adff]", children: [
                "무료로 시작하기 ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", className: "inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10", children: "상담 문의" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 text-xs text-blue-200/70", children: "카드 등록 없이 시작 · 실시간 거래 상태 · 한국어 지원" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto w-full max-w-md", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -inset-5 rounded-[2rem] bg-blue-400/10 blur-2xl" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-[1.5rem] border border-white/15 bg-white p-5 text-slate-950 shadow-2xl shadow-black/30 sm:p-7", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-slate-100 pb-5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.16em] text-slate-400", children: "SwiftPay Checkout" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-lg font-bold", children: "결제 방법 선택" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { className: "h-6 w-6" }) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-xl bg-slate-50 p-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-slate-500", children: "결제 금액" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-3xl font-black tracking-tight", children: "₩125,000" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-400", children: "SwiftPay 보안 결제" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5 space-y-3", children: paymentRails.map((rail, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-3 rounded-xl border p-3 ${index === 0 ? "border-blue-300 bg-blue-50/60" : "border-slate-100 bg-white"}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: rail.code, size: "sm", className: "border border-slate-100" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: rail.label }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "truncate text-xs text-slate-500", children: rail.detail })
                ] }),
                index === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-blue-600" })
              ] }, rail.code)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center gap-2 text-xs font-semibold text-emerald-600", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4" }),
                " 안전한 결제 상태 추적"
              ] })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-b border-slate-200 bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto grid max-w-7xl gap-0 px-5 sm:grid-cols-3 sm:px-8 lg:px-12", children: paymentRails.map((rail) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 border-b border-slate-100 py-6 last:border-0 sm:border-b-0 sm:border-r sm:px-8 sm:first:pl-0 sm:last:border-r-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: rail.code, size: "sm" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-slate-900", children: rail.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: rail.detail })
      ] })
    ] }, rail.code)) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold uppercase tracking-[0.15em] text-blue-600", children: "하나의 운영 기준" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl", children: [
          "복잡한 결제를",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "조용하게 관리하세요."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-12 grid gap-5 md:grid-cols-3", children: highlights.map(({ icon: Icon, title, body }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "rounded-2xl border border-slate-200 bg-white p-7 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-6 text-lg font-bold", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm leading-7 text-slate-500", children: body })
      ] }, title)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-12 lg:pb-28", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-between gap-7 rounded-2xl bg-[#102840] px-7 py-9 text-white sm:flex-row sm:items-center sm:px-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-blue-200", children: "SwiftPay Korea" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-2 text-2xl font-black tracking-tight", children: "다음 결제를 오늘 연결하세요." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/register", className: "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[#102840] transition hover:bg-blue-50", children: [
        "판매자 등록 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t border-slate-200 bg-white", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-7xl flex-col gap-3 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " ",
        COMPANY_NAME,
        ". SwiftPay Korea."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/privacy-policy", className: "hover:text-slate-900", children: "개인정보처리방침" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/terms-of-service", className: "hover:text-slate-900", children: "이용약관" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", className: "hover:text-slate-900", children: "문의하기" })
      ] })
    ] }) })
  ] });
}
export {
  KoreaPublicPage as default
};
