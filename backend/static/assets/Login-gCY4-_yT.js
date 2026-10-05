import { j as jsxRuntimeExports } from "./query-vendor-C00BCiYd.js";
import { u as useLocation, f as useNavigate, a as reactExports, N as Navigate, L as Link } from "./router-vendor-ugVG8BWW.js";
import { u as useAuth, a as useLanguage, b as ue, S as SUPPORT_URL, c as authApi, B as BrandLogo } from "./index-CCyidPsK.js";
import { l as loginSchema } from "./validation-COweD0HV.js";
import { T as TelegramLoginWidget } from "./TelegramLoginWidget-BAbtxf_2.js";
import { an as Fingerprint } from "./utils-vendor-DtbvWOtt.js";
import "./ui-vendor-D6MKKEiL.js";
import "./form-vendor-BljP2yhR.js";
function AuthLogo({
  height = 28,
  logoUrl,
  name
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    BrandLogo,
    {
      src: logoUrl || "/swiftpay-logo-black.svg",
      alt: name || "SwiftPay",
      className: height === 48 ? "h-12" : "h-7"
    }
  );
}
function Login() {
  var _a;
  const { user, login, loginWithTelegram, loginWithGoogle, loading, error, platformBranding } = useAuth();
  const { t, language } = useLanguage();
  const isKorean = language === "ko";
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = reactExports.useState("email");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [localError, setLocalError] = reactExports.useState(null);
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [turnstileToken, setTurnstileToken] = reactExports.useState(null);
  const [turnstileError, setTurnstileError] = reactExports.useState(false);
  const [passkeyLoading, setPasskeyLoading] = reactExports.useState(false);
  const turnstileSiteKey = void 0;
  const configuredTelegramBot = void 0;
  const [telegramBotUsername, setTelegramBotUsername] = reactExports.useState("");
  const passwordRef = reactExports.useRef(null);
  const googleButtonRef = reactExports.useRef(null);
  const configuredGoogleClientId = void 0;
  const [googleClientId, setGoogleClientId] = reactExports.useState("");
  const stateFrom = typeof ((_a = location.state) == null ? void 0 : _a.from) === "string" ? location.state.from : null;
  const redirectPath = stateFrom && stateFrom.startsWith("/") && !stateFrom.startsWith("/login") ? stateFrom : "/dashboard";
  reactExports.useEffect(() => {
    var _a2;
    if ((_a2 = location.state) == null ? void 0 : _a2.sessionExpired) {
      ue.error(isKorean ? "비활성 상태가 지속되어 세션이 만료되었습니다. 다시 로그인하세요." : "Your session expired due to inactivity. Please log in again.");
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [isKorean, location.pathname, location.state, navigate]);
  reactExports.useEffect(() => {
    if (step === "password") setTimeout(() => {
      var _a2;
      return (_a2 = passwordRef.current) == null ? void 0 : _a2.focus();
    }, 40);
  }, [step]);
  reactExports.useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/auth/google-config").then(async (response) => {
      if (!response.ok) throw new Error("Google login is not configured");
      return response.json();
    }).then((data) => {
      if (!cancelled && (data == null ? void 0 : data.client_id)) {
        setGoogleClientId(String(data.client_id).trim());
      }
    }).catch(() => void 0);
    return () => {
      cancelled = true;
    };
  }, [configuredGoogleClientId]);
  reactExports.useEffect(() => {
    var _a2;
    if (!googleClientId || !googleButtonRef.current) return;
    const renderGoogleButton = () => {
      var _a3;
      if (!((_a3 = window.google) == null ? void 0 : _a3.accounts.id) || !googleButtonRef.current) return;
      googleButtonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => {
          setLocalError(null);
          void loginWithGoogle(credential, turnstileToken);
        }
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: "icon",
        theme: "outline",
        size: "medium",
        shape: "circle"
      });
    };
    if ((_a2 = window.google) == null ? void 0 : _a2.accounts.id) {
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
  }, [googleClientId, loginWithGoogle, turnstileToken]);
  reactExports.useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/auth/telegram-login-config").then(async (response) => {
      if (!response.ok) throw new Error("Telegram login is not configured");
      return response.json();
    }).then((data) => {
      if (!cancelled && (data == null ? void 0 : data.bot_username)) {
        setTelegramBotUsername(String(data.bot_username).replace(/^@/, "").trim());
      }
    }).catch(() => void 0);
    return () => {
      cancelled = true;
    };
  }, [configuredTelegramBot]);
  if (user) return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: user.must_change_password ? "/change-password" : redirectPath, replace: true });
  const handleEmailStep = (e) => {
    e.preventDefault();
    setLocalError(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setLocalError(t("enter_valid_email"));
      return;
    }
    setStep("password");
  };
  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    setLocalError(null);
    try {
      await authApi.loginWithPasskey();
      window.location.assign(redirectPath);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : isKorean ? "패스키 로그인에 실패했습니다." : "Passkey login failed");
    } finally {
      setPasskeyLoading(false);
    }
  };
  const handlePasswordStep = async (e) => {
    var _a2;
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setLocalError(((_a2 = result.error.issues[0]) == null ? void 0 : _a2.message) || t("please_check_input"));
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      if (turnstileSiteKey && !turnstileToken) ;
      await login(result.data.email, result.data.password, turnstileToken ?? void 0);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : t("login_failed"));
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
        :root {
          --auth-bg: #f9f9f9;
          --auth-card: #ffffff;
          --text-100: #1a1a1a;
          --text-200: #666666;
          --border-color: #e2e2e2;
          --link-color: #5b6ea3;
        }

        .ak-demo-box {
          margin-top: 16px;
          padding: 14px;
          border: 1px solid var(--border-color);
          border-radius: 14px;
          background: linear-gradient(180deg, rgba(91, 110, 163, 0.08), rgba(255, 255, 255, 0.85));
        }

        .ak-demo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .ak-demo-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-200);
        }

        .ak-demo-pill {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          border-radius: 999px;
          padding: 4px 10px;
          border: 1px solid rgba(91, 110, 163, 0.35);
          color: rgba(91, 110, 163, 0.95);
          background: rgba(91, 110, 163, 0.08);
        }

        .ak-demo-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .ak-demo-btn {
          min-height: 44px;
          border-radius: 12px;
          border: 1px solid rgba(226, 226, 226, 0.9);
          background: #ffffff;
          color: #1a1a1a;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: -0.01em;
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
        }

        .ak-demo-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 28px rgba(15, 23, 42, 0.10);
          border-color: rgba(91, 110, 163, 0.55);
        }

        .ak-demo-note {
          margin: 10px 0 0;
          font-size: 12px;
          color: rgba(102, 102, 102, 0.95);
        }

        .ak-page {
          min-height: 100vh;
          min-height: 100dvh;
          background:
            radial-gradient(circle at 50% 0%, rgba(91, 110, 163, 0.12), transparent 38%),
            var(--auth-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: clamp(16px, 4vw, 48px);
          font-family: "DM Sans", sans-serif;
        }

        .ak-page-inner {
          width: 100%;
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ak-card {
          background-color: var(--auth-card);
          width: 100%;
          max-width: 520px;
          padding: clamp(28px, 5vw, 52px) clamp(20px, 6vw, 64px);
          border: 1px solid rgba(226, 226, 226, 0.9);
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .ak-grid {
          display: block;
        }

        .ak-side {
          display: none;
        }

        .ak-main {
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          text-align: center;
        }

        .ak-login-logo {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .ak-title {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-100);
          margin-bottom: 24px;
          letter-spacing: -0.01em;
          line-height: 1.1;
        }

        .ak-subtitle {
          font-size: 1rem;
          color: var(--text-200);
          margin: 28px auto 30px;
          max-width: 340px;
          line-height: 1.5;
        }

        .ak-form-item {
          margin-bottom: 18px;
          text-align: left;
        }

        .ak-label {
          display: block;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-100);
          margin-bottom: 8px;
        }

        .ak-label .req {
          color: #ef4444;
          margin-left: 4px;
        }

        .ak-input {
          width: 100%;
          border: 1px solid var(--border-color);
          padding: 12px 14px;
          min-height: 52px;
          font-size: 15px;
          border-radius: 10px;
          outline: none;
          transition: border-color 0.2s;
          color: var(--text-100);
          background: #fff;
        }

        .ak-input::placeholder {
          font-style: italic;
          color: #999;
        }

        .ak-input:focus {
          border-color: var(--text-100);
          box-shadow: 0 0 0 3px rgba(91, 110, 163, 0.14);
        }

        .ak-btn-primary {
          width: 100%;
          background-color: #1a1a1a;
          color: #ffffff;
          border: none;
          padding: 16px;
          font-size: 16px;
          font-weight: 700;
          border-radius: 10px;
          cursor: pointer;
          transition: background-color 0.15s;
          margin-top: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 52px;
        }

        .ak-btn-secondary {
          width: 100%;
          margin-top: 12px;
          background: #ffffff;
          color: #1a1a1a;
          border: 1px solid var(--border-color);
          padding: 14px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: border-color 0.15s, background-color 0.15s, transform 0.15s;
        }

        .ak-passkey-icon {
          display: inline-flex;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #f8fafc;
          border: 1px solid var(--border-color);
          color: #1a1a1a;
        }

        .ak-login-methods {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
          width: 100%;
        }

        .ak-login-methods .ak-btn-secondary {
          margin-top: 0;
        }

        .ak-google-login,
        .ak-telegram-login {
          display: flex;
          flex: 0 0 52px;
          width: 52px;
          height: 52px;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 0;
          border: 1px solid var(--border-color);
          border-radius: 999px;
          background: #fff;
          color: #1a1a1a;
          transition: border-color 0.15s, background-color 0.15s, transform 0.15s;
          cursor: pointer;
        }

        .ak-google-login > div {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 40px;
          width: 40px;
          height: 40px;
          overflow: hidden;
          border-radius: 999px;
          transform: scale(0.92);
        }

        .ak-telegram-login {
          margin: 0;
        }

        .ak-telegram-login > div:first-child {
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 40px;
          width: 40px;
          height: 40px;
        }

        .ak-passkey-login {
          flex: 0 0 52px;
          width: 52px;
          height: 52px;
          padding: 0;
          border-radius: 999px;
          min-height: 52px;
        }

        .ak-method-label {
          display: none;
        }

        .ak-btn-secondary:hover,
        .ak-google-login:hover,
        .ak-telegram-login:hover {
          border-color: #aeb8d5;
          background: #f8f9fc;
          transform: translateY(-1px);
        }

        .ak-btn-secondary:focus-visible,
        .ak-google-login:focus-within,
        .ak-telegram-login:focus-within,
        .ak-btn-primary:focus-visible,
        .ak-forgot:focus-visible,
        .ak-identity-btn:focus-visible {
          outline: 3px solid rgba(91, 110, 163, 0.3);
          outline-offset: 2px;
        }

        .ak-btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .ak-btn-primary:hover {
          background-color: #000;
        }

        .ak-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ak-forgot {
          display: inline-block;
          margin-top: 36px;
          font-size: 15px;
          color: var(--link-color);
          font-weight: 500;
          text-decoration: none;
        }

        .ak-forgot:hover {
          text-decoration: underline;
        }

        .ak-telegram-widget {
          display: flex;
          min-height: 44px;
          width: 100%;
          align-items: center;
          justify-content: center;
        }

        .ak-error-box {
          font-size: 14px;
          color: #b30745;
          background-color: #fff5f5;
          border: 1px solid #feb3ce;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 24px;
          font-weight: 600;
          text-align: left;
        }

        .ak-identity-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 32px;
          background: #f8f9fc;
          padding: 8px 12px;
          border-radius: 6px;
        }

        .ak-identity-text {
          font-size: 15px;
          color: #363f72;
          font-weight: 700;
        }

        .ak-identity-btn {
          background: none;
          border: none;
          color: var(--text-200);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .ak-footer {
          margin-top: 0;
          padding-top: 24px;
          padding-bottom: 8px;
          display: flex;
          justify-content: center;
          gap: 40px;
        }

        .ak-footer-item {
          font-size: 13px;
          color: #94a3b8;
          text-decoration: none;
          font-weight: 500;
        }

        .ak-footer-item:hover {
          color: #64748b;
        }

        @media (min-width: 1024px) {
          .ak-card {
            max-width: 980px;
            padding: 0;
            overflow: hidden;
          }

          .ak-grid {
            display: grid;
            grid-template-columns: 1fr 460px;
            align-items: stretch;
          }

          .ak-side {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 42px 44px;
            border-right: 1px solid rgba(226, 226, 226, 0.9);
            background:
              radial-gradient(circle at 20% 10%, rgba(91, 110, 163, 0.14), transparent 45%),
              linear-gradient(180deg, rgba(248, 249, 252, 1) 0%, rgba(255, 255, 255, 1) 100%);
          }

          .ak-side-top {
            min-width: 0;
          }

          .ak-side-logo {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 18px;
            min-width: 0;
          }

          .ak-side-brand {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.02em;
            color: var(--text-100);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .ak-side-title {
            font-size: 28px;
            font-weight: 850;
            color: var(--text-100);
            letter-spacing: -0.02em;
            line-height: 1.08;
            margin: 0;
            max-width: 360px;
          }

          .ak-side-sub {
            margin: 12px 0 0;
            color: var(--text-200);
            font-size: 14px;
            line-height: 1.55;
            max-width: 360px;
          }

          .ak-side-list {
            margin: 22px 0 0;
            padding: 0;
            list-style: none;
            display: grid;
            gap: 10px;
            max-width: 360px;
          }

          .ak-side-list li {
            display: flex;
            gap: 10px;
            align-items: flex-start;
            padding: 10px 12px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.75);
            border: 1px solid rgba(226, 226, 226, 0.65);
            color: #334155;
            font-size: 13px;
            font-weight: 650;
          }

          .ak-side-list li::before {
            content: "";
            margin-top: 3px;
            width: 10px;
            height: 10px;
            border-radius: 999px;
            background: #0b63ff;
            box-shadow: 0 0 0 3px rgba(11, 99, 255, 0.12);
            flex: 0 0 auto;
          }

          .ak-side-support {
            display: inline-flex;
            gap: 10px;
            align-items: center;
            justify-content: space-between;
            padding-top: 18px;
            border-top: 1px solid rgba(226, 226, 226, 0.75);
            color: #475569;
            text-decoration: none;
            font-size: 13px;
            font-weight: 700;
          }

          .ak-side-support:hover {
            color: #0f172a;
          }

          .ak-main {
            max-width: none;
            margin: 0;
            padding: 42px 44px;
          }

          .ak-subtitle {
            margin-top: 16px;
          }
        }

        .ak-load-spin {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        .ak-verification-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(8px);
        }

        .ak-verification-dialog {
          width: 100%;
          max-width: 420px;
          padding: 32px 28px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 18px;
          background: #ffffff;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
          text-align: center;
        }

        .ak-verification-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          border-radius: 14px;
          background: #eff6ff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }

        .ak-verification-dialog h2 {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 750;
        }

        .ak-verification-dialog p {
          margin: 10px auto 22px;
          max-width: 320px;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }

        .ak-verification-widget {
          display: flex;
          min-height: 66px;
          align-items: center;
          justify-content: center;
        }

        .ak-verification-error {
          margin-top: 16px;
          color: #b91c1c;
          font-size: 13px;
          font-weight: 600;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .ak-card {
            padding: 28px 18px 24px;
            border-radius: 20px;
          }
          .ak-main {
            margin-top: 0;
          }
          .ak-login-methods {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }
          .ak-login-methods .ak-btn-secondary {
            width: 52px;
            height: 52px;
            flex: 0 0 52px;
            padding: 0;
            border-radius: 999px;
          }
          .ak-google-login,
          .ak-telegram-login {
            width: 52px;
            flex: 0 0 52px;
            border-radius: 999px;
            padding: 0;
            align-items: center;
            justify-content: center;
          }
          .ak-telegram-login {
            width: 52px;
            flex: 0 0 52px;
            border-radius: 999px;
            padding: 0;
          }
          .ak-google-login > div {
            width: 100%;
            height: 100%;
          }
          .ak-method-label {
            display: none;
          }
        }
      ` }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-page", children: [
      turnstileSiteKey,
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-page-inner", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-grid", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "ak-side", "aria-label": isKorean ? "로그인 안내" : "Login information", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-side-top", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-side-logo", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(AuthLogo, { height: 28, logoUrl: platformBranding == null ? void 0 : platformBranding.logoUrl, name: platformBranding == null ? void 0 : platformBranding.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ak-side-brand", children: (platformBranding == null ? void 0 : platformBranding.name) || "SwiftPay" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "ak-side-title", children: isKorean ? "안전한 대시보드 액세스" : "Secure dashboard access" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "ak-side-sub", children: isKorean ? "인증된 계정만 로그인할 수 있습니다. 보안 검증이 활성화된 경우 화면의 안내를 따라주세요." : "Only verified accounts can sign in. If security validation is enabled, follow the on-screen prompt." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "ak-side-list", "aria-label": isKorean ? "주요 기능" : "Highlights", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: isKorean ? "역할 계층: 플랫폼 소유자, 조직 관리자, 매니저, 운영자, 조회 전용" : "Role hierarchy: platform owner, organization admin, manager, operator, and viewer" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: isKorean ? "개발자 역할은 금융 권한과 분리된 통합 설정을 관리" : "Developer access is separated from financial controls" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: isKorean ? "서명 검증된 결제 제공업체 웹훅 및 트랜잭션 이력" : "Provider-signed payment webhooks and transaction history" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: isKorean ? "지갑, 정산, 승인 흐름을 권한별로 관리" : "Permission-scoped wallet, settlement, and approval workflows" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { className: "ak-side-support", href: SUPPORT_URL, target: "_blank", rel: "noopener noreferrer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isKorean ? "도움이 필요하신가요? 지원팀에 문의하세요" : "Need help? Contact support" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { "aria-hidden": "true", children: "→" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-main", children: [
          step === "email" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-step", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-login-logo", "aria-label": (platformBranding == null ? void 0 : platformBranding.name) || "SwiftPay", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AuthLogo, { height: 48, logoUrl: platformBranding == null ? void 0 : platformBranding.logoUrl, name: platformBranding == null ? void 0 : platformBranding.name }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "ak-subtitle", children: t("login_to_continue").replace("{brand}", (platformBranding == null ? void 0 : platformBranding.name) || "SwiftPay") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleEmailStep, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-form-item", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "ak-email", className: "ak-label", children: [
                  t("email_label"),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "req", children: "*" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: "ak-email",
                    type: "email",
                    autoComplete: "email",
                    autoFocus: true,
                    value: email,
                    onChange: (e) => {
                      setEmail(e.target.value);
                      setLocalError(null);
                    },
                    placeholder: t("email_placeholder"),
                    className: "ak-input"
                  }
                )
              ] }),
              localError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-error-box", children: localError }),
              error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-error-box", children: error }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "submit",
                  className: "ak-btn-primary",
                  children: t("login_button")
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-login-methods", "aria-label": isKorean ? "다른 로그인 방법" : "Other sign-in methods", children: [
              googleClientId && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-google-login", "aria-label": "Continue with Google", title: "Continue with Google", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: googleButtonRef }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "ak-btn-secondary ak-passkey-login",
                  onClick: handlePasskeyLogin,
                  disabled: passkeyLoading,
                  "aria-label": isKorean ? "패스키로 로그인" : "Sign in with passkey",
                  title: isKorean ? "패스키로 로그인" : "Sign in with passkey",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ak-passkey-icon", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Fingerprint, { size: 19, strokeWidth: 2 }) })
                }
              ),
              telegramBotUsername && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-telegram-login", "aria-label": t("sign_in_with_telegram"), title: t("sign_in_with_telegram"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TelegramLoginWidget,
                {
                  botName: telegramBotUsername,
                  uiSize: "sm",
                  title: t("sign_in_with_telegram"),
                  ariaLabel: t("sign_in_with_telegram"),
                  showUserPhoto: false,
                  onAuth: async (telegramUser) => {
                    setLocalError(null);
                    await loginWithTelegram(telegramUser, turnstileToken);
                  }
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/forgot-password", className: "ak-forgot", children: t("forgot_password") })
          ] }),
          step === "password" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-step", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-login-logo", "aria-label": (platformBranding == null ? void 0 : platformBranding.name) || "SwiftPay", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AuthLogo, { height: 48, logoUrl: platformBranding == null ? void 0 : platformBranding.logoUrl, name: platformBranding == null ? void 0 : platformBranding.name }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-identity-row", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ak-identity-text", children: email }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "ak-identity-btn",
                  onClick: () => {
                    setStep("email");
                    setLocalError(null);
                    setPassword("");
                  },
                  children: t("change")
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handlePasswordStep, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-form-item", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "ak-password", className: "ak-label", children: [
                  t("password_label"),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "req", children: "*" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: "ak-password",
                    type: "password",
                    ref: passwordRef,
                    autoComplete: "current-password",
                    value: password,
                    onChange: (e) => {
                      setPassword(e.target.value);
                      setLocalError(null);
                    },
                    placeholder: t("password_placeholder"),
                    className: "ak-input"
                  }
                )
              ] }),
              (localError || error) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-error-box", children: localError || error }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "submit",
                  className: "ak-btn-primary",
                  children: submitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ak-load-spin" }),
                    " ",
                    t("signing_in")
                  ] }) : t("login_button")
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/forgot-password", className: "ak-forgot", children: t("forgot_password") })
          ] })
        ] })
      ] }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "ak-footer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/terms-of-service", className: "ak-footer-item", children: t("terms_of_use") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/privacy-policy", className: "ak-footer-item", children: t("privacy_policy") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: SUPPORT_URL, target: "_blank", rel: "noopener noreferrer", className: "ak-footer-item", children: t("contact_us") })
      ] })
    ] })
  ] });
}
export {
  Login as default
};
