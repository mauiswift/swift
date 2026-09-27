import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { e as useNavigate, a as reactExports } from "./router-vendor-C2eKMart.js";
import { a as useLanguage, u as useAuth, i as hasPermission, g as client, L as Layout, b as ue } from "./index-DrbT3WcF.js";
import { k as Shield, am as Store, r as Landmark, an as KeyRound, ao as SlidersHorizontal, d as ShieldCheck, J as CircleCheck, p as CircleAlert, L as Link2, ap as Copy } from "./utils-vendor-BFordG78.js";
import "./ui-vendor-DsSOT9J9.js";
const BASE_ITEMS = [
  {
    title: "Account & Security",
    description: "Telegram linking, password management, and account security.",
    icon: Shield,
    href: "/settings/account-security",
    enabled: true
  },
  {
    title: "Store profile",
    description: "Shop name, logo, platform settings, and multicurrency.",
    icon: Store,
    href: "/settings/shop/preferences",
    enabled: true
  },
  {
    title: "Banking",
    description: "Bank account details and payout settings.",
    icon: Landmark,
    href: "/settings/shop/settlement",
    enabled: true
  },
  {
    title: "API & Integration",
    description: "API keys, webhooks, and integration settings.",
    icon: KeyRound,
    href: "/settings/shop/credentials",
    enabled: true
  }
];
function Settings() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { isSuperAdmin, permissions } = useAuth();
  const [referralLink, setReferralLink] = reactExports.useState("");
  const [referralLinkLoading, setReferralLinkLoading] = reactExports.useState(false);
  const isKo = language === "ko";
  const ITEMS = reactExports.useMemo(() => {
    const items = [...BASE_ITEMS];
    return items.filter((item) => item.enabled !== false).filter((item) => item.href !== "/settings/shop/credentials" || hasPermission(permissions, "can_manage_bot"));
  }, [permissions]);
  reactExports.useEffect(() => {
    setReferralLinkLoading(true);
    client.get("/api/v1/team/referral-link").then((res) => {
      var _a;
      if (res.ok && ((_a = res.data) == null ? void 0 : _a.registration_link)) setReferralLink(res.data.registration_link);
    }).catch(() => void 0).finally(() => setReferralLinkLoading(false));
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter mx-auto w-full max-w-6xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-blue-50/60 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { size: 14 }),
          isKo ? "워크스페이스 설정" : "Workspace settings"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "m-0 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl", children: isKo ? "설정" : "Settings" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-slate-500", children: isKo ? "계정, 상점, 결제 및 운영 환경을 한 곳에서 관리하세요." : "Manage your account, store, payments, and operating environment from one place." })
      ] }),
      isSuperAdmin && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex w-fit items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 14 }),
        " Super Admin"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mb-8 grid gap-3 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-emerald-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 16 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.14em]", children: "Account" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-900", children: "Security and access" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-500", children: "Manage login protection and Telegram linking." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-blue-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { size: 16 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.14em]", children: "Workspace" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-900", children: "Store configuration" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-500", children: "Keep your storefront and currencies up to date." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-amber-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 16 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.14em]", children: "Operations" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-900", children: "Review payout details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-500", children: "Confirm settlement and integration settings before going live." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "app-panel p-4 sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-slate-900", children: isKo ? "계정 및 상점" : "Account and store" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: isKo ? "자주 사용하는 계정, 상점, 뱅킹 및 연동 설정입니다." : "Frequently used account, store, banking, and integration settings." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-medium text-slate-400", children: isKo ? "빠른 설정" : "Quick settings" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: ITEMS.map((item) => {
        const Icon = item.icon;
        const localizedItem = isKo ? {
          "Account & Security": { title: "계정 및 보안", description: "Telegram 연결, 비밀번호 관리 및 계정 보안" },
          "Store profile": { title: "상점 프로필", description: "상점 이름, 로고, 플랫폼 설정 및 다중 통화" },
          Banking: { title: "뱅킹", description: "은행 계좌 정보 및 지급 설정" },
          "API & Integration": { title: "API 및 연동", description: "API 키, 웹훅 및 연동 설정" }
        }[item.title] : null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => navigate(item.href),
            type: "button",
            className: "group flex min-h-[112px] items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md sm:p-5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 19, strokeWidth: 2 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "m-0 text-sm font-semibold leading-5 text-slate-900", children: (localizedItem == null ? void 0 : localizedItem.title) || item.title }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500", "aria-hidden": "true", children: "→" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 text-xs leading-5 text-slate-500", children: (localizedItem == null ? void 0 : localizedItem.description) || item.description })
              ] })
            ]
          },
          item.title
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 max-w-3xl rounded-xl border border-emerald-200 bg-emerald-50/60 p-6 shadow-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { size: 18, className: "mt-0.5 flex-shrink-0 text-emerald-600" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[15px] font-semibold text-slate-900", children: isKo ? "팀 등록 링크" : "Team registration link" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[12px] leading-relaxed text-slate-600", children: isKo ? "이 링크를 팀원에게 보내 직접 등록하도록 하세요." : "Share this link with team members so they can register directly under your organization." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-col gap-3 sm:flex-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { readOnly: true, value: referralLinkLoading ? isKo ? "불러오는 중..." : "Loading..." : referralLink, className: "min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700", "aria-label": isKo ? "팀 등록 링크" : "Team registration link" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            disabled: !referralLink,
            onClick: () => navigator.clipboard.writeText(referralLink).then(() => ue.success(isKo ? "링크가 복사되었습니다." : "Registration link copied")).catch(() => ue.error(isKo ? "링크를 복사하지 못했습니다." : "Unable to copy registration link")),
            className: "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 16 }),
              " ",
              isKo ? "복사" : "Copy link"
            ]
          }
        )
      ] })
    ] })
  ] }) });
}
export {
  Settings as default
};
