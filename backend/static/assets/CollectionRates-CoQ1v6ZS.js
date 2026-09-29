import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports, L as Link } from "./router-vendor-C2eKMart.js";
import { a as useLanguage, A as APP_NAME, S as SUPPORT_URL, k as AppFooter } from "./index-DI9hQtnS.js";
import { ai as Earth, n as ArrowRight, J as CircleCheck, d as ShieldCheck, i as MessageCircle } from "./utils-vendor-HFbfdctU.js";
import "./ui-vendor-DsSOT9J9.js";
const MARKETS = [
  {
    id: "philippines",
    label: "Philippines",
    flag: "PH",
    currency: "PHP",
    settlement: "Settlement timing follows the enabled payment rail and partner schedule",
    summary: "Local wallets, bank rails, cards, QR payments, and over-the-counter collections with transparent processing windows.",
    methods: [
      { name: "GCash, Maya, GrabPay, ShopeePay", type: "Digital wallets", rate: "0.4%" },
      { name: "QR PH and InstaPay bank transfers", type: "QR and bank rails", rate: "0.4%" },
      { name: "Visa, Mastercard, and local cards", type: "Cards", rate: "0.4%" },
      { name: "BPI, BDO, UBP, RCBC, and other banks", type: "Direct debit", rate: "0.4%" },
      { name: "7-Eleven, ECPay, Cebuana, LBC, SM", type: "Over the counter", rate: "0.4%" }
    ]
  },
  {
    id: "china",
    label: "China",
    flag: "CN",
    currency: "PHP / USDT",
    settlement: "Converted to USDT at daily closing rate",
    summary: "Accept payments from Chinese customers through the wallets they already use.",
    methods: [
      { name: "Alipay", type: "Digital wallet", rate: "0.4%" },
      { name: "WeChat Pay", type: "Digital wallet", rate: "0.4%" }
    ]
  },
  {
    id: "international",
    label: "International",
    flag: "INT",
    currency: "PHP / USDT",
    settlement: "Settlement currency confirmed during onboarding",
    summary: "Offer familiar international card and wallet options through one integration.",
    methods: [
      { name: "Visa and Mastercard", type: "International cards", rate: "0.4%" },
      { name: "KakaoPay, NaverPay, Payco, TossPay", type: "International wallets", rate: "0.4%" },
      { name: "UnionPay, JCB, and other supported rails", type: "Alternative cards", rate: "Custom" }
    ]
  }
];
function CollectionRates() {
  const { language } = useLanguage();
  const isKorean = language === "ko";
  const [activeMarket, setActiveMarket] = reactExports.useState("philippines");
  const market = MARKETS.find((item) => item.id === activeMarket) ?? MARKETS[0];
  const marketLabels = { philippines: "필리핀", china: "중국", international: "국제" };
  const marketSummaries = {
    philippines: "현지 지갑, 은행 결제망, 카드, QR 결제 및 편의점 수납을 투명한 처리 시간으로 지원합니다.",
    china: "중국 고객이 익숙하게 사용하는 지갑으로 결제를 받을 수 있습니다.",
    international: "하나의 연동으로 익숙한 국제 카드와 지갑 결제 수단을 제공하세요."
  };
  const marketSettlements = {
    philippines: "정산 시점은 활성화된 결제망과 파트너 일정에 따라 결정됩니다.",
    china: "일일 마감 환율에 따라 USDT로 환산됩니다.",
    international: "정산 통화는 온보딩 과정에서 확정됩니다."
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen overflow-x-hidden bg-[#040C18] text-white", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-50 border-b border-white/[0.06] bg-[#040C18]/90 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Earth, { className: "h-4 w-4 text-white" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base font-semibold tracking-tight text-white sm:text-lg", children: APP_NAME })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "hidden items-center gap-6 md:flex", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/features", className: "text-sm text-slate-400 transition-colors hover:text-white", children: isKorean ? "기능" : "Features" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/pricing", className: "text-sm text-slate-400 transition-colors hover:text-white", children: isKorean ? "요금" : "Pricing" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/collection-rates", className: "text-sm font-medium text-white", children: isKorean ? "수납 요금" : "Collection rates" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/register", className: "inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-colors hover:bg-blue-500 sm:px-5", children: [
        isKorean ? "시작하기" : "Get started",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3.5 w-3.5" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative overflow-hidden px-4 pb-12 pt-16 text-center sm:px-6 sm:pt-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute left-1/2 top-0 h-96 w-[700px] -translate-x-1/2 rounded-full bg-blue-700/10 blur-[120px]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto max-w-3xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-600/10 px-4 py-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-blue-400" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wide text-blue-300", children: isKorean ? "투명한 수납 요금" : "Transparent collection pricing" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mb-4 text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl", children: isKorean ? "시장별 수납 요금" : "Collection rates by market" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto max-w-2xl text-base leading-7 text-slate-400 sm:text-lg", children: isKorean ? "지원되는 모든 수납 채널의 공개 요금과 활성화된 결제 파트너 및 처리 일정에 따른 정산 시간을 확인하세요." : "See the published rate for every supported collection channel, with settlement timing based on the enabled payment partner and processing schedule." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8 grid grid-cols-1 gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2 sm:grid-cols-3", children: MARKETS.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setActiveMarket(item.id),
            className: `flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${activeMarket === item.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`,
            "aria-pressed": activeMarket === item.id,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-md border border-current/20 px-1.5 py-0.5 text-[10px] font-bold", children: item.flag }),
              isKorean ? marketLabels[item.id] : item.label
            ]
          },
          item.id
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-[0.8fr_1.2fr]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-3xl border border-blue-500/25 bg-gradient-to-br from-[#0D1F4A] to-[#0A1530] p-7 sm:p-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300", children: isKorean ? marketLabels[market.id] : market.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-4 text-2xl font-semibold text-white", children: isKorean ? "성공한 수납 건당 하나의 요금" : "One rate per successful collection" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-8 text-sm leading-6 text-slate-300", children: isKorean ? marketSummaries[market.id] : market.summary }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-7 border-b border-white/[0.1] pb-7", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-slate-400", children: isKorean ? "공개 수납 요금" : "Published collection rate" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-5xl font-semibold text-white", children: [
                "0.5",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl text-blue-300", children: "%" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-slate-400", children: isKorean ? "부가세 별도입니다. 엔터프라이즈 계정은 대량 요금을 이용할 수 있습니다." : "Exclusive of VAT. Volume pricing is available for Enterprise accounts." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-sm text-slate-300", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mt-0.5 h-4 w-4 shrink-0 text-emerald-400" }),
                " ",
                isKorean ? "월간 플랫폼 이용료 없음" : "No monthly platform fee"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mt-0.5 h-4 w-4 shrink-0 text-emerald-400" }),
                " ",
                market.currency,
                " ",
                isKorean ? "수납 지원" : "collection support"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mt-0.5 h-4 w-4 shrink-0 text-emerald-400" }),
                " ",
                isKorean ? marketSettlements[market.id] : market.settlement
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-white/[0.08] px-6 py-5 sm:px-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-white", children: isKorean ? "지원되는 수납 방법" : "Supported collection methods" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-400", children: isKorean ? "성공한 거래에 요금이 적용됩니다." : "Rates apply to successful transactions." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: market.methods.map((method, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `grid grid-cols-[1fr_auto] gap-4 px-6 py-5 sm:grid-cols-[1fr_150px_90px] sm:px-8 ${index % 2 === 1 ? "bg-white/[0.02]" : ""}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-200", children: method.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: isKorean ? {
                  "Digital wallets": "디지털 지갑",
                  "Digital wallet": "디지털 지갑",
                  "QR and bank rails": "QR 및 은행 결제망",
                  Cards: "카드",
                  "International cards": "국제 카드",
                  "Alternative cards": "대체 카드",
                  "Direct debit": "자동이체",
                  "Over the counter": "창구 수납"
                }[method.type] || method.type : method.type })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "hidden items-center text-xs text-slate-400 sm:flex", children: isKorean ? marketLabels[market.id] : market.label }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-right text-sm font-semibold text-blue-300", children: method.rate })
            ] }, method.name)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-5xl px-4 pb-20 sm:px-6 sm:pb-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mb-4 h-5 w-5 text-emerald-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-2 text-sm font-semibold text-white", children: isKorean ? "명확한 요금, 예측 가능한 정산" : "Clear pricing, predictable settlement" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-6 text-slate-400", children: isKorean ? "구독료나 플랫폼 추가 요금이 없습니다. 수납이 성공한 후에만 요금이 부과됩니다." : "No subscription fee or platform markup. Fees are charged only after a collection succeeds." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-blue-500/20 bg-blue-500/10 p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "mb-4 h-5 w-5 text-blue-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-2 text-sm font-semibold text-white", children: isKorean ? "대량 요금이 필요하신가요?" : "Need volume pricing?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-4 text-sm leading-6 text-slate-400", children: isKorean ? "맞춤 요금, 정산 일정 및 여러 시장 지원에 대해 상담해 보세요." : "Talk with the team about custom rates, settlement schedules, and multi-market coverage." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: SUPPORT_URL, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 text-sm font-semibold text-blue-300 hover:text-blue-200", children: [
            isKorean ? "영업팀 문의" : "Contact sales",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
          ] })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppFooter, {})
  ] });
}
export {
  CollectionRates as default
};
