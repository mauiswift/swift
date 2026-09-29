import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { u as useLocation, e as useNavigate, a as reactExports, N as Navigate, L as Link } from "./router-vendor-C2eKMart.js";
import { S, l as loginSchema } from "./validation-n1u5uEtP.js";
import { u as useAuth, a as useLanguage, b as ue, S as SUPPORT_URL, c as authApi, B as BrandLogo } from "./index-BWilGeH7.js";
import { T as TelegramLoginWidget } from "./TelegramLoginWidget-B53OPXSi.js";
import { d as ShieldCheck, aj as Fingerprint } from "./utils-vendor-DoKCqRlq.js";
import "./form-vendor-pzQc3cjw.js";
import "./ui-vendor-DsSOT9J9.js";
function SwiftPayLogo({ height = 28 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    BrandLogo,
    {
      src: "/swiftpay-logo-black.svg",
      className: height === 48 ? "h-12" : "h-7"
    }
  );
}
function Login() {
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
  const turnstileSiteKey = "0x4AAAAAAD1UWg_mrK9TYmUm";
  const configuredTelegramBot = void 0;
  const [telegramBotUsername, setTelegramBotUsername] = reactExports.useState("");
  const passwordRef = reactExports.useRef(null);
  const googleButtonRef = reactExports.useRef(null);
  const configuredGoogleClientId = void 0;
  const [googleClientId, setGoogleClientId] = reactExports.useState("");
  const verificationRequired = Boolean(!turnstileToken);
  const handleTurnstileSuccess = (token) => {
    setTurnstileError(false);
    setTurnstileToken(token);
  };
  reactExports.useEffect(() => {
    var _a;
    if ((_a = location.state) == null ? void 0 : _a.sessionExpired) {
      ue.error(isKorean ? "비활성 상태가 지속되어 세션이 만료되었습니다. 다시 로그인하세요." : "Your session expired due to inactivity. Please log in again.");
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [isKorean, location.pathname, location.state, navigate]);
  reactExports.useEffect(() => {
    if (step === "password") setTimeout(() => {
      var _a;
      return (_a = passwordRef.current) == null ? void 0 : _a.focus();
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
    var _a;
    if (!googleClientId || !googleButtonRef.current) return;
    const renderGoogleButton = () => {
      var _a2;
      if (!((_a2 = window.google) == null ? void 0 : _a2.accounts.id) || !googleButtonRef.current) return;
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
        size: "large",
        shape: "circle"
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
  if (user) return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: user.must_change_password ? "/change-password" : "/dashboard", replace: true });
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
      window.location.assign("/dashboard");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : isKorean ? "패스키 로그인에 실패했습니다." : "Passkey login failed");
    } finally {
      setPasskeyLoading(false);
    }
  };
  const handlePasswordStep = async (e) => {
    var _a;
    e.preventDefault();
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      setLocalError(((_a = result.error.issues[0]) == null ? void 0 : _a.message) || t("please_check_input"));
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      if (turnstileSiteKey && !turnstileToken) {
        setLocalError(t("complete_verification"));
        setSubmitting(false);
        return;
      }
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

        .ak-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at 50% 0%, rgba(91, 110, 163, 0.12), transparent 38%),
            var(--auth-bg);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: clamp(16px, 4vw, 48px);
          font-family: "DM Sans", sans-serif;
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
          width: 28px;
          height: 28px;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          background: #f1f3f6;
          color: #1a1a1a;
        }

        .ak-login-methods {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 16px;
        }

        .ak-login-methods .ak-btn-secondary {
          margin-top: 0;
          width: auto;
          flex: 1 1 0;
          min-height: 52px;
        }

        .ak-google-login,
        .ak-telegram-login {
          display: flex;
          min-width: 0;
          height: 52px;
          align-items: center;
          justify-content: center;
          flex: 1 1 0;
          gap: 8px;
          padding: 4px 10px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background: #fff;
          color: #1a1a1a;
          transition: border-color 0.15s, background-color 0.15s, transform 0.15s;
        }

        .ak-google-login > div {
          display: flex;
          align-items: center;
          justify-content: center;
          filter: grayscale(1);
        }

        .ak-telegram-login {
          margin: 0;
        }

        .ak-method-label {
          display: inline;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
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
          margin-top: 60px;
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
            gap: 8px;
            flex-wrap: wrap;
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
          }
          .ak-telegram-login {
            width: 52px;
            flex: 0 0 52px;
            border-radius: 999px;
          }
          .ak-method-label {
            display: none;
          }
        }
      ` }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-page", children: [
      verificationRequired && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-verification-backdrop", role: "presentation", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "section",
        {
          className: "ak-verification-dialog",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "turnstile-title",
          "aria-describedby": "turnstile-description",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-verification-icon", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 24 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "turnstile-title", children: isKorean ? "보안 인증을 기다려 주세요" : "Please Wait for Security Validation" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { id: "turnstile-description", children: isKorean ? "계속하려면 아래 보안 확인을 완료하세요." : "Complete the security check below to continue." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-verification-widget", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              S,
              {
                siteKey: turnstileSiteKey,
                onSuccess: handleTurnstileSuccess,
                onExpire: () => setTurnstileToken(null),
                onError: () => {
                  setTurnstileToken(null);
                  setTurnstileError(true);
                },
                options: { theme: "light", action: "login" }
              }
            ) }),
            turnstileError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "ak-verification-error", role: "alert", children: isKorean ? "인증을 완료할 수 없습니다. 다시 시도하세요." : "Verification could not be completed. Please try again." })
          ]
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-main", children: [
        step === "email" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-step", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-login-logo", "aria-label": "SwiftPay", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SwiftPayLogo, { height: 48 }) }),
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
            googleClientId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-google-login", "aria-label": "Continue with Google", title: "Continue with Google", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: googleButtonRef }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ak-method-label", children: isKorean ? "Google" : "Google" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                className: "ak-btn-secondary",
                onClick: handlePasskeyLogin,
                disabled: passkeyLoading,
                "aria-label": isKorean ? "패스키로 로그인" : "Sign in with passkey",
                title: isKorean ? "패스키로 로그인" : "Sign in with passkey",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ak-passkey-icon", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Fingerprint, { size: 19, strokeWidth: 2 }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ak-method-label", children: passkeyLoading ? isKorean ? "패스키를 기다리는 중…" : "Waiting for passkey…" : isKorean ? "패스키로 로그인" : "Sign in with passkey" })
                ]
              }
            ),
            telegramBotUsername && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-telegram-login", title: t("sign_in_with_telegram"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                TelegramLoginWidget,
                {
                  botName: telegramBotUsername,
                  onAuth: async (telegramUser) => {
                    setLocalError(null);
                    await loginWithTelegram(telegramUser, turnstileToken);
                  }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ak-method-label", children: "Telegram" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/forgot-password", className: "ak-forgot", children: t("forgot_password") })
        ] }),
        step === "password" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "ak-step", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ak-login-logo", "aria-label": "SwiftPay", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SwiftPayLogo, { height: 48 }) }),
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
      ] }) }),
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
