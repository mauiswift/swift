import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { h as useSearchParams, e as useNavigate, a as reactExports, L as Link } from "./router-vendor-C2eKMart.js";
import { S, r as registerSchema } from "./validation-n1u5uEtP.js";
import { M as MarketingPageShell } from "./MarketingPageShell-DUOpYVP8.js";
import { T as TelegramLoginWidget } from "./TelegramLoginWidget-Ddfgctzv.js";
import { o as CircleCheckBig, Y as Building2, d as ShieldCheck, p as CircleAlert, n as ArrowRight } from "./utils-vendor-B--1aD6k.js";
import "./form-vendor-pzQc3cjw.js";
import "./index-CaW3oxHR.js";
import "./ui-vendor-DsSOT9J9.js";
const INITIAL_FORM = {
  full_name: "",
  email: "",
  phone: "",
  address: "",
  business_name: "",
  official_store_name: "",
  nda_accepted: false,
  telegram_user_id: "",
  telegram_username: "",
  google_credential: "",
  telegram_auth: null
};
function PaperField({
  label,
  subLabel,
  required,
  error,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-[17px] font-semibold text-[#1a1a1a]", children: [
      label,
      required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[#ff855b] ml-1", children: "*" })
    ] }),
    subLabel && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] text-[#535353] leading-relaxed mb-3", children: subLabel }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      children,
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 bg-[#ff855b] text-white text-[11px] font-semibold uppercase tracking-widest px-4 py-2.5 rounded-lg text-center animate-in fade-in slide-in-from-top-2 duration-300", children: error })
    ] })
  ] });
}
function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = reactExports.useState(INITIAL_FORM);
  const [errors, setErrors] = reactExports.useState({});
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [success, setSuccess] = reactExports.useState(false);
  const [kybId, setKybId] = reactExports.useState(null);
  const [referenceCode, setReferenceCode] = reactExports.useState(null);
  const [turnstileToken, setTurnstileToken] = reactExports.useState(null);
  const [turnstileError, setTurnstileError] = reactExports.useState(false);
  const [telegramBotUsername, setTelegramBotUsername] = reactExports.useState("");
  const [googleButton, setGoogleButton] = reactExports.useState(null);
  const configuredGoogleClientId = void 0;
  const [googleClientId, setGoogleClientId] = reactExports.useState("");
  const turnstileSiteKey = "0x4AAAAAAD1UWg_mrK9TYmUm";
  reactExports.useEffect(() => {
    var _a;
    const invitedEmail = (_a = searchParams.get("email")) == null ? void 0 : _a.trim();
    if (invitedEmail) setForm((current) => ({ ...current, email: invitedEmail }));
  }, [searchParams]);
  reactExports.useEffect(() => {
    fetch("/api/v1/auth/google-config").then((response) => response.ok ? response.json() : null).then((data) => {
      if (data == null ? void 0 : data.client_id) setGoogleClientId(String(data.client_id).trim());
    }).catch(() => void 0);
  }, [configuredGoogleClientId]);
  reactExports.useEffect(() => {
    fetch("/api/v1/auth/telegram-login-config").then((response) => response.ok ? response.json() : null).then((data) => setTelegramBotUsername((data == null ? void 0 : data.bot_username) || "")).catch(() => setTelegramBotUsername(""));
  }, []);
  reactExports.useEffect(() => {
    var _a;
    if (!googleClientId || !googleButton) return;
    const render = () => {
      var _a2;
      if (!((_a2 = window.google) == null ? void 0 : _a2.accounts.id) || !googleButton) return;
      googleButton.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: ({ credential }) => setForm((current) => ({ ...current, google_credential: credential }))
      });
      window.google.accounts.id.renderButton(googleButton, { type: "standard", theme: "outline", size: "large", text: "signup_with" });
    };
    if ((_a = window.google) == null ? void 0 : _a.accounts.id) render();
    else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    }
  }, [googleButton, googleClientId]);
  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: void 0 }));
  };
  const handleSubmit = async (e) => {
    var _a;
    e.preventDefault();
    if (!form.nda_accepted) {
      setErrors({ nda_accepted: "You must accept the NDA before submitting your registration." });
      return;
    }
    const result = registerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      if (turnstileSiteKey && !turnstileToken) {
        setErrors({ general: "Complete the security verification before submitting." });
        setSubmitting(false);
        return;
      }
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...result.data,
          referral_token: ((_a = searchParams.get("referral")) == null ? void 0 : _a.trim()) || void 0,
          ...turnstileToken ? { cf_turnstile_token: turnstileToken } : {},
          ...form.google_credential ? { google_credential: form.google_credential } : {}
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: (data == null ? void 0 : data.detail) ?? "Registration failed." });
      } else {
        setSuccess(true);
        setKybId(data.kyb_id ?? null);
        setReferenceCode(data.reference_code ?? null);
      }
    } catch {
      setErrors({ general: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };
  const inputClass = (hasError) => `
    w-full bg-transparent border-0 border-b-2 py-3 px-0 text-[18px] text-[#1a1a1a] focus:ring-0 transition-all duration-300 outline-none
    ${hasError ? "border-[#ff855b]" : "border-[#e8c5ad] focus:border-[#1a1a1a]"}
    placeholder:text-slate-300
  `;
  if (success) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(MarketingPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-[70vh] flex items-center justify-center px-6 py-20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-[480px] w-full text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-20 bg-[#d8faf3] border-2 border-[#06d6b6] rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 36, className: "text-[#026153]" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[32px] font-semibold text-[#1a1a1a] tracking-tight mb-4", children: "Application submitted!" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[17px] text-[#535353] leading-relaxed mb-10", children: "Your merchant application has been received. Our team will review your details and reach out via email within 24–48 hours." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => navigate("/login"),
          className: "w-full bg-[#1a1a1a] text-white font-semibold text-[16px] py-4 rounded-full hover:bg-[#2b2b2b] transition-all shadow-lg hover:shadow-xl active:scale-[0.98]",
          children: "Back to Sign In"
        }
      )
    ] }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MarketingPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-[960px] px-8 py-20 md:py-32", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-12 max-w-3xl md:mb-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mb-5 inline-flex items-center gap-2 rounded-full border border-[#f5c8a4] bg-[#fce4d2] px-4 py-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#c2410c]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 rounded-full bg-[#ff855b]" }),
        " Merchant onboarding"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-[clamp(2.5rem,5.5vw,5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-[#1a1a1a] max-w-[12ch]", children: "Start accepting payments" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 max-w-2xl text-[18px] leading-8 text-[#535353]", children: "Apply for a SwiftPay merchant account and manage local and cross-border payment channels from one platform." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-10 grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 rounded-2xl border border-[#f5c8a4] bg-[#fffaf7] p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "mt-0.5 h-5 w-5 shrink-0 text-[#d56f3f]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-[#1a1a1a]", children: "Merchant requirement" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm leading-6 text-[#535353]", children: "A 600 USDT opening deposit may be required and is applied to your transaction balance. Downlines of VIP Gold members are exempt." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 rounded-2xl border border-[#d7f3f0] bg-[#f5fffd] p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mt-0.5 h-5 w-5 shrink-0 text-[#0f9f83]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-[#1a1a1a]", children: "Review and approval" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm leading-6 text-[#535353]", children: "Our team reviews applications and responds by email within 24 to 48 hours." })
        ] })
      ] })
    ] }),
    errors.general && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-10 bg-[#fff5f5] border border-[#ffdada] rounded-2xl p-5 flex items-start gap-4 text-[#c53030] text-[15px] animate-in fade-in slide-in-from-top-4 duration-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-5 w-5 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: errors.general })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-12", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          S,
          {
            siteKey: turnstileSiteKey,
            onSuccess: (token) => {
              setTurnstileError(false);
              setTurnstileToken(token);
            },
            onExpire: () => setTurnstileToken(null),
            onError: () => {
              setTurnstileToken(null);
              setTurnstileError(true);
            },
            options: { theme: "light", action: "signup" }
          }
        ),
        turnstileError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-red-700", role: "alert", children: "Verification could not be completed. Please try again." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[#fffaf7] rounded-[32px] p-8 md:p-16 lg:p-20 shadow-sm border border-[#f5c8a4]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[22px] md:text-[26px] font-semibold text-[#1a1a1a] tracking-tight mb-12", children: "Please provide your company details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-12", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(PaperField, { label: "Company name", subLabel: "Provide your registered business name", required: true, error: errors.business_name, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "e.g. Acme Corp",
              value: form.business_name,
              onChange: (e) => handleChange("business_name", e.target.value),
              className: inputClass(!!errors.business_name)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PaperField, { label: "Your full name", subLabel: "Provide a main contact person's full name", required: true, error: errors.full_name, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "e.g. John Doe",
              value: form.full_name,
              onChange: (e) => handleChange("full_name", e.target.value),
              className: inputClass(!!errors.full_name)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PaperField, { label: "Official store name", subLabel: "Enter the official business or store name that will be integrated with SwiftPay", required: true, error: errors.official_store_name, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "e.g. SwiftPay Official Store",
              value: form.official_store_name,
              onChange: (e) => handleChange("official_store_name", e.target.value),
              className: inputClass(!!errors.official_store_name)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PaperField, { label: "Your email address", subLabel: "Provide e-mail address we will use to contact your company", required: true, error: errors.email, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "email",
              placeholder: "name@company.com",
              value: form.email,
              onChange: (e) => handleChange("email", e.target.value),
              className: inputClass(!!errors.email)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PaperField, { label: "Your mobile number (한국 휴대폰 번호)", subLabel: "Provide a main contact person Korean mobile number (담당자 한국 휴대폰 번호)", required: true, error: errors.phone, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "tel",
              placeholder: "010-XXXX-XXXX 또는 +82 10 XXXX XXXX",
              value: form.phone,
              onChange: (e) => handleChange("phone", e.target.value),
              className: inputClass(!!errors.phone)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(PaperField, { label: "Business address", subLabel: "Provide your registered business address", error: errors.address, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              placeholder: "e.g. BGC, Taguig City",
              value: form.address,
              onChange: (e) => handleChange("address", e.target.value),
              className: inputClass(!!errors.address)
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-[28px] border border-[#d9c7b8] bg-white p-6 shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-[#1a1a1a]", children: "Link sign-in accounts (optional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-[#535353]", children: "Link accounts using the same email to make future sign-in faster." }),
            googleClientId && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", ref: setGoogleButton, "aria-label": "Link Google account" }),
            form.google_credential && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-green-700", children: "Google account linked." }),
            telegramBotUsername && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              TelegramLoginWidget,
              {
                botName: telegramBotUsername,
                onAuth: async (telegramUser) => {
                  setForm((current) => ({
                    ...current,
                    telegram_user_id: String(telegramUser.id),
                    telegram_username: telegramUser.username || "",
                    telegram_auth: telegramUser
                  }));
                }
              }
            ) }),
            form.telegram_user_id && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-green-700", children: "Telegram account linked." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-[28px] border border-[#d9c7b8] bg-white p-6 shadow-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-3 border-b border-[#eee3da] pb-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5 text-[#0f9f83]" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]", children: "Legal acknowledgment" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm font-semibold text-[#1a1a1a]", children: "NDA acceptance is required to register" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "nda_accepted",
                  type: "checkbox",
                  checked: form.nda_accepted,
                  onChange: (e) => handleChange("nda_accepted", e.target.checked),
                  className: "mt-1 h-5 w-5 rounded border-slate-300 text-[#1a1a1a] focus:ring-[#1a1a1a]"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { htmlFor: "nda_accepted", className: "flex-1 text-left text-[15px] leading-7 text-[#1a1a1a]", children: [
                "I confirm that I have read and agree to the ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/nda", target: "_blank", rel: "noreferrer", className: "font-semibold text-[#c2410c] underline underline-offset-4", children: "NDA and confidentiality agreement" }),
                " of Swiftpay Ventures Inc. I understand that checking this box is my electronic acceptance of the agreement and that registration cannot be submitted without it."
              ] })
            ] }),
            errors.nda_accepted && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 bg-[#fff5f5] border border-[#ffdada] rounded-xl px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[#c53030]", children: errors.nda_accepted })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "submit",
            disabled: submitting,
            className: `w-full group relative flex items-center justify-center gap-3 py-5 px-10 rounded-full text-[17px] font-semibold text-white transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-[0.98] ${submitting ? "bg-slate-400 cursor-not-allowed" : "bg-[#1a1a1a] hover:bg-[#2b2b2b]"}`,
            children: submitting ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Submitting Application…" })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Submit Application" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#1a1a1a] group-hover:translate-x-1 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3.5 w-3.5" }) })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 text-center text-[15px] text-[#535353] font-medium", children: [
          "Already have an account?",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "text-[#1a1a1a] font-semibold hover:underline underline-offset-4", children: "Sign in" })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  Register as default
};
