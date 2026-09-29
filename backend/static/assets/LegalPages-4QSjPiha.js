import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { M as MarketingPageShell } from "./MarketingPageShell-DAHCT9ZV.js";
import { C as COMPANY_NAME, G as SUPPORT_HANDLE } from "./index-DxezdLhY.js";
import { L as Link } from "./router-vendor-C2eKMart.js";
import { n as ArrowRight, aZ as Mail, a_ as Phone, a$ as MapPin, Y as Building2, b0 as FilePenLine, V as FileCheck2, d as ShieldCheck } from "./utils-vendor-HFbfdctU.js";
import "./ui-vendor-DsSOT9J9.js";
const PROVIDER_NAME = "Swiftpay Ventures Inc.";
const SIGNATORY_NAME = "Authorized Company Signatory";
const SIGNATORY_TITLE = "President";
const SUPPORT_PHONE = "+63 910 335 0434";
const complianceDisclosure = "This platform is a payment and merchant operations service only. It does not provide investment advice, securities products, or real-money trading. Any information is informational only and not a recommendation or guarantee of returns.";
function LegalSection({ title, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.03)] md:p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-5 text-[22px] font-semibold tracking-[-0.04em] text-slate-900", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4 text-[15px] leading-7 text-slate-600", children })
  ] });
}
function ContactPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MarketingPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 py-20 md:px-8 lg:py-28", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Contact" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-[clamp(2.5rem,5vw,4rem)] font-semibold tracking-[-0.06em] text-slate-900", children: [
          "Talk to ",
          COMPANY_NAME
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/register", className: "inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700", children: [
        "Open merchant account ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 rounded-2xl border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-900", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Risk & compliance notice" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: complianceDisclosure })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.03)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Email" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `mailto:${SUPPORT_HANDLE}`, className: "mt-3 block text-lg font-semibold text-slate-900 hover:text-slate-600", children: SUPPORT_HANDLE })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.03)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Phone" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `tel:${SUPPORT_PHONE.replace(/\s+/g, "")}`, className: "mt-3 block text-lg font-semibold text-slate-900 hover:text-slate-600", children: SUPPORT_PHONE })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.03)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-800", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Location" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-lg font-semibold text-slate-900", children: "Manila, Philippines" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#111827,#0f172a)] p-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.15)] md:p-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-5 w-5 text-slate-200" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-300", children: "Provider" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold text-white", children: PROVIDER_NAME })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid gap-6 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-300", children: "Authorized representative" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xl font-semibold text-white", children: SIGNATORY_NAME })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-300", children: "Title" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xl font-semibold text-white", children: SIGNATORY_TITLE })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 rounded-[28px] border border-[#f5c8a4] bg-[#fffaf7] p-6 shadow-sm md:p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fce4d2] text-[#c2410c]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FilePenLine, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.2em] text-[#c2410c]", children: "Confidential discussion" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-2 text-2xl font-semibold tracking-tight text-slate-900", children: "Need an NDA before you contact us?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 max-w-2xl text-[15px] leading-7 text-slate-600", children: "Review the Swiftpay Ventures Inc. confidentiality agreement before sharing sensitive business, technical, or financial information. For a formal NDA signing request, contact our authorized representative through Telegram." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-col gap-3 sm:flex-row", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/nda", className: "inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-700", children: [
            "Review the NDA ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileCheck2, { className: "h-4 w-4" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://t.me/alipayboss", target: "_blank", rel: "noreferrer", className: "inline-flex items-center justify-center gap-2 rounded-full border border-[#e8c5ad] bg-white px-5 py-3 text-sm font-semibold text-[#c2410c] transition-colors hover:bg-[#fff5ed]", children: "Request NDA signing" })
        ] })
      ] })
    ] }) })
  ] }) });
}
function PrivacyPolicyPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MarketingPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-4xl px-6 py-20 md:px-8 lg:py-28", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Privacy policy" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-[clamp(2.3rem,4vw,3.8rem)] font-semibold tracking-[-0.06em] text-slate-900", children: "Privacy policy" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 rounded-2xl border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-900", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Risk & compliance notice" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: complianceDisclosure })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LegalSection, { title: "1. Who we are", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
      PROVIDER_NAME,
      " operates the SwiftPay merchant platform and payment services. We process personal and business information to deliver payment, compliance, onboarding, and support operations."
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LegalSection, { title: "2. Information we collect", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "We may collect your name, business name, email address, phone number, company details, billing information, transaction records, and supporting compliance documents required to onboard and service your account." }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LegalSection, { title: "3. How we use your information", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "We use your information to verify your account, process payments, support merchant onboarding, prevent fraud, meet legal obligations, and provide customer support for the services you access." }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LegalSection, { title: "4. Data sharing", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "We do not sell personal information. We may share limited information with trusted providers, payment processors, banking partners, and regulatory or compliance counterparts when required to deliver secure and compliant services." }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LegalSection, { title: "5. Retention and security", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "We retain personal information only as long as necessary for legal, business, and security purposes. We apply reasonable administrative, technical, and organizational controls to protect your information." }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LegalSection, { title: "6. Your rights", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "You may request updates, corrections, or deletion of your personal data in line with applicable Philippine privacy laws and our internal compliance procedures." }) })
  ] }) });
}
function TermsOfServicePage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MarketingPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-4xl px-6 py-20 md:px-8 lg:py-28", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Terms of service" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-[clamp(2.3rem,4vw,3.8rem)] font-semibold tracking-[-0.06em] text-slate-900", children: "Terms of service" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 rounded-2xl border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-900", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold", children: "Risk & compliance notice" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1", children: complianceDisclosure })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LegalSection, { title: "1. Agreement", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
      "By creating a merchant account and using the SwiftPay platform, you agree to comply with the terms and conditions of ",
      PROVIDER_NAME,
      ", including applicable laws, transaction rules, and service requirements."
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LegalSection, { title: "2. Authorized use", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "You agree to use the platform only for lawful business purposes and to provide accurate information. You are responsible for maintaining the security of your account and authorized access credentials." }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LegalSection, { title: "3. Payment services", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
      PROVIDER_NAME,
      " enables digital payment acceptance and payouts subject to verification, service availability, and compliance checks. The platform may be suspended or restricted if required by security, regulatory, or fraud safeguards."
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LegalSection, { title: "4. Liability", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "We provide the platform on an as-is basis and seek to maintain reliable service levels, but we do not guarantee uninterrupted access or error-free operation. Our liability is limited to the extent permitted by law." }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LegalSection, { title: "5. Changes to terms", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "We may update these terms from time to time. Continued use of the service after updates constitutes your acceptance of the revised terms." }) })
  ] }) });
}
function NdaPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MarketingPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-4xl px-6 py-20 md:px-8 lg:py-28", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Confidentiality" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-[clamp(2.2rem,4vw,3.6rem)] font-semibold tracking-[-0.06em] text-slate-900", children: "NDA agreement" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(LegalSection, { title: "Non-disclosure agreement", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "This Non-Disclosure Agreement is entered into by and between ",
        PROVIDER_NAME,
        " and the registering merchant or authorized representative who submits an onboarding application through the SwiftPay merchant account registration process."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "The merchant acknowledges that, in connection with onboarding and platform access, the company may disclose non-public information including business strategy, financial data, technical information, transaction analytics, pricing, product plans, security practices, and compliance information." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "The merchant agrees not to disclose, copy, share, or misuse any confidential information belonging to ",
        PROVIDER_NAME,
        " except as necessary to perform obligations under the merchant relationship and only for lawful business purposes."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "Confidential information remains protected for as long as it remains non-public and protected under applicable law. The merchant agrees to use reasonable care to protect the confidentiality and integrity of all information received from ",
        PROVIDER_NAME,
        "."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "By completing registration and selecting the acceptance checkbox, the merchant confirms that they have read and agree to this NDA and that the acceptance is binding and effective immediately." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6 md:p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500", children: "Authorized signatory" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-semibold tracking-[-0.04em] text-slate-900", children: SIGNATORY_NAME }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-600", children: SIGNATORY_TITLE })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left md:text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-slate-500", children: "For" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold text-slate-900", children: PROVIDER_NAME })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/register", className: "inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-700", children: [
        "Continue registration ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/contact", className: "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:text-slate-900", children: "Contact provider" })
    ] })
  ] }) });
}
function LegalPageOverview() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MarketingPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl px-6 py-20 md:px-8 lg:py-28", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500", children: "Legal center" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-[clamp(2.4rem,5vw,4rem)] font-semibold tracking-[-0.06em] text-slate-900", children: "Company policies" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-5 md:grid-cols-2 xl:grid-cols-4", children: [{ title: "Contact", text: "Support, sales, and business inquiries", to: "/contact", icon: Mail }, { title: "Privacy Policy", text: "How we safeguard merchant and customer data", to: "/privacy-policy", icon: ShieldCheck }, { title: "Terms of Service", text: "The rules for using the platform", to: "/terms-of-service", icon: FileCheck2 }, { title: "NDA", text: "Confidentiality agreement for all registrations", to: "/nda", icon: ShieldCheck }].map(({ title, text, to, icon: Icon }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to, className: "rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.03)] transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.05)]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold text-slate-900", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-6 text-slate-600", children: text })
    ] }, title)) })
  ] }) });
}
export {
  ContactPage,
  LegalPageOverview,
  NdaPage,
  PrivacyPolicyPage,
  TermsOfServicePage
};
