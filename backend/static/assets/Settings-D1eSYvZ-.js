import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { e as useNavigate, a as reactExports } from "./router-vendor-C2eKMart.js";
import { a as useLanguage, u as useAuth, i as hasPermission, g as client, L as Layout, b as ue, j as useTranslation } from "./index-C9--HWz5.js";
import { k as Shield, an as Store, r as Landmark, ao as KeyRound, ap as SlidersHorizontal, d as ShieldCheck, J as CircleCheck, p as CircleAlert, L as Link2, aq as Copy } from "./utils-vendor-DoKCqRlq.js";
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
  const t = useTranslation(language);
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
          t("settings_workspace_settings")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "m-0 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl", children: t("nav_settings") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-2xl text-sm leading-6 text-slate-500", children: t("settings_workspace_subtitle") })
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.14em]", children: t("settings_account") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-900", children: t("settings_security_access") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-500", children: t("settings_manage_login") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-blue-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { size: 16 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.14em]", children: t("settings_workspace") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-900", children: t("settings_store_config") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-500", children: t("settings_store_config_desc") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-amber-700", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { size: 16 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.14em]", children: t("settings_operations") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold text-slate-900", children: t("settings_review_payout") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-500", children: t("settings_review_payout_desc") })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "app-panel p-4 sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold text-slate-900", children: t("settings_account_and_store") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: t("settings_account_and_store_desc") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-medium text-slate-400", children: t("settings_quick_settings") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2", children: ITEMS.map((item) => {
        const Icon = item.icon;
        const localizedItem = isKo ? {
          "Account & Security": { title: t("settings_account_security"), description: t("settings_account_security_desc") },
          "Store profile": { title: t("settings_store_profile"), description: t("settings_store_profile_desc") },
          Banking: { title: t("settings_banking"), description: t("settings_banking_desc") },
          "API & Integration": { title: t("settings_api_integration"), description: t("settings_api_integration_desc") }
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
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[15px] font-semibold text-slate-900", children: t("settings_team_registration_link") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[12px] leading-relaxed text-slate-600", children: t("settings_team_link_help") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-col gap-3 sm:flex-row", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { readOnly: true, value: referralLinkLoading ? t("settings_loading_link") : referralLink, className: "min-w-0 flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700", "aria-label": t("settings_team_registration_link") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            disabled: !referralLink,
            onClick: () => navigator.clipboard.writeText(referralLink).then(() => ue.success(t("settings_link_copied"))).catch(() => ue.error(t("settings_link_copy_failed"))),
            className: "inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 16 }),
              " ",
              t("settings_copy_link")
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
