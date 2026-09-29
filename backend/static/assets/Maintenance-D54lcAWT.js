import { u as useQuery, j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { a as reactExports, e as useNavigate, L as Link } from "./router-vendor-C2eKMart.js";
import { B as BrandLogo, l as clearStoredToken, g as client } from "./index-BPsF-pQS.js";
import { w as LogOut, aL as Clock3, aM as Wifi, J as CircleCheck, d as ShieldCheck, av as ArrowLeft } from "./utils-vendor-HFbfdctU.js";
import "./ui-vendor-DsSOT9J9.js";
const emptyCountdown = { days: 0, hours: 0, minutes: 0, seconds: 0 };
function getCountdown(endAt) {
  if (!endAt) return emptyCountdown;
  const remaining = Math.max(0, new Date(endAt).getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1e3);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor(totalSeconds % 86400 / 3600),
    minutes: Math.floor(totalSeconds % 3600 / 60),
    seconds: totalSeconds % 60
  };
}
function CountdownCard({ value, label }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-4 text-center shadow-inner shadow-white/[0.03] sm:px-5 sm:py-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-3xl font-bold tracking-tight text-white sm:text-4xl", children: String(value).padStart(2, "0") }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400", children: label })
  ] });
}
function MaintenancePage() {
  const [countdown, setCountdown] = reactExports.useState(emptyCountdown);
  const navigate = useNavigate();
  const handleLogout = () => {
    clearStoredToken();
    navigate("/login", { replace: true });
  };
  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ["maintenance-status"],
    queryFn: async () => {
      const response = await client.apiCall.invoke({
        url: "/api/v1/app-settings/maintenance",
        method: "GET",
        data: {}
      });
      if (!response.ok) throw new Error("Unable to read maintenance status");
      return response.data;
    },
    refetchInterval: 3e4,
    retry: 2
  });
  reactExports.useEffect(() => {
    setCountdown(getCountdown(maintenanceData == null ? void 0 : maintenanceData.maintenance_ends_at));
    const timer = window.setInterval(() => {
      setCountdown(getCountdown(maintenanceData == null ? void 0 : maintenanceData.maintenance_ends_at));
    }, 1e3);
    return () => window.clearInterval(timer);
  }, [maintenanceData == null ? void 0 : maintenanceData.maintenance_ends_at]);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "grid min-h-screen place-items-center bg-[#08111f] px-6 text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 animate-pulse rounded-2xl bg-blue-400/20", "aria-label": "점검 상태를 불러오는 중" }) });
  }
  if (!(maintenanceData == null ? void 0 : maintenanceData.maintenance_mode)) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { lang: "ko", className: "relative min-h-screen overflow-hidden bg-[#07111f] px-5 py-8 text-white sm:px-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(45,127,249,0.2),transparent_32%),radial-gradient(circle_at_85%_85%,rgba(25,196,180,0.12),transparent_30%)]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-3", "aria-label": "SwiftPay 홈", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-10 w-10 place-items-center rounded-xl bg-white shadow-lg shadow-black/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BrandLogo, { alt: "", className: "h-7 w-7" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold tracking-tight", children: "SwiftPay" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 sm:flex", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" }),
            "한국 서버 업그레이드"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: handleLogout,
              className: "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
              "aria-label": "로그아웃",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-3.5 w-3.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "로그아웃" })
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto w-full max-w-3xl py-14 text-center sm:py-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-7 grid h-16 w-16 place-items-center rounded-2xl border border-blue-300/20 bg-blue-400/10 shadow-2xl shadow-blue-950/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock3, { className: "h-8 w-8 text-blue-300" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.28em] text-blue-300", children: "예정된 시스템 점검" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 text-4xl font-black tracking-[-0.04em] text-white sm:text-6xl", children: "곧 다시 만나 뵙겠습니다." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-400 sm:text-base", children: "더 빠르고 안정적인 결제 처리를 위해 한국 서버를 새로운 인프라로 이전하고 있습니다. 계정과 결제 데이터는 안전하게 보호됩니다." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm font-semibold text-emerald-300", children: "고객님의 자금은 안전하게 보호됩니다." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 rounded-3xl border border-white/10 bg-white/[0.05] p-4 shadow-2xl shadow-black/20 sm:p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between px-1 text-left", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-white", children: "예상 남은 시간" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: "서버를 다시 배포해도 카운트다운은 유지됩니다." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { className: "hidden h-5 w-5 text-blue-300 sm:block" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-2 sm:gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CountdownCard, { value: countdown.days, label: "일" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CountdownCard, { value: countdown.hours, label: "시간" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CountdownCard, { value: countdown.minutes, label: "분" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CountdownCard, { value: countdown.seconds, label: "초" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 grid gap-3 text-left sm:grid-cols-3", children: [
          ["인프라 이전 중", "더 빠르고 안정적인 서버로 이동합니다"],
          ["데이터 보호", "보안 시스템이 계속 작동합니다"],
          ["자동 서비스 재개", "별도의 조치가 필요하지 않습니다"]
        ].map(([title, body]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mt-0.5 h-5 w-5 shrink-0 text-emerald-300" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-200", children: title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-500", children: body })
          ] })
        ] }, title)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "flex flex-col gap-6 border-t border-white/10 pt-5 text-xs text-slate-500 sm:flex-row sm:items-end sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3 sm:items-start", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4 text-emerald-300" }),
            "점검 중에도 고객님의 데이터는 안전하게 보호됩니다"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600", children: "기술 파트너" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-lg px-2 py-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "img",
              {
                src: "/partners/drl-technology-gold.png",
                alt: "DRL Technology",
                className: "h-14 w-auto max-w-[260px] object-contain drop-shadow-[0_0_14px_rgba(245,190,55,0.6)]"
              }
            ) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/login", className: "inline-flex items-center justify-center gap-2 font-semibold text-blue-300 transition hover:text-white sm:justify-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3.5 w-3.5" }),
          "로그인으로 이동"
        ] })
      ] })
    ] })
  ] });
}
export {
  MaintenancePage as default
};
