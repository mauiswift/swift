import { j as jsxRuntimeExports } from "./query-vendor-DbSHy-Pt.js";
import { f as useNavigate, a as reactExports } from "./router-vendor-BtBWUifS.js";
import { a as useLanguage, u as useAuth, L as Layout, f as Button, D as Dialog, r as DialogContent, s as DialogHeader, t as DialogTitle, v as DialogFooter, h as client, b as ue, c as authApi } from "./index-CgvbpU93.js";
import { T as TelegramLoginWidget } from "./TelegramLoginWidget-mIwk3Ie0.js";
import { v as ChevronLeft, d as ShieldCheck, aq as KeyRound, z as LoaderCircle, S as Send, aH as Unlink2, aI as Chrome, ar as LockKeyhole } from "./utils-vendor-Dj1Vigod.js";
import "./ui-vendor-CliYdUyU.js";
function AccountSecure() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const tx = (en, ko, zh) => language === "zh" ? zh ?? en : language === "en" ? en : ko;
  const { user, refetch } = useAuth();
  const [loading, setLoading] = reactExports.useState(false);
  const [telegramLinkStatus, setTelegramLinkStatus] = reactExports.useState({ linked: false });
  const [showUnlinkDialog, setShowUnlinkDialog] = reactExports.useState(false);
  const [unlinkLoading, setUnlinkLoading] = reactExports.useState(false);
  const [linkingInstructions, setLinkingInstructions] = reactExports.useState(false);
  const configuredTelegramBot = void 0;
  const [telegramBotName, setTelegramBotName] = reactExports.useState("");
  const [telegramBotConfigError, setTelegramBotConfigError] = reactExports.useState(false);
  const [linking, setLinking] = reactExports.useState(false);
  const [googleLinkStatus, setGoogleLinkStatus] = reactExports.useState({ linked: false });
  const [passkeyLoading, setPasskeyLoading] = reactExports.useState(false);
  const googleButtonRef = reactExports.useRef(null);
  const configuredGoogleClientId = void 0;
  const [googleClientId, setGoogleClientId] = reactExports.useState("");
  reactExports.useEffect(() => {
    const fetchTelegramStatus = async () => {
      var _a;
      try {
        setLoading(true);
        const res = await client.get("/api/v1/auth/telegram-link-status");
        if (res.ok && res.data) {
          setTelegramLinkStatus(res.data);
        }
        const googleRes = await client.get("/api/v1/auth/google-link-status");
        if (googleRes.ok && googleRes.data) setGoogleLinkStatus(googleRes.data);
        if (!configuredGoogleClientId) {
          const googleConfig = await client.get("/api/v1/auth/google-config");
          if (googleConfig.ok && ((_a = googleConfig.data) == null ? void 0 : _a.client_id)) {
            setGoogleClientId(String(googleConfig.data.client_id).trim());
          }
        }
      } catch (err) {
        console.error("Failed to fetch telegram link status:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchTelegramStatus();
      fetch("/api/v1/auth/telegram-login-config").then(async (response) => {
        if (!response.ok) throw new Error("Telegram login is not configured");
        return response.json();
      }).then((data) => {
        const botName = String((data == null ? void 0 : data.bot_username) || "").replace(/^@/, "").trim();
        if (botName) {
          setTelegramBotName(botName);
          setTelegramBotConfigError(false);
        } else {
          setTelegramBotConfigError(true);
        }
      }).catch(() => {
        setTelegramBotConfigError(true);
      });
    }
  }, [configuredGoogleClientId, configuredTelegramBot, user]);
  reactExports.useEffect(() => {
    var _a;
    if (!googleClientId || googleLinkStatus.linked) return;
    const renderGoogleButton = () => {
      var _a2;
      const element = googleButtonRef.current;
      if (!((_a2 = window.google) == null ? void 0 : _a2.accounts.id) || !element) return;
      element.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => {
          void handleGoogleLink(credential);
        }
      });
      window.google.accounts.id.renderButton(element, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: "380",
        text: "continue_with",
        shape: "rectangular"
      });
    };
    if ((_a = window.google) == null ? void 0 : _a.accounts.id) {
      renderGoogleButton();
      return;
    }
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    const script = existingScript || document.createElement("script");
    if (!existingScript) {
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", renderGoogleButton, { once: true });
    return () => script.removeEventListener("load", renderGoogleButton);
  }, [googleClientId, googleLinkStatus.linked]);
  const handleGoogleLink = async (credential) => {
    var _a, _b;
    setLinking(true);
    try {
      const res = await client.post("/api/v1/auth/google-link", { credential });
      if (res.ok) {
        ue.success("Google account linked successfully");
        setGoogleLinkStatus({ linked: true, google_email: (_a = res.data) == null ? void 0 : _a.google_email });
      } else {
        ue.error(((_b = res.data) == null ? void 0 : _b.detail) || "Failed to link Google account");
      }
    } catch {
      ue.error("Error linking Google account");
    } finally {
      setLinking(false);
    }
  };
  const handleTelegramLink = async (telegramUser) => {
    var _a;
    setLinking(true);
    try {
      const res = await client.post("/api/v1/auth/telegram-link", telegramUser);
      if (res.ok) {
        ue.success("Telegram account linked successfully");
        setTelegramLinkStatus(res.data);
        await refetch();
      } else {
        ue.error(((_a = res.data) == null ? void 0 : _a.detail) || "Failed to link Telegram account");
      }
    } catch (err) {
      ue.error("Error linking Telegram account");
    } finally {
      setLinking(false);
    }
  };
  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    try {
      await authApi.registerPasskey();
      ue.success("Passkey registered successfully");
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Passkey registration failed");
    } finally {
      setPasskeyLoading(false);
    }
  };
  const handleUnlinkTelegram = async () => {
    var _a;
    setUnlinkLoading(true);
    try {
      const res = await client.post("/api/v1/auth/telegram-unlink");
      if (res.ok) {
        ue.success("Telegram account unlinked successfully");
        setShowUnlinkDialog(false);
        setTelegramLinkStatus({ linked: false });
      } else {
        ue.error(((_a = res.data) == null ? void 0 : _a.detail) || "Failed to unlink Telegram account");
      }
    } catch (err) {
      ue.error("Error unlinking Telegram account");
      console.error(err);
    } finally {
      setUnlinkLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Layout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter mx-auto w-full max-w-5xl px-1 pb-16 sm:px-2 lg:pb-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[11px] font-medium text-slate-400 sm:mb-8 sm:text-[12px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-pointer hover:text-slate-600 transition-colors", onClick: () => navigate("/settings"), children: tx("Settings", "설정") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: "/" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-semibold", children: "Account & Security" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6 flex items-center justify-between gap-3 sm:mb-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-2.5 sm:gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => navigate("/settings"),
            type: "button",
            "aria-label": "Back to settings",
            title: "Back to settings",
            className: "app-touch-target shrink-0 rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-2xl", children: tx("Account & Security", "계정 및 보안") }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 sm:space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white shadow-sm sm:mb-2 sm:p-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-200 ring-1 ring-white/15", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 21 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-blue-200", children: "Security center" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-1 text-lg font-semibold tracking-tight sm:text-xl", children: "Protect your SwiftPay account" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-2xl text-sm leading-relaxed text-slate-300", children: "Add trusted sign-in methods and keep your account recovery options up to date." })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel overflow-hidden p-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-100 bg-slate-50/70 p-5 sm:p-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { size: 19, strokeWidth: 1.9 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-slate-900", children: tx("Passkey login", "패스키 로그인") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: "Fast, device-based authentication" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 sm:p-7", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-6 max-w-2xl text-sm leading-relaxed text-slate-600", children: "Register this device’s biometrics or security key for passwordless sign-in." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: handleRegisterPasskey, disabled: passkeyLoading, className: "min-h-11 w-full sm:w-auto", children: [
              passkeyLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 16, className: "mr-2 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { size: 16, className: "mr-2" }),
              passkeyLoading ? "Registering…" : "Register passkey"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel overflow-hidden p-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-100 bg-slate-50/70 p-5 sm:p-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { size: 19, strokeWidth: 1.9 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-slate-900", children: tx("Telegram Account Linking", "Telegram 계정 연결") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: "Connect your Telegram identity" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 sm:p-7", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-6 max-w-2xl text-sm leading-relaxed text-slate-600", children: "Link your Telegram account to manage your bot and access features directly from Telegram. This enables secure authentication and seamless bot integration." }),
            loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 24, className: "animate-spin text-slate-400" }) }) : telegramLinkStatus.linked ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 20, className: "text-green-600 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] font-semibold text-green-900", children: "Telegram Account Linked" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[12px] text-green-700 mt-1", children: [
                    telegramLinkStatus.telegram_username && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                      "Username: ",
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("code", { className: "bg-white px-2 py-1 rounded text-green-900 font-mono", children: [
                        "@",
                        telegramLinkStatus.telegram_username
                      ] })
                    ] }),
                    telegramLinkStatus.telegram_id && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2", children: [
                      "ID: ",
                      /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "bg-white px-2 py-1 rounded text-green-900 font-mono text-[11px]", children: telegramLinkStatus.telegram_id })
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => setShowUnlinkDialog(true),
                  className: "w-full flex items-center justify-center gap-2 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors px-4 py-3 rounded-xl font-semibold text-[13px]",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Unlink2, { size: 16 }),
                    "Unlink Telegram Account"
                  ]
                }
              )
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-amber-50 border border-amber-200 rounded-xl p-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] font-semibold text-amber-900", children: "Not linked yet" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-amber-700 mt-2", children: "Your Telegram account is not currently linked. You can link it using the login widget or by following the instructions below." })
              ] }),
              telegramBotName && !linking ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TelegramLoginWidget, { botName: telegramBotName, onAuth: handleTelegramLink, showUserPhoto: false }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-900", children: "Continue with Telegram" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs leading-relaxed text-slate-500", children: "A Telegram window will open to verify your account." })
                ] })
              ] }) : linking ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2 py-3 text-[13px] text-slate-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 16, className: "animate-spin" }),
                " Linking Telegram account..."
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-rose-200 bg-rose-50 p-4 text-[12px] text-rose-700", role: "alert", children: telegramBotConfigError ? "Telegram linking is temporarily unavailable. Please refresh this page or contact support." : "Loading the Telegram linking button..." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-500 text-center", children: "💡 Tip: You can also link by logging in with Telegram on the login page" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel overflow-hidden p-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-100 bg-slate-50/70 p-5 sm:p-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Chrome, { size: 19, strokeWidth: 1.9 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-slate-900", children: tx("Google Account Linking", "Google 계정 연결") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: "Use your trusted Google identity" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 sm:p-7", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-6 max-w-2xl text-sm leading-relaxed text-slate-600", children: "Link the Google account that uses your SwiftPay email for a faster and more secure sign-in." }),
            googleLinkStatus.linked ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 20, className: "text-green-600 flex-shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] font-semibold text-green-900", children: "Google Account Linked" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-green-700 mt-1", children: googleLinkStatus.google_email })
              ] })
            ] }) : googleClientId ? linking ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2 py-3 text-[13px] text-slate-500", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 16, className: "animate-spin" }),
              " Linking Google account..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-11 w-full max-w-full items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 sm:w-fit", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: googleButtonRef, className: "max-w-full" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-500", children: "Google account linking is not configured." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "app-panel overflow-hidden p-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-100 bg-slate-50/70 p-5 sm:p-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LockKeyhole, { size: 19, strokeWidth: 1.9 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold text-slate-900", children: tx("Password", "비밀번호") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-slate-500", children: "Maintain a strong account credential" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 sm:p-7", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] text-slate-600 mb-6", children: "Keep your account secure by using a strong, unique password." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => navigate("/change-password"),
                className: "w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-3 rounded-xl font-semibold text-[13px] transition-colors",
                children: "Change Password"
              }
            )
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: linkingInstructions, onOpenChange: setLinkingInstructions, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "How to Link Telegram Account" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm", children: "1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-[13px] text-slate-900", children: "Use the Login Widget" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-600 mt-1", children: 'On the login page, click "Sign in with Telegram" to authenticate with your Telegram account.' })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm", children: "2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-[13px] text-slate-900", children: "Confirm Your Details" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-600 mt-1", children: "Make sure your Telegram username matches your account username for automatic linking." })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm", children: "3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-[13px] text-slate-900", children: "Instant Linking" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-600 mt-1", children: "Your accounts will be automatically linked, and you'll see the status here." })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[12px] text-blue-900", children: [
          "ℹ️ ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Note:" }),
          " Your Telegram username must match your account username for automatic linking to work."
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "outline",
          onClick: () => setLinkingInstructions(false),
          className: "w-full",
          children: "Got it"
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showUnlinkDialog, onOpenChange: setShowUnlinkDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Unlink Telegram Account?" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] text-slate-600 py-4", children: "Are you sure you want to unlink your Telegram account? You won't be able to log in with Telegram until you link it again." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "outline",
            onClick: () => setShowUnlinkDialog(false),
            disabled: unlinkLoading,
            className: "flex-1",
            children: "Cancel"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "destructive",
            onClick: handleUnlinkTelegram,
            disabled: unlinkLoading,
            className: "flex-1",
            children: unlinkLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { size: 16, className: "animate-spin mr-2" }),
              "Unlinking..."
            ] }) : "Unlink"
          }
        )
      ] })
    ] }) })
  ] });
}
export {
  AccountSecure as default
};
