import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { a as reactExports, L as Link } from "./router-vendor-ugVG8BWW.js";
import { A as APP_NAME, C as COMPANY_NAME, S as SUPPORT_URL, v as AppFooter } from "./index-BZw-Kh4U.js";
import { j as Bot, i as MessageCircle, u as ChevronRight, aF as Star, n as ArrowRight, aa as Terminal, aG as BadgeCheck, aH as Monitor, aI as Play, aJ as Layers, aK as Lock, al as Zap, J as CircleCheck, ao as Receipt, S as Send, d as ShieldCheck, Y as Building2, R as RefreshCw, W as Wallet, s as Bell, C as ChartColumn, b as CreditCard, aL as FileText, aM as ChartPie, a8 as Users, v as ChevronLeft, X } from "./utils-vendor-DtbvWOtt.js";
import "./ui-vendor-D6MKKEiL.js";
const screenshots = [
  {
    id: "telegram",
    label: "Telegram Bot",
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    caption: "Telegram bot interface",
    image: "/screenshots/telegram.png"
  },
  {
    id: "dashboard",
    label: "Admin Dashboard",
    badge: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    caption: "Admin dashboard",
    image: "/screenshots/dashboard.png"
  },
  {
    id: "payments",
    label: "Payments Hub",
    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    caption: "Payment creation options",
    image: "/screenshots/payments.png"
  },
  {
    id: "transactions",
    label: "Transactions",
    badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    caption: "Transaction history",
    image: "/screenshots/transactions.png"
  }
];
function ScreenshotFrame({ image, caption }) {
  const [imgOk, setImgOk] = reactExports.useState(!!image);
  return imgOk && image ? /* @__PURE__ */ jsxRuntimeExports.jsx(
    "img",
    {
      src: image,
      alt: caption,
      onError: () => setImgOk(false),
      className: "w-full rounded-2xl border border-slate-600/30 shadow-2xl object-cover",
      draggable: false
    }
  ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-64 items-center justify-center rounded-2xl border border-slate-600/30 bg-slate-900/60 px-6 text-center text-sm text-slate-400", children: "Screenshot unavailable" });
}
function ScreenshotViewer() {
  const [active, setActive] = reactExports.useState(0);
  const [lightbox, setLightbox] = reactExports.useState(null);
  const prev = () => setActive((a) => (a - 1 + screenshots.length) % screenshots.length);
  const next = () => setActive((a) => (a + 1) % screenshots.length);
  const current = screenshots[active];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap justify-center gap-2 mb-8", children: screenshots.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setActive(i),
        className: `px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${i === active ? s.badge : "bg-slate-800/40 text-slate-500 border-slate-700/40 hover:border-slate-600/60"}`,
        children: s.label
      },
      s.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-sm mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: prev,
          className: "absolute -left-10 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all z-10",
          "aria-label": "Previous screenshot",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: next,
          className: "absolute -right-10 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-slate-800/80 border border-slate-700/40 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all z-10",
          "aria-label": "Next screenshot",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "cursor-zoom-in group relative",
          onClick: () => setLightbox(active),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-2xl bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-white text-xs font-medium bg-black/50 px-3 py-1 rounded-full", children: "Click to enlarge" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ScreenshotFrame, { image: current.image, caption: current.caption })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 text-xs text-center mt-3", children: current.caption }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center gap-1.5 mt-3", children: screenshots.map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => setActive(i),
          className: `h-1.5 rounded-full transition-all ${i === active ? "w-5 bg-blue-500" : "w-1.5 bg-slate-600"}`,
          "aria-label": `Go to screenshot ${i + 1}`
        },
        i
      )) })
    ] }),
    lightbox !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:items-center",
        onClick: () => setLightbox(null),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              className: "absolute top-4 right-4 h-9 w-9 rounded-full bg-slate-800/90 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors",
              onClick: () => setLightbox(null),
              "aria-label": "Close lightbox",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "my-auto w-full max-w-xs",
              onClick: (e) => e.stopPropagation(),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  ScreenshotFrame,
                  {
                    image: screenshots[lightbox].image,
                    caption: screenshots[lightbox].caption
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 text-xs text-center mt-3", children: screenshots[lightbox].caption })
              ]
            }
          )
        ]
      }
    )
  ] });
}
function FeatureCard({ icon, title, description, color }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex gap-3 hover:border-slate-600/70 hover:bg-slate-800/70 transition-all duration-200", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `p-2 rounded-lg ${color} shrink-0 h-fit`, children: icon }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-medium text-sm mb-1", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 text-xs leading-relaxed", children: description })
    ] })
  ] });
}
function LogoPill({ src, label, bg }) {
  const [visible, setVisible] = reactExports.useState(true);
  if (!visible) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-2 px-4 py-2.5 rounded-xl border ${bg} bg-slate-800/40`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src, alt: label, className: "h-5 w-auto", onError: () => setVisible(false) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300 text-xs font-medium", children: label })
  ] });
}
function Features() {
  const botFeatures = [
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-4 w-4 text-blue-400" }), title: "Online Payments", description: "Accept payments via merchant portals, custom payment links, REST API, or plugins for Shopify and WooCommerce.", color: "bg-blue-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4 text-purple-400" }), title: "Online Disbursements", description: "Send real-time payouts to vendors and partners individually or in bulk via CSV upload or API.", color: "bg-purple-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4 text-emerald-400" }), title: "Fraud Management", description: "Enterprise-grade fraud detection with BSP compliance, device fingerprinting, and real-time behavioral monitoring.", color: "bg-emerald-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4 text-sky-400" }), title: "Bank Orchestration", description: "Single API integration managing multi-rail routing for all major Philippine banks.", color: "bg-sky-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-4 w-4 text-amber-400" }), title: "AI Payments Assistant", description: "AI-driven collection reminders, voice assistance, and automated KYC screening for high conversion.", color: "bg-amber-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4 text-rose-400" }), title: "Approved Payout Processing", description: "Approved payouts follow the supported operating workflow and bank partner schedule for each payout type.", color: "bg-rose-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-4 w-4 text-teal-400" }), title: "Merchant Wallet Management", description: "Track PHP and supported digital wallet balances with transparent control, approval checks, and built-in operational monitoring.", color: "bg-teal-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4 text-orange-400" }), title: "Instant Notifications", description: "Get real-time Telegram alerts for every successful payment and disbursement.", color: "bg-orange-500/10" }
  ];
  const adminFeatures = [
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "h-4 w-4 text-blue-400" }), title: "Live Dashboard", description: "Real-time overview of wallet balance, revenue, and transaction stats with live SSE updates.", color: "bg-blue-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-4 w-4 text-emerald-400" }), title: "Wallet Management", description: "Top up via payment invoice, withdraw to bank, or disburse funds — all from one screen.", color: "bg-emerald-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-4 w-4 text-purple-400" }), title: "Payments Hub", description: "Create payments via 7 methods: Invoice, QR, Alipay, Maya, Payment Link, VA, E-Wallet.", color: "bg-purple-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-4 w-4 text-sky-400" }), title: "Transaction History", description: "Full searchable and filterable transaction log with status tracking.", color: "bg-sky-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4 text-amber-400" }), title: "Money Management", description: "Manage disbursements, refunds, subscriptions, and customer profiles in one place.", color: "bg-amber-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartPie, { className: "h-4 w-4 text-rose-400" }), title: "Reports & Analytics", description: "Revenue breakdowns, payment method analysis, success rates, and fee calculator.", color: "bg-rose-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4 text-violet-400" }), title: "Admin Management", description: "Role-based access control with per-admin permissions for secure team management.", color: "bg-violet-500/10" },
    { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4 text-teal-400" }), title: "Telegram-Only Auth", description: "Secure login — only verified Telegram users authorized by the team can access the UI.", color: "bg-teal-500/10" }
  ];
  const [videoLoaded, setVideoLoaded] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-[#0A0F1E] text-white", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 overflow-hidden pointer-events-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/8 blur-3xl" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-50 bg-[#0A0F1E]/80 backdrop-blur-xl border-b border-white/5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl mx-auto px-4 h-14 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/login", className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-4 w-4 text-white" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-white text-sm", children: APP_NAME }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-slate-500 text-xs ml-1.5", children: [
            "by ",
            COMPANY_NAME
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/features",
            className: "hidden sm:flex items-center gap-1.5 text-white text-sm font-medium transition-colors px-3 py-1.5 rounded-lg bg-white/5",
            children: "Features"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/pricing",
            className: "hidden sm:flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5",
            children: "Pricing"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: SUPPORT_URL,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "hidden sm:flex items-center gap-1.5 text-slate-400 hover:text-sky-400 text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-sky-500/10",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-4 w-4" }),
              " Support"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/login",
            className: "flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20",
            children: [
              "Sign In ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3.5 w-3.5" })
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative max-w-6xl mx-auto px-4 pt-20 pb-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-300 text-xs font-medium mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3 w-3 fill-blue-400 text-blue-400" }),
        "Telegram-native payment operations · Powered by ",
        APP_NAME
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-5xl md:text-6xl font-semibold text-white leading-[1.1] tracking-tight mb-5", children: [
        "Collect Payments",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-400", children: "via Telegram" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed", children: [
        APP_NAME,
        " lets you accept payments, manage your wallet, send disbursements, and generate QR codes — all through simple bot commands or a sleek admin dashboard."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row gap-3 justify-center mb-16", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/login",
            className: "inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold px-7 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-500/25 text-sm",
            children: [
              "Access Admin Dashboard ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "a",
          {
            href: SUPPORT_URL,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-all text-sm",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-4 w-4 text-sky-400" }),
              " Contact Support"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 mx-auto max-w-2xl text-left", children: "This is not investment advice. Risk disclosure: Trading involves risk. This is paper trading only (no real money)." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left", children: [
        {
          step: "01",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-5 w-5 text-blue-400" }),
          title: "Connect the Bot",
          desc: `Add ${APP_NAME} to your Telegram and get authorized by an admin in seconds.`,
          color: "from-blue-600/20 to-blue-600/5 border-blue-600/20"
        },
        {
          step: "02",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Terminal, { className: "h-5 w-5 text-sky-400" }),
          title: "Send a Command",
          desc: "Type /invoice, /qr, /balance, or any of 22 commands to trigger a payment flow.",
          color: "from-sky-600/20 to-sky-600/5 border-sky-600/20"
        },
        {
          step: "03",
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BadgeCheck, { className: "h-5 w-5 text-emerald-400" }),
          title: "Get Paid",
          desc: "Your customer pays via QR, e-wallet, or bank transfer. You get notified instantly.",
          color: "from-emerald-600/20 to-emerald-600/5 border-emerald-600/20"
        }
      ].map(({ step, icon, title, desc, color }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `relative rounded-2xl bg-gradient-to-b ${color} border p-5`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-4 right-4 text-[10px] font-semibold text-slate-600 tracking-widest", children: step }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 rounded-lg bg-white/5 w-fit mb-3", children: icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white font-semibold text-sm mb-1", children: title }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 text-xs leading-relaxed", children: desc })
      ] }, step)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "max-w-6xl mx-auto px-4 pb-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 bg-slate-500/10 border border-slate-500/20 rounded-full px-4 py-1.5 text-slate-300 text-xs font-semibold mb-4 uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { className: "h-3.5 w-3.5" }),
          " Screenshots"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-semibold text-white", children: "See it in Action" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 mt-3 max-w-xl mx-auto", children: "Browse the bot interface and admin dashboard screenshots below." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScreenshotViewer, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "max-w-6xl mx-auto px-4 pb-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-full px-4 py-1.5 text-rose-300 text-xs font-semibold mb-4 uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-3.5 w-3.5 fill-rose-300" }),
          " Demo Video"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-semibold text-white", children: "Watch a Demo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400 mt-3 max-w-xl mx-auto", children: [
          "See how ",
          APP_NAME,
          " handles real payments end-to-end in under 3 minutes."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative rounded-2xl overflow-hidden border border-slate-600/30 shadow-2xl bg-[#0F172A] aspect-video flex items-center justify-center group", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "video",
            {
              autoPlay: true,
              muted: true,
              loop: true,
              playsInline: true,
              "aria-label": `${APP_NAME} demonstration video`,
              onCanPlay: () => setVideoLoaded(true),
              onError: () => setVideoLoaded(false),
              className: `absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${videoLoaded ? "opacity-100" : "opacity-0"}`,
              src: "/demo.mp4"
            }
          ),
          !videoLoaded && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0F172A] to-slate-900" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "absolute inset-0 opacity-10",
                style: {
                  backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                  backgroundSize: "40px 40px"
                }
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-col items-center gap-4 text-center px-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-8 w-8 text-white" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-white font-semibold text-lg", children: [
                  APP_NAME,
                  " Demo"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 text-sm mt-1", children: "Full walkthrough · Payments · Dashboard · Commands" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "a",
                {
                  href: SUPPORT_URL,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "mt-2 inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold px-6 py-2.5 rounded-xl transition-all text-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-4 w-4 text-sky-400" }),
                    " Request a Live Demo"
                  ]
                }
              )
            ] })
          ] }),
          videoLoaded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 rounded-full bg-blue-600/30 backdrop-blur-sm border border-blue-400/30 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Play, { className: "h-8 w-8 text-white fill-white ml-1" }) }) })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-500 text-xs text-center mt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            "Video demo coming soon · Contact",
            " "
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: SUPPORT_URL, target: "_blank", rel: "noopener noreferrer", "aria-label": "Contact support", className: "text-sky-400 hover:text-sky-300 transition-colors", children: "support@swiftpay.site" }),
          " ",
          "for a live walkthrough"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "max-w-6xl mx-auto px-4 pb-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-300 text-xs font-semibold mb-4 uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "h-3.5 w-3.5" }),
          " Accepted Methods"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-semibold text-white", children: "Supports All Major PH Payment Channels" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 mt-3 max-w-xl mx-auto", children: "From e-wallets to bank virtual accounts — collect payments the way your customers prefer." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 text-xs font-semibold uppercase tracking-wider text-center mb-4", children: "E-Wallets" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap justify-center gap-3", children: [
          { src: "/logos/gcash.png", label: "GCash", bg: "bg-blue-500/10 border-blue-500/20" },
          { src: "/logos/maya.svg", label: "Maya", bg: "bg-green-500/10 border-green-500/20" },
          { src: "/logos/grab.svg", label: "GrabPay", bg: "bg-green-600/10 border-green-600/20" },
          { src: "/logos/alipay.png", label: "Alipay", bg: "bg-sky-500/10 border-sky-500/20" },
          { src: "/logos/wechat.png", label: "WeChat Pay", bg: "bg-emerald-500/10 border-emerald-500/20" }
        ].map(({ src, label, bg }) => /* @__PURE__ */ jsxRuntimeExports.jsx(LogoPill, { src, label, bg }, label)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 text-xs font-semibold uppercase tracking-wider text-center mb-4", children: "Virtual Accounts (Bank Transfer)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap justify-center gap-3", children: [
          { src: "/logos/bdo.svg", label: "BDO", bg: "bg-blue-700/10 border-blue-700/20" },
          { src: "/logos/bpi.svg", label: "BPI", bg: "bg-red-500/10 border-red-500/20" },
          { src: "/logos/unionbank.svg", label: "UnionBank", bg: "bg-orange-500/10 border-orange-500/20" },
          { src: "/logos/rcbc.svg", label: "RCBC", bg: "bg-yellow-600/10 border-yellow-600/20" },
          { src: "/logos/metrobank.svg", label: "Metrobank", bg: "bg-blue-800/10 border-blue-800/20" },
          { src: "/logos/psbank.svg", label: "PSBank", bg: "bg-slate-500/10 border-slate-500/20" }
        ].map(({ src, label, bg }) => /* @__PURE__ */ jsxRuntimeExports.jsx(LogoPill, { src, label, bg }, label)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-y border-white/5 bg-white/[0.02]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-6xl mx-auto px-4 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-6 text-center", children: [
      { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-5 w-5 text-emerald-400 mx-auto mb-2" }), label: "Telegram Auth Only", sub: "Secure by design" },
      { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "h-5 w-5 text-amber-400 mx-auto mb-2" }), label: "PH Payment Gateways", sub: "Multiple payment options" },
      { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { className: "h-5 w-5 text-blue-400 mx-auto mb-2" }), label: "Mobile Friendly", sub: "Works on any device" },
      { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-5 w-5 text-sky-400 mx-auto mb-2" }), label: "7 Payment Methods", sub: "VA, QR, eWallet & more" }
    ].map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-2", children: [
      b.icon,
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-white text-sm font-semibold", children: b.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500 text-xs mt-0.5", children: b.sub })
    ] }, b.label)) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "max-w-6xl mx-auto px-4 py-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-300 text-xs font-semibold mb-4 uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-3.5 w-3.5" }),
          " Telegram Bot"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-semibold text-white", children: "Everything via Telegram" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 mt-3 max-w-xl mx-auto", children: "22 commands covering the full payment lifecycle — no app install required." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-10 rounded-2xl bg-slate-900/60 border border-slate-700/40 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Terminal, { className: "h-3.5 w-3.5 text-slate-400" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 text-xs font-medium", children: "Common Commands" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-700/30", children: [
          { cmd: "/invoice", desc: "Create a payment invoice", color: "text-blue-400" },
          { cmd: "/qr", desc: "Generate a QR code payment", color: "text-purple-400" },
          { cmd: "/alipay", desc: "Alipay / WeChat QR payment", color: "text-red-400" },
          { cmd: "/paylink", desc: "Generate a payment link", color: "text-cyan-400" },
          { cmd: "/va", desc: "Create a virtual bank account", color: "text-amber-400" },
          { cmd: "/balance", desc: "Check your wallet balance", color: "text-emerald-400" },
          { cmd: "/disburse", desc: "Send money to a bank account", color: "text-orange-400" },
          { cmd: "/refund", desc: "Refund a transaction", color: "text-rose-400" },
          { cmd: "/transactions", desc: "View recent transactions", color: "text-slate-300" }
        ].map(({ cmd, desc, color }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-4 py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: `text-xs font-mono font-semibold ${color} shrink-0`, children: cmd }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-500 text-xs", children: desc })
        ] }, cmd)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-3", children: botFeatures.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureCard, { ...f }, f.title)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "max-w-6xl mx-auto px-4 pb-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-purple-300 text-xs font-semibold mb-4 uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Monitor, { className: "h-3.5 w-3.5" }),
          " Admin Dashboard"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-semibold text-white", children: "Powerful Web Dashboard" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-400 mt-3 max-w-xl mx-auto", children: "A full admin portal accessible only to authorized Telegram accounts." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-3", children: adminFeatures.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureCard, { ...f }, f.title)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "max-w-6xl mx-auto px-4 pb-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden bg-gradient-to-br from-blue-900/50 via-slate-800/60 to-purple-900/30 border border-blue-700/30 rounded-3xl p-10 md:p-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-500/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bot, { className: "h-7 w-7 text-white" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl md:text-4xl font-semibold text-white mb-3", children: "Ready to get started?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-400 mb-8 max-w-md mx-auto", children: [
          "Sign in with your authorized Telegram account to access the ",
          APP_NAME,
          " admin dashboard."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Link,
          {
            to: "/login",
            className: "inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-blue-500/25",
            children: [
              "Sign in with Telegram ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-5 text-slate-500 text-sm", children: [
          "Need access?",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: SUPPORT_URL, target: "_blank", rel: "noopener noreferrer", className: "text-sky-400 hover:text-sky-300 transition-colors", children: "Contact support@swiftpay.site" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AppFooter, {})
  ] });
}
export {
  Features as default
};
