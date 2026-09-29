import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { i as useParams, e as useNavigate, h as useSearchParams, a as reactExports, L as Link } from "./router-vendor-C2eKMart.js";
import { Q as QRCodeSVG } from "./index-wGjaXQdC.js";
import { P as PaymentBrandLogo, d as cn, a as useLanguage, g as client, A as APP_NAME, m as getCurrencyName, o as getCurrencySymbol, h as fmtCurrency, j as useTranslation, b as ue } from "./index-DI9hQtnS.js";
import { g as getCheckoutPaymentBrands, f as fetchPaymentChannels, i as isPaymentChannelEnabled } from "./paymentChannels-DKsIp7Ah.js";
import { g as getTransactionPaymentMethodBrand } from "./paymentMethodBranding-DDgzQyg4.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-scP9MW2M.js";
import { D as Dialog, a as DialogContent } from "./dialog-BgTucinY.js";
import { r as resolveCheckoutQrPanelMode, n as normalizeCheckoutQrValue } from "./checkoutQr-Dkn_xoTn.js";
import { D as DEFAULT_KRW_BANK_NAME, n as normalizeKrwBankName, K as KRW_BANKS, i as isSupportedKrwBank } from "./krw-banks-Bde261A5.js";
import { p as CircleAlert, an as Store, d as ShieldCheck, J as CircleCheck, u as ChevronRight, aq as Copy, K as ArrowUpRight, aN as Smartphone, z as LoaderCircle, aO as Clock, n as ArrowRight, Y as Building2, Z as Search, as as ExternalLink, ag as QrCode, b as CreditCard } from "./utils-vendor-HFbfdctU.js";
import "./ui-vendor-DsSOT9J9.js";
import "./transactions-iCGOaGQ5.js";
function CheckoutPoweredBy({ className, currency = "PHP", paymentChannels }) {
  const brands = getCheckoutPaymentBrands(paymentChannels, currency);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: cn("checkout-powered-by", className), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-4 text-center text-[11px] leading-relaxed text-slate-500", children: "By continuing, you acknowledge that you are authorizing this payment to the merchant shown above." }),
    brands.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "checkout-payment-logos", "aria-label": `Accepted ${currency.toUpperCase()} payment methods`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "checkout-payment-logos-label", children: "Accepted payment methods" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "checkout-payment-logos-list", children: brands.map((brand) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        PaymentBrandLogo,
        {
          brand,
          size: "sm",
          className: "checkout-payment-logo"
        },
        brand
      )) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "checkout-compliance-badges", "aria-label": "Security and compliance certifications", children: [
      { src: "/logos/compliance/iso-27001.webp", alt: "ISO/IEC 27001 certified" },
      { src: "/logos/compliance/bsp.webp", alt: "Bangko Sentral ng Pilipinas" },
      { src: "/logos/compliance/pci-dss.webp", alt: "PCI DSS compliant" }
    ].map((badge) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "checkout-compliance-badge", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: badge.src, alt: badge.alt }) }, badge.src)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "checkout-powered-by-label", children: "Powered by" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "a",
      {
        href: "https://drltechnology.com",
        target: "_blank",
        rel: "noreferrer",
        className: "checkout-powered-by-brand",
        "aria-label": "DRL Technology",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "img",
          {
            src: "/partners/drl-technology-gold.png",
            alt: "DRL Technology",
            className: "checkout-powered-by-logo"
          }
        )
      }
    )
  ] });
}
const CURRENCY_CAPABILITIES = {
  PHP: { manualDeposit: false, magpieCard: true, country: "PH" },
  KRW: { manualDeposit: true, magpieCard: true, country: "KR" },
  CNY: { manualDeposit: false, magpieCard: true, country: "CN" },
  USDT: { manualDeposit: true, magpieCard: false, country: "PH" },
  USD: { manualDeposit: false, magpieCard: false, country: "PH" },
  EUR: { manualDeposit: false, magpieCard: false, country: "PH" },
  GBP: { manualDeposit: false, magpieCard: false, country: "PH" }
};
function getCurrencyCapabilities(currency) {
  return CURRENCY_CAPABILITIES[currency] || {
    manualDeposit: false,
    magpieCard: false,
    country: "PH"
  };
}
function getCheckoutErrorMessage(value, fallback) {
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value)) {
    const messages = value.map((item) => getCheckoutErrorMessage(item, "")).filter(Boolean);
    if (messages.length) return messages.join(", ");
  }
  if (value && typeof value === "object") {
    const error = value;
    for (const key of ["detail", "message", "error", "msg"]) {
      const message = getCheckoutErrorMessage(error[key], "");
      if (message) return message;
    }
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
    }
  }
  return fallback;
}
function SignaturePrompt({
  canvasRef,
  error,
  signerName,
  customerBankName,
  customerBankAccountName,
  customerBankAccountNumber,
  signatureConsent,
  onSignerNameChange,
  onCustomerBankNameChange,
  onCustomerBankAccountNameChange,
  onCustomerBankAccountNumberChange,
  onConsentChange,
  onStart,
  onDraw,
  onEnd,
  onClear,
  onConfirm
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-4", role: "dialog", "aria-modal": "true", "aria-labelledby": "digital-signature-title", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-y-auto px-4 pb-4 pt-5 sm:p-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl bg-amber-100 p-2 text-amber-700", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 20 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { id: "digital-signature-title", className: "text-lg font-semibold text-slate-900", children: "Confirm payment" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm leading-6 text-slate-600", children: "Enter your details and sign to authorize this payment." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.14em] text-slate-500", children: "Your details" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-semibold text-slate-700", htmlFor: "digital-signer-name", children: [
          "Full name",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "digital-signer-name", value: signerName, onChange: (event) => onSignerNameChange(event.target.value), className: "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-slate-400", placeholder: "Enter your full legal name", autoComplete: "name" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-semibold text-slate-700", htmlFor: "customer-bank-name", children: [
          "Bank name",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "customer-bank-name", value: customerBankName, onChange: (event) => onCustomerBankNameChange(event.target.value), className: "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-slate-400", placeholder: "Enter your bank name", autoComplete: "organization" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-semibold text-slate-700", htmlFor: "customer-bank-account-name", children: [
          "Account holder",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "customer-bank-account-name", value: customerBankAccountName, onChange: (event) => onCustomerBankAccountNameChange(event.target.value), className: "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-normal text-slate-900 outline-none focus:border-slate-400", placeholder: "Name on the bank account", autoComplete: "name" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm font-semibold text-slate-700", htmlFor: "customer-bank-account-number", children: [
          "Account number",
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "customer-bank-account-number", value: customerBankAccountNumber, onChange: (event) => onCustomerBankAccountNumberChange(event.target.value), className: "mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-mono font-normal text-slate-900 outline-none focus:border-slate-400", placeholder: "Enter your bank account number", autoComplete: "off", inputMode: "numeric" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between px-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-slate-600", children: "Draw your signature" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-medium text-slate-400", children: "Use your finger" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("canvas", { ref: canvasRef, width: 900, height: 240, className: "h-32 w-full touch-none rounded-xl bg-white sm:h-36", onPointerDown: onStart, onPointerMove: onDraw, onPointerUp: onEnd, onPointerCancel: onEnd, "aria-label": "Draw your digital signature" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm leading-5 text-slate-600", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: signatureConsent, onChange: (event) => onConsentChange(event.target.checked), className: "mt-0.5 h-5 w-5 shrink-0 accent-slate-900" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "I confirm these details and authorize this payment." })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600", children: error })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 gap-3 border-t border-slate-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClear, className: "min-h-12 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50", children: "Clear signature" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onConfirm, className: "min-h-12 flex-[1.35] rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800", children: "Confirm and sign" })
    ] })
  ] }) });
}
function isSecurityBankName(value) {
  const normalized = String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized.includes("securitybank") || normalized === "secbank";
}
function Checkout() {
  var _a, _b, _c, _d;
  const { externalId, identifier } = useParams();
  const checkoutId = externalId ?? identifier;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const [txn, setTxn] = reactExports.useState(null);
  const [institutions, setInstitutions] = reactExports.useState([]);
  const [paymentChannels, setPaymentChannels] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [loadingInstitutions, setLoadingLoadingInstitutions] = reactExports.useState(false);
  const [institutionLoadFailed, setInstitutionLoadFailed] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [copied, setCopied] = reactExports.useState(false);
  const [showQR, setShowQR] = reactExports.useState(false);
  const [showQRPhModal, setShowQRPhModal] = reactExports.useState(false);
  const [qrInstructionApp, setQrInstructionApp] = reactExports.useState(null);
  const openAmount = searchParams.get("open_amount") === "1";
  const [enteredAmount, setEnteredAmount] = reactExports.useState("");
  const [openAmountRequestId, setOpenAmountRequestId] = reactExports.useState(null);
  const [openAmountSubmitted, setOpenAmountSubmitted] = reactExports.useState(false);
  const [gcashDeepLink, setGcashDeepLink] = reactExports.useState(null);
  const [phpBankSearch, setPhpBankSearch] = reactExports.useState("");
  const [showCheckoutModal, setShowCheckoutModal] = reactExports.useState(false);
  const [checkoutModalUrl, setCheckoutModalUrl] = reactExports.useState(null);
  const [cardCheckoutLoading, setCardCheckoutLoading] = reactExports.useState(false);
  const [swiftPayCurrencyLoading, setSwiftPayCurrencyLoading] = reactExports.useState(null);
  const [swiftPayQuotes, setSwiftPayQuotes] = reactExports.useState({});
  const [showCardForm, setShowCardForm] = reactExports.useState(false);
  const [cardForm, setCardForm] = reactExports.useState({ name: "", number: "", expMonth: "", expYear: "", cvc: "", country: "KR" });
  const [checkoutDesign, setCheckoutDesign] = reactExports.useState({
    display_name: "",
    primary_color: "#071B3A",
    accent_color: "#1475D1",
    page_background: "#F9FAFB",
    heading_color: "#0F172A",
    body_text_color: "#475569",
    card_radius: 24,
    payment_layout: "grid",
    payment_alignment: "left",
    show_powered_by: true
  });
  const [cardFormError, setCardFormError] = reactExports.useState(null);
  const [walletMethod, setWalletMethod] = reactExports.useState(null);
  const [walletCheckoutLoading, setWalletCheckoutLoading] = reactExports.useState(false);
  const [walletFormError, setWalletFormError] = reactExports.useState(null);
  const [digitalSignature, setDigitalSignature] = reactExports.useState("");
  const [signatureError, setSignatureError] = reactExports.useState("");
  const [showSignaturePrompt, setShowSignaturePrompt] = reactExports.useState(false);
  const [signerName, setSignerName] = reactExports.useState("");
  const [customerBankName, setCustomerBankName] = reactExports.useState("");
  const [customerBankAccountName, setCustomerBankAccountName] = reactExports.useState("");
  const [customerBankAccountNumber, setCustomerBankAccountNumber] = reactExports.useState("");
  const [signatureConsent, setSignatureConsent] = reactExports.useState(false);
  const signatureCanvasRef = reactExports.useRef(null);
  const drawingSignatureRef = reactExports.useRef(false);
  const [isMobileView, setIsMobileView] = reactExports.useState(() => typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const pollIntervalRef = reactExports.useRef(null);
  const gcashTimeoutRef = reactExports.useRef(null);
  const COUNTRY_OPTIONS = [
    { label: "Philippines", value: "PH" },
    { label: "South Korea", value: "KR" },
    { label: "United States", value: "US" },
    { label: "Japan", value: "JP" },
    { label: "Singapore", value: "SG" },
    { label: "Hong Kong", value: "HK" },
    { label: "Thailand", value: "TH" },
    { label: "Vietnam", value: "VN" }
  ];
  reactExports.useEffect(() => {
    const currency = ((txn == null ? void 0 : txn.currency) || "").toUpperCase();
    const defaultCountry = getCurrencyCapabilities(currency).country;
    setCardForm((prev) => ({ ...prev, country: prev.country || defaultCountry }));
    if (currency === "KRW") {
      setCardForm((prev) => ({ ...prev, country: "KR" }));
    }
    if (currency === "PHP") {
      setCardForm((prev) => ({ ...prev, country: prev.country === "KR" ? "PH" : prev.country || "PH" }));
    }
  }, [txn == null ? void 0 : txn.currency]);
  const startPollingStatus = (extId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      var _a2;
      try {
        const response = await client.get(`/api/v1/payments/checkout/${extId}/status`);
        const status = String(((_a2 = response.data) == null ? void 0 : _a2.status) || "").toLowerCase();
        if (status === "paid" || status === "completed" || status === "executed") {
          setTxn((prev) => {
            var _a3;
            return prev ? {
              ...prev,
              status: "paid",
              payment_method: ((_a3 = response.data) == null ? void 0 : _a3.payment_method) || prev.payment_method
            } : null;
          });
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          ue.success("Payment confirmed!");
        } else if (status === "expired" || status === "cancelled" || status === "failed") {
          setTxn((prev) => {
            var _a3;
            return prev ? {
              ...prev,
              status,
              payment_method: ((_a3 = response.data) == null ? void 0 : _a3.payment_method) || prev.payment_method
            } : null;
          });
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2e3);
  };
  const openCheckoutModal = (url) => {
    const checkoutUrl = new URL(url, window.location.origin);
    if (checkoutUrl.origin !== window.location.origin) {
      window.location.assign(checkoutUrl.toString());
      return;
    }
    setCheckoutModalUrl(url);
    setShowCheckoutModal(true);
  };
  const handleGcashDeepLink = async (deepLink) => {
    try {
      window.location.href = deepLink;
      if (gcashTimeoutRef.current) clearTimeout(gcashTimeoutRef.current);
      gcashTimeoutRef.current = setTimeout(() => {
        ue.info("GCash app not found. Please scan the QR code to pay.");
      }, 2500);
    } catch (err) {
      console.error("Failed to open GCash:", err);
      ue.error("Unable to open GCash app. Please scan the QR code to pay.");
    }
  };
  const openTossPaymentApp = () => {
    var _a2;
    const tossDeepLink = ((_a2 = txn == null ? void 0 : txn.toss_deep_link) == null ? void 0 : _a2.trim()) || "supertoss://toss/pay";
    let appOpened = false;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        appOpened = true;
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
    };
    setQrInstructionApp("toss");
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.location.assign(tossDeepLink);
    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (!appOpened) setShowQRPhModal(true);
    }, 1200);
  };
  reactExports.useEffect(() => {
    fetch("/api/v1/app-settings/checkout-design").then((response) => response.ok ? response.json() : null).then((data) => {
      if (data == null ? void 0 : data.design) setCheckoutDesign((current) => ({ ...current, ...data.design }));
    }).catch(() => void 0);
  }, []);
  reactExports.useEffect(() => {
    const qrphRedirect = searchParams.get("payment_method") === "qrph";
    const fetchTransaction = async () => {
      var _a2;
      try {
        setLoading(true);
        const response = await client.get(`/api/v1/payments/checkout/${checkoutId}`);
        if (!response.ok) {
          throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Failed to load payment");
        }
        if (typeof response.data.amount !== "number" || response.data.amount < 0) {
          throw new Error("Invalid response: amount must be a non-negative number");
        }
        setTxn(response.data);
        fetchInstitutions();
        if (searchParams.get("open_amount") === "1") {
          setEnteredAmount("");
        }
        if (qrphRedirect && response.data.qr_code_url) {
          setShowQRPhModal(true);
          startPollingStatus(response.data.external_id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load payment");
      } finally {
        setLoading(false);
      }
    };
    if (checkoutId) {
      fetchTransaction();
      fetchPaymentChannels().then(setPaymentChannels).catch((err) => {
        console.error("Failed to load payment channel branding:", err);
      });
    } else {
      setError("Invalid checkout URL");
      setLoading(false);
    }
  }, [checkoutId, searchParams]);
  reactExports.useEffect(() => {
    if ((txn == null ? void 0 : txn.status) === "pending" && txn.external_id) {
      startPollingStatus(txn.external_id);
    }
  }, [txn == null ? void 0 : txn.status, txn == null ? void 0 : txn.external_id]);
  reactExports.useEffect(() => {
    var _a2, _b2;
    if (!txn) return;
    const phpAmount = ((_a2 = txn.currency) == null ? void 0 : _a2.toUpperCase()) === "PHP" ? Number(txn.amount || 0) : ((_b2 = txn.processing_currency) == null ? void 0 : _b2.toUpperCase()) === "PHP" ? Number(txn.processing_amount || 0) : 0;
    if (phpAmount > 1e5 && txn.status !== "paid" && txn.status !== "completed" && txn.status !== "executed") {
      setShowSignaturePrompt(true);
    }
  }, [txn]);
  reactExports.useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !showSignaturePrompt) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.strokeStyle = "#0f172a";
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
  }, [showSignaturePrompt]);
  reactExports.useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const fetchInstitutions = async () => {
    var _a2;
    try {
      setLoadingLoadingInstitutions(true);
      setInstitutionLoadFailed(false);
      const response = await client.get(`/api/v1/payments/checkout/${checkoutId}/institutions`);
      if (((_a2 = response.data) == null ? void 0 : _a2.success) && Array.isArray(response.data.data)) {
        const returnedInstitutions = response.data.data.filter((item) => item && String(item.code || "").trim() && String(item.name || "").trim()).filter((item) => item.enabled !== false).map((item) => ({
          ...item,
          id: String(item.id || item.code),
          code: String(item.code).trim().toUpperCase(),
          name: String(item.name).trim(),
          enabled: item.enabled !== false,
          loginMethod: item.loginMethod || "redirect"
        }));
        const availableInstitutions = returnedInstitutions;
        setInstitutions(availableInstitutions);
      } else {
        setInstitutions([]);
        setInstitutionLoadFailed(true);
      }
    } catch (err) {
      console.error("Failed to fetch institutions:", err);
      setInstitutions([]);
      setInstitutionLoadFailed(true);
    } finally {
      setLoadingLoadingInstitutions(false);
    }
  };
  reactExports.useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (gcashTimeoutRef.current) clearTimeout(gcashTimeoutRef.current);
    };
  }, []);
  reactExports.useEffect(() => {
    const isKrwPending = String((txn == null ? void 0 : txn.currency) || "").toUpperCase() === "KRW" && ["pending", "created"].includes(String((txn == null ? void 0 : txn.status) || "").toLowerCase());
    if (!(txn == null ? void 0 : txn.external_id) || !isKrwPending) {
      setSwiftPayQuotes({});
      return;
    }
    let cancelled = false;
    Promise.all(["USD", "EUR"].map(async (currency) => {
      var _a2;
      const response = await client.get(
        `/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/swiftpay-currency/quote?currency=${currency}`
      );
      if (!response.ok || !((_a2 = response.data) == null ? void 0 : _a2.exchange_rate)) return null;
      return [currency, response.data];
    })).then((entries) => {
      if (!cancelled) {
        const filteredEntries = entries.filter(
          (entry) => Boolean(entry)
        );
        setSwiftPayQuotes(Object.fromEntries(filteredEntries));
      }
    }).catch(() => {
      if (!cancelled) setSwiftPayQuotes({});
    });
    return () => {
      cancelled = true;
    };
  }, [txn == null ? void 0 : txn.external_id, txn == null ? void 0 : txn.currency, txn == null ? void 0 : txn.status]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" });
  }
  if (error || !txn) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "checkout-page min-h-screen flex items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "checkout-empty-state w-full max-w-md text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "checkout-status-icon mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-8 w-8 text-red-400" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mb-2 text-2xl font-semibold text-slate-950", children: language === "ko" ? "결제 정보를 찾을 수 없습니다" : "Payment Not Found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-8 text-slate-500", children: error || (language === "ko" ? "요청하신 결제 링크가 유효하지 않거나 만료되었습니다." : "The requested payment link is invalid or has expired.") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/home", className: "checkout-primary-button inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold", children: language === "ko" ? `${APP_NAME}로 이동` : `Go to ${APP_NAME}` })
    ] }) });
  }
  const isPaid = (txn == null ? void 0 : txn.status) === "paid";
  const isExpired = (txn == null ? void 0 : txn.status) === "expired" || (txn == null ? void 0 : txn.status) === "cancelled";
  const isPending = ["pending", "created"].includes(String((txn == null ? void 0 : txn.status) || "").trim().toLowerCase());
  const currencyCode = ((_a = txn.currency) == null ? void 0 : _a.trim().toUpperCase()) || "PHP";
  const statusPaymentMethod = txn.payment_method || searchParams.get("payment_method");
  const statusPaymentMethodBrand = statusPaymentMethod ? getTransactionPaymentMethodBrand({
    transaction_type: txn.transaction_type,
    payment_method: statusPaymentMethod
  }) : null;
  const phpEquivalent = currencyCode === "PHP" ? Number(txn.amount || 0) : ((_b = txn.processing_currency) == null ? void 0 : _b.toUpperCase()) === "PHP" ? Number(txn.processing_amount || 0) : null;
  const requiresDigitalSignature = phpEquivalent !== null && phpEquivalent > 1e5;
  const currencyName = getCurrencyName(currencyCode, language === "zh" ? "zh" : language === "en" ? "en" : "ko");
  const signatureComplete = digitalSignature.length > 0;
  const getSignaturePoint = (event) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) * (canvas.width / bounds.width),
      y: (event.clientY - bounds.top) * (canvas.height / bounds.height)
    };
  };
  const startSignature = (event) => {
    const canvas = signatureCanvasRef.current;
    const point = getSignaturePoint(event);
    if (!canvas || !point) return;
    drawingSignatureRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    const context = canvas.getContext("2d");
    if (context) {
      context.beginPath();
      context.moveTo(point.x, point.y);
    }
  };
  const drawSignature = (event) => {
    var _a2;
    if (!drawingSignatureRef.current) return;
    const point = getSignaturePoint(event);
    const context = (_a2 = signatureCanvasRef.current) == null ? void 0 : _a2.getContext("2d");
    if (!point || !context) return;
    context.lineTo(point.x, point.y);
    context.stroke();
    setDigitalSignature("signed");
    setSignatureError("");
  };
  const finishSignature = () => {
    drawingSignatureRef.current = false;
  };
  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const context = canvas == null ? void 0 : canvas.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    setDigitalSignature("");
    setSignatureError("");
  };
  const confirmSignature = () => {
    var _a2;
    if (!signerName.trim()) {
      setSignatureError("Enter your full legal name before continuing.");
      return;
    }
    if (!customerBankName.trim() || !customerBankAccountName.trim() || !customerBankAccountNumber.trim()) {
      setSignatureError("Enter your bank name, account holder, and account number before continuing.");
      return;
    }
    if (!signatureConsent) {
      setSignatureError("Confirm the declaration before continuing.");
      return;
    }
    if (!signatureComplete) {
      setSignatureError("Please draw your signature before continuing.");
      return;
    }
    const signatureImage = (_a2 = signatureCanvasRef.current) == null ? void 0 : _a2.toDataURL("image/png");
    sessionStorage.setItem(`swiftpay-signature-${txn.external_id}`, JSON.stringify({
      signerName: signerName.trim(),
      customerBankName: customerBankName.trim(),
      customerBankAccountName: customerBankAccountName.trim(),
      customerBankAccountNumber: customerBankAccountNumber.trim(),
      signedAt: (/* @__PURE__ */ new Date()).toISOString(),
      signatureImage,
      phpEquivalent,
      consent: "received_goods_or_services_and_authorized_payment"
    }));
    setSignatureError("");
    setShowSignaturePrompt(false);
  };
  const displayReference = txn.external_id.replace(/^OPEN-AMOUNT-/i, "");
  const hasCheckoutLink = !!(txn == null ? void 0 : txn.payment_url);
  const processingCurrencyCode = ((_c = txn.processing_currency) == null ? void 0 : _c.trim().toUpperCase()) || currencyCode;
  const isPhp = currencyCode === "PHP" && processingCurrencyCode === "PHP";
  const isCny = currencyCode === "CNY";
  const isKrw = currencyCode === "KRW";
  const isUsdt = currencyCode === "USDT";
  const paymentMethodParam = String(searchParams.get("payment_method") || "").trim().toLowerCase();
  const currencyCapabilities = getCurrencyCapabilities(currencyCode);
  currencyCapabilities.magpieCard;
  const isKoreanCheckout = isKrw || language === "ko" || ["ko", "kr", "korean"].includes((searchParams.get("lang") || "").trim().toLowerCase());
  const checkoutText = (english, korean) => isKoreanCheckout ? korean : english;
  const isManualDeposit = currencyCapabilities.manualDeposit;
  const hasQR = !!(txn == null ? void 0 : txn.qr_code_url) && isPaymentChannelEnabled(paymentChannels, txn == null ? void 0 : txn.currency, "checkout", "qr_code") || !!gcashDeepLink;
  const hasQrPayload = !!((txn == null ? void 0 : txn.qr_code_url) && String(txn.qr_code_url).trim());
  const qrPanelMode = resolveCheckoutQrPanelMode({
    hasQR,
    hasQrPayload,
    paymentMethod: paymentMethodParam,
    gcashDeepLink
  });
  const payableAmount = openAmount ? Number(enteredAmount) : Number(txn.amount);
  const amountInputInvalid = enteredAmount.length > 0 && (!Number.isFinite(Number(enteredAmount)) || Number(enteredAmount) <= 0);
  const amountSymbol = getCurrencySymbol(currencyCode);
  const isAlipay = (txn == null ? void 0 : txn.transaction_type) === "alipay_qr" && isPaymentChannelEnabled(paymentChannels, txn == null ? void 0 : txn.currency, "checkout", "alipay");
  const isWeChat = (txn == null ? void 0 : txn.transaction_type) === "wechat_qr" && isPaymentChannelEnabled(paymentChannels, txn == null ? void 0 : txn.currency, "checkout", "wechat");
  const isMagpieCheckout = (txn == null ? void 0 : txn.transaction_type) === "magpie_checkout";
  const merchantDisplayName = ((_d = txn.merchant_name) == null ? void 0 : _d.trim()) || "Merchant";
  const krwBankName = isSecurityBankName(txn.bank_name) ? DEFAULT_KRW_BANK_NAME : normalizeKrwBankName(txn.bank_name || DEFAULT_KRW_BANK_NAME);
  const krwAccountNumber = isSecurityBankName(txn.bank_name) ? "1908-1618-8260" : txn.bank_account_number || "1908-1618-8260";
  const krwAccountName = isSecurityBankName(txn.bank_name) ? "SwiftPay Ventures Inc." : txn.bank_account_name || "SwiftPay Ventures Inc.";
  const manualDepositBankName = isKrw ? krwBankName : txn.bank_name || DEFAULT_KRW_BANK_NAME;
  const manualDepositAccountNumber = isKrw ? krwAccountNumber : txn.bank_account_number || "1908-1618-8260";
  const manualDepositAccountName = isKrw ? krwAccountName : txn.bank_account_name || "SwiftPay Ventures Inc.";
  const krwTransferQrValue = [
    "SWIFTPAY-KRW-TRANSFER",
    `BANK:${krwBankName}`,
    `ACCOUNT:${krwAccountNumber}`,
    `NAME:${krwAccountName}`,
    `AMOUNT:${Number(txn.amount).toFixed(2)} KRW`
  ].join("\n");
  isPaymentChannelEnabled(paymentChannels, (txn == null ? void 0 : txn.currency) || "PHP", "checkout", "qr_code");
  const swiftpayVirtualAccountEnabled = isPaymentChannelEnabled(paymentChannels, (txn == null ? void 0 : txn.currency) || "PHP", "checkout", "virtual_account");
  const institutionCode = (institution) => String(institution.code || "").trim().toUpperCase();
  const isSupportedKrwInstitution = (institution) => {
    const code = institutionCode(institution);
    const name = institution.name.trim();
    if (code === "ALIPAY" || name.toUpperCase().includes("ALIPAY")) return true;
    return isSupportedKrwBank(code) || isSupportedKrwBank(name) || KRW_BANKS.some((bank) => bank.code === code || bank.name.toLowerCase() === name.toLowerCase());
  };
  const visibleInstitutions = institutions.filter((institution) => institution.enabled && (!isKrw || isSupportedKrwInstitution(institution)));
  const qrphInstitutions = visibleInstitutions.filter((i) => institutionCode(i) === "QRPH");
  const digitalWallets = visibleInstitutions.filter((i) => ["MAYA", "GCASH", "ALIPAY"].includes(institutionCode(i)));
  const banks = visibleInstitutions.filter((i) => !["MAYA", "GCASH", "ALIPAY", "QRPH"].includes(institutionCode(i)));
  const filteredBanks = banks.filter((bank) => {
    const query = phpBankSearch.trim().toLowerCase();
    return !query || `${bank.name} ${institutionCode(bank)}`.toLowerCase().includes(query);
  });
  const handleStartCheckout = async (institutionCode2) => {
    var _a2, _b2, _c2, _d2, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    const selectedInstitutionCode = (institutionCode2 == null ? void 0 : institutionCode2.trim().toUpperCase()) || "";
    let checkoutUrl = txn.payment_url || txn.qr_code_url || "";
    let activeExternalId = openAmountRequestId || txn.external_id;
    if (openAmount) {
      if (!Number.isFinite(payableAmount) || payableAmount <= 0) {
        ue.error("Enter a valid amount to pay.");
        return;
      }
      setTxn((prev) => prev ? { ...prev, amount: payableAmount } : null);
      if (!openAmountRequestId) {
        try {
          const response = await client.post(`/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/open-amount-request`, { amount: payableAmount });
          if (!response.ok) throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Unable to submit payment for approval");
          setOpenAmountRequestId(response.data.external_id);
          activeExternalId = response.data.external_id;
          setTxn((prev) => prev ? {
            ...prev,
            id: response.data.id,
            external_id: response.data.external_id,
            amount: Number(response.data.amount),
            payment_url: `/checkout/${response.data.external_id}`
          } : null);
          checkoutUrl = `/checkout/${response.data.external_id}`;
        } catch (err) {
          ue.error(err instanceof Error ? err.message : "Unable to submit payment for approval");
          return;
        }
      }
    }
    const checkoutExternalId = activeExternalId;
    const url = checkoutUrl;
    if (!url) {
      ue.error("No checkout URL available");
      return;
    }
    if (isKrw && !isPhp && institutionCode2) {
      const normalizedInstitution = institutionCode2.trim().toUpperCase();
      if (normalizedInstitution === "ALIPAY") {
        return;
      }
      if (normalizedInstitution === "KAKAOPAY") {
        ue.error("KakaoPay collection is not currently available.");
        return;
      }
      try {
        const response = await client.post(
          `/api/v1/payments/checkout/${encodeURIComponent(checkoutExternalId)}/magpie-card`
        );
        if (!response.ok) {
          throw new Error(((_b2 = response.data) == null ? void 0 : _b2.detail) || ((_c2 = response.data) == null ? void 0 : _c2.error) || "Unable to initialize the KRW card payment.");
        }
        const freshCheckoutUrl = ((_d2 = response.data) == null ? void 0 : _d2.checkout_url) || ((_e = response.data) == null ? void 0 : _e.payment_url);
        if (!freshCheckoutUrl) {
          throw new Error("The payment provider did not return a fresh KRW checkout URL.");
        }
        const redirectUrl = new URL(freshCheckoutUrl, window.location.origin);
        redirectUrl.searchParams.set("payment_method", "card");
        openCheckoutModal(redirectUrl.toString());
        startPollingStatus(checkoutExternalId);
      } catch (err) {
        ue.error(err instanceof Error ? err.message : "Unable to initialize the KRW card payment.");
      }
      return;
    }
    if (isPhp && institutionCode2) {
      try {
        const checkoutIdentifier = checkoutExternalId || String(txn.id);
        const response = await client.post(`/api/v1/payments/checkout/${encodeURIComponent(checkoutIdentifier)}/institution`, {
          institution_code: selectedInstitutionCode,
          ...openAmount ? { amount: payableAmount } : {}
        });
        if (!response.ok) {
          throw new Error(((_f = response.data) == null ? void 0 : _f.detail) || ((_g = response.data) == null ? void 0 : _g.error) || "Unable to open the selected bank. Please try again.");
        }
        const paymentAttemptId = String(((_h = response.data) == null ? void 0 : _h.external_id) || checkoutIdentifier);
        if (["GCASH", "QRPH", "ALIPAY"].includes(selectedInstitutionCode) && (((_i = response.data) == null ? void 0 : _i.qr_content) || ((_j = response.data) == null ? void 0 : _j.qr_code) || ((_k = response.data) == null ? void 0 : _k.deep_link))) {
          const qrPayload = response.data.qr_content || response.data.qr_code || "";
          if (!qrPayload) throw new Error("SwiftPay did not return a QR payload");
          setGcashDeepLink(null);
          setTxn((prev) => {
            var _a3;
            return prev ? {
              ...prev,
              id: Number(((_a3 = response.data) == null ? void 0 : _a3.transaction_id) || prev.id),
              external_id: paymentAttemptId,
              payment_url: qrPayload,
              qr_code_url: qrPayload,
              transaction_type: selectedInstitutionCode === "ALIPAY" ? "alipay_qr" : "swiftpay_qr"
            } : null;
          });
          if (selectedInstitutionCode === "GCASH") {
            const gcashPageUrl = new URL(
              `/checkout/${encodeURIComponent(paymentAttemptId)}/gcash`,
              window.location.origin
            );
            gcashPageUrl.searchParams.set("payment_method", "qrph");
            gcashPageUrl.searchParams.set("qr", qrPayload);
            navigate(`${gcashPageUrl.pathname}${gcashPageUrl.search}`);
            return;
          }
          if (selectedInstitutionCode === "ALIPAY") {
            const alipayPageUrl = new URL(
              `/checkout/${encodeURIComponent(paymentAttemptId)}/alipay`,
              window.location.origin
            );
            alipayPageUrl.searchParams.set("payment_method", "alipay");
            alipayPageUrl.searchParams.set("qr", qrPayload);
            const alipayDeepLink = (_l = response.data) == null ? void 0 : _l.alipay_deep_link;
            if (alipayDeepLink) alipayPageUrl.searchParams.set("deep_link", alipayDeepLink);
            navigate(`${alipayPageUrl.pathname}${alipayPageUrl.search}`);
            return;
          }
          setShowQRPhModal(true);
          startPollingStatus(paymentAttemptId);
          return;
        }
        const redirectUrl = (_m = response.data) == null ? void 0 : _m.redirect_url;
        if (!redirectUrl) throw new Error("No bank checkout URL returned");
        window.location.assign(redirectUrl);
      } catch (err) {
        console.error("Failed to open bank checkout:", err);
        if (selectedInstitutionCode === "QRPH" && txn.qr_code_url) {
          setShowQRPhModal(true);
          return;
        }
        const detail = err instanceof Error ? err.message : "Unable to open the selected bank. Please try again.";
        ue.error(detail);
      }
      return;
    }
    openCheckoutModal(url);
    startPollingStatus(checkoutExternalId);
  };
  const submitOpenAmount = async () => {
    var _a2;
    const amount = Number(enteredAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      ue.error(isKoreanCheckout ? "결제 금액을 입력하세요." : "Enter a valid amount to pay.");
      return;
    }
    try {
      const response = await client.post(
        `/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/open-amount-request`,
        { amount }
      );
      if (!response.ok) {
        throw new Error(((_a2 = response.data) == null ? void 0 : _a2.detail) || "Unable to submit payment amount");
      }
      setOpenAmountRequestId(response.data.external_id);
      navigate(`/checkout/${encodeURIComponent(response.data.external_id)}`);
    } catch (err) {
      ue.error(err instanceof Error ? err.message : "Unable to submit payment amount");
    }
  };
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const openSwiftPayCurrencyCheckout = async (currency) => {
    var _a2, _b2, _c2;
    if (!txn || swiftPayCurrencyLoading) return;
    setSwiftPayCurrencyLoading(currency);
    try {
      const response = await client.post(
        `/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/swiftpay-currency`,
        { currency }
      );
      if (!response.ok || !((_a2 = response.data) == null ? void 0 : _a2.redirect_url)) {
        throw new Error(((_b2 = response.data) == null ? void 0 : _b2.detail) || ((_c2 = response.data) == null ? void 0 : _c2.error) || `Unable to open the ${currency} checkout.`);
      }
      window.location.assign(response.data.redirect_url);
    } catch (err) {
      ue.error(err instanceof Error ? err.message : `Unable to open the ${currency} checkout.`);
    } finally {
      setSwiftPayCurrencyLoading(null);
    }
  };
  const openMagpieWalletCheckout = (method) => {
    if (!txn || walletCheckoutLoading) return;
    setWalletMethod(method);
    setWalletFormError(null);
  };
  const submitMagpieWallet = async () => {
    var _a2;
    if (!txn || !walletMethod || walletCheckoutLoading) return;
    setWalletCheckoutLoading(true);
    setWalletFormError(null);
    try {
      const checkoutResponse = await client.post(
        `/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/magpie-method`,
        { payment_method: walletMethod }
      );
      if (!checkoutResponse.ok || !((_a2 = checkoutResponse.data) == null ? void 0 : _a2.checkout_url)) {
        throw new Error(getCheckoutErrorMessage(checkoutResponse.data, "Unable to initialize wallet payment."));
      }
      setWalletMethod(null);
      window.location.assign(checkoutResponse.data.checkout_url);
    } catch (err) {
      const message = err instanceof Error ? err.message : getCheckoutErrorMessage(err, "Unable to process wallet payment");
      setWalletFormError(message);
      ue.error(message);
    } finally {
      setWalletCheckoutLoading(false);
    }
  };
  const submitMagpieCard = async (event) => {
    var _a2, _b2, _c2, _d2;
    event.preventDefault();
    if (!txn || cardCheckoutLoading) return;
    setCardCheckoutLoading(true);
    setCardFormError(null);
    try {
      const configResponse = await client.get(`/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/magpie-card/config`);
      if (!configResponse.ok) throw new Error(((_a2 = configResponse.data) == null ? void 0 : _a2.detail) || "Card payments are unavailable");
      const card = {
        name: cardForm.name.trim(),
        number: cardForm.number.replace(/\s+/g, ""),
        exp_month: cardForm.expMonth,
        exp_year: cardForm.expYear,
        cvc: cardForm.cvc
      };
      if (!card.name || !/^\d{12,19}$/.test(card.number) || !/^\d{2}$/.test(card.exp_month) || !/^\d{4}$/.test(card.exp_year) || !/^\d{3,4}$/.test(card.cvc)) {
        throw new Error("Enter valid card details.");
      }
      const proxyResponse = await client.post(
        `/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/magpie-card/source`,
        { card }
      );
      if (!proxyResponse.ok) {
        throw new Error(((_b2 = proxyResponse.data) == null ? void 0 : _b2.detail) || "Unable to connect to the card payment provider.");
      }
      const sourceData = proxyResponse.data;
      const sourceId = sourceData.id || sourceData.source_id;
      if (!sourceId) throw new Error((sourceData == null ? void 0 : sourceData.detail) || (sourceData == null ? void 0 : sourceData.message) || "Card verification failed.");
      const chargeResponse = await client.post(`/api/v1/payments/checkout/${encodeURIComponent(txn.external_id)}/magpie-card/charge`, { source_id: sourceId });
      if (!chargeResponse.ok) throw new Error(((_c2 = chargeResponse.data) == null ? void 0 : _c2.detail) || "Unable to process card payment");
      setShowCardForm(false);
      const redirectUrl = (_d2 = chargeResponse.data) == null ? void 0 : _d2.redirect_url;
      if (redirectUrl) window.location.assign(redirectUrl);
      else startPollingStatus(txn.external_id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to process card payment";
      setCardFormError(message);
      ue.error(message);
    } finally {
      setCardCheckoutLoading(false);
    }
  };
  const renderInstitutionButton = (institution) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: () => handleStartCheckout(institution.code),
      className: "group flex min-h-[132px] flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center transition-all hover:-translate-y-0.5 hover:border-[#FF6B00] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B00] focus-visible:ring-offset-2",
      "aria-label": `Pay with ${institution.name}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PaymentBrandLogo,
          {
            brand: institution.code || institution.name,
            logoUrl: institution.logoUrl,
            size: "md",
            className: "border border-slate-100 shadow-sm"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-full truncate text-[12px] font-semibold text-slate-900", children: institution.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "h-3.5 w-3.5 text-slate-300 transition-colors group-hover:text-[#FF6B00]", "aria-hidden": "true" })
      ]
    },
    institution.id
  );
  if (openAmount) {
    const amountBrand = isKrw ? krwBankName : "Netbank";
    const amountTitle = isKrw ? swiftpayVirtualAccountEnabled ? "SwiftPay Virtual Account" : "수동 은행 송금" : isKoreanCheckout ? "결제" : "Payment";
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-[#F9FAFB] text-slate-900", children: [
      showSignaturePrompt && requiresDigitalSignature && /* @__PURE__ */ jsxRuntimeExports.jsx(
        SignaturePrompt,
        {
          canvasRef: signatureCanvasRef,
          error: signatureError,
          signerName,
          customerBankName,
          customerBankAccountName,
          customerBankAccountNumber,
          signatureConsent,
          onSignerNameChange: setSignerName,
          onCustomerBankNameChange: setCustomerBankName,
          onCustomerBankAccountNameChange: setCustomerBankAccountName,
          onCustomerBankAccountNumberChange: setCustomerBankAccountNumber,
          onConsentChange: setSignatureConsent,
          onStart: startSignature,
          onDraw: drawSignature,
          onEnd: finishSignature,
          onClear: clearSignature,
          onConfirm: confirmSignature
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-slate-200 bg-white py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-xl flex-col items-center px-4 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm", children: txn.merchant_logo_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: txn.merchant_logo_url, alt: merchantDisplayName, className: "h-full w-full object-contain p-2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { size: 24, className: "text-slate-200" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-black", children: checkoutDesign.display_name || merchantDisplayName }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-600", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 14, className: "text-emerald-500" }),
          isKoreanCheckout ? "안전한 결제 페이지" : "Secure payment"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "mx-auto flex max-w-xl justify-center px-4 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "w-full overflow-hidden rounded-[28px] border border-[#d8e4f5] bg-white shadow-[0_18px_55px_rgba(15,63,120,0.10)]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-[linear-gradient(120deg,#071b3a_0%,#0b4b9a_58%,#1475d1_100%)] px-6 py-7 text-white sm:px-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] text-blue-100", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgba(103,232,249,0.15)]" }),
              isKrw ? t("krw_bank_transfer") : isKoreanCheckout ? "PHP 결제" : "PHP NETBANK"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold tracking-tight text-white", children: amountTitle })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PaymentBrandLogo,
            {
              brand: amountBrand,
              size: "sm",
              className: "shrink-0 border-0 bg-white p-1 shadow-sm"
            }
          )
        ] }) }),
        openAmountSubmitted ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 text-center sm:p-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mx-auto h-12 w-12 text-emerald-500" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 text-xl font-semibold text-slate-900", children: isKoreanCheckout ? "검토 요청이 전송되었습니다." : "Payment request sent for review" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-relaxed text-slate-500", children: isKoreanCheckout ? "관리자가 금액을 검토하고 승인하면 결제가 진행됩니다." : "A super admin will review and approve this amount before payment can proceed." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-xl bg-slate-50 px-4 py-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-slate-600", children: isKoreanCheckout ? "요청 금액" : "Requested amount" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-2xl font-semibold text-slate-900", children: fmtCurrency(payableAmount, currencyCode) })
          ] }),
          openAmountRequestId && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-4 text-xs text-slate-600", children: [
            isKoreanCheckout ? "요청 번호" : "Request reference",
            ": ",
            openAmountRequestId
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 sm:p-8", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "open-payment-amount", className: "text-sm font-medium text-slate-700", children: isKoreanCheckout ? "결제 금액" : "Payment amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `checkout-amount-input mt-3 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3.5 shadow-sm ring-1 ring-slate-100 transition focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 ${amountInputInvalid ? "checkout-amount-input-error border-red-300 ring-red-100" : "border-slate-200"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "checkout-amount-symbol flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-lg font-bold text-[#0b4b9a]", "aria-hidden": "true", children: amountSymbol }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: "open-payment-amount",
                type: "number",
                min: "0.01",
                step: "0.01",
                inputMode: "decimal",
                value: enteredAmount,
                onChange: (event) => setEnteredAmount(event.target.value),
                onKeyDown: (event) => {
                  if (event.key === "Enter") submitOpenAmount();
                },
                placeholder: "0.00",
                autoFocus: true,
                className: "checkout-number-input min-w-0 flex-1 bg-transparent text-3xl font-bold tracking-tight text-slate-900 outline-none placeholder:text-slate-300",
                "aria-label": isKoreanCheckout ? "결제 금액" : "Payment amount",
                "aria-invalid": amountInputInvalid
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-slate-600 shadow-sm", children: currencyCode })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex min-h-5 items-center justify-between gap-3 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: amountInputInvalid ? "font-medium text-red-600" : "text-slate-600", children: amountInputInvalid ? isKoreanCheckout ? "0보다 큰 금액을 입력하세요." : "Enter an amount greater than zero." : isKoreanCheckout ? "결제할 금액을 입력하세요." : "Enter the amount you want to pay." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-400", children: isKoreanCheckout ? "최소 0.01" : "Min 0.01" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: submitOpenAmount,
              className: "mt-4 w-full rounded-xl px-4 py-3.5 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              style: { backgroundColor: checkoutDesign.primary_color },
              children: [
                isKrw ? "지금 결제" : "Pay now",
                /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-1 inline-block h-4 w-4 align-text-bottom" })
              ]
            }
          )
        ] })
      ] }) })
    ] });
  }
  const qrCodeUrl = normalizeCheckoutQrValue(txn.qr_code_url);
  const swiftPayQrphUrl = txn.external_id ? `${typeof window !== "undefined" ? window.location.origin : "https://swiftpay.ph"}/checkout/${encodeURIComponent(txn.external_id)}?payment_method=qrph` : "";
  const tossQrValue = isKrw ? swiftPayQrphUrl : qrCodeUrl || "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `checkout-page checkout-${currencyCode.toLowerCase()} min-h-screen pb-8 font-sans text-slate-900 sm:pb-12`,
      style: {
        backgroundColor: checkoutDesign.page_background,
        "--checkout-primary": checkoutDesign.primary_color,
        "--checkout-accent": checkoutDesign.accent_color,
        "--checkout-radius": `${checkoutDesign.card_radius}px`,
        color: checkoutDesign.body_text_color
      },
      children: [
        showSignaturePrompt && requiresDigitalSignature && /* @__PURE__ */ jsxRuntimeExports.jsx(
          SignaturePrompt,
          {
            canvasRef: signatureCanvasRef,
            error: signatureError,
            signerName,
            customerBankName,
            customerBankAccountName,
            customerBankAccountNumber,
            signatureConsent,
            onSignerNameChange: setSignerName,
            onCustomerBankNameChange: setCustomerBankName,
            onCustomerBankAccountNameChange: setCustomerBankAccountName,
            onCustomerBankAccountNumberChange: setCustomerBankAccountNumber,
            onConsentChange: setSignatureConsent,
            onStart: startSignature,
            onDraw: drawSignature,
            onEnd: finishSignature,
            onClear: clearSignature,
            onConfirm: confirmSignature
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "header",
          {
            className: "checkout-header mb-5 border-b px-4 py-5 sm:mb-8 sm:px-6 sm:py-7",
            style: { borderColor: checkoutDesign.accent_color },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-6xl items-center justify-between gap-4 px-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "checkout-merchant-logo flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-14 sm:w-14", children: txn.merchant_logo_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: txn.merchant_logo_url, alt: txn.merchant_name, className: "h-full w-full object-contain p-2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { size: isMobileView ? 20 : 24, className: "text-slate-400" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "truncate text-base font-bold tracking-tight text-black sm:text-lg", children: checkoutDesign.display_name || merchantDisplayName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 13, className: "checkout-success" }),
                    checkoutText("Secure checkout", "안전한 결제")
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "checkout-currency-pill shrink-0 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide", style: { backgroundColor: checkoutDesign.primary_color, color: "#fff" }, children: currencyCode })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "mx-auto max-w-6xl px-3 sm:px-6 lg:px-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-5 lg:items-start lg:gap-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 md:col-span-2 md:space-y-7 lg:col-span-3", children: [
            !isPaid && !isExpired && !isManualDeposit && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "checkout-amount-card rounded-3xl p-6 text-white sm:p-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 flex items-center justify-between gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.2em] text-white/65", children: checkoutText("Amount to pay", "결제 금액") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/75", children: currencyName })
              ] }),
              openAmount ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `checkout-amount-input flex max-w-sm items-center gap-3 rounded-2xl border px-4 py-3 ${amountInputInvalid ? "checkout-amount-input-error border-red-300" : "border-white/20 bg-white/10"}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-base font-bold text-white/80", "aria-hidden": "true", children: amountSymbol }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "number",
                    min: "0.01",
                    step: "0.01",
                    inputMode: "decimal",
                    value: enteredAmount,
                    onChange: (event) => setEnteredAmount(event.target.value),
                    placeholder: "Enter amount",
                    className: "checkout-number-input min-w-0 flex-1 bg-transparent text-3xl font-bold tracking-tight text-white outline-none placeholder:text-white/40",
                    "aria-invalid": amountInputInvalid
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-wider text-white/60", children: currencyCode })
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-baseline gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-semibold tracking-tight sm:text-4xl", children: fmtCurrency(txn.amount, currencyCode) }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs font-medium uppercase tracking-[0.16em] text-white/60", children: [
                currencyName,
                " (",
                currencyCode,
                ")"
              ] })
            ] }),
            isPending && isUsdt && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-[0_18px_55px_rgba(16,185,129,0.10)]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-br from-emerald-950 via-emerald-800 to-teal-700 px-6 py-7 text-white sm:px-8", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-200", children: "USDT TRC20 transfer" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-3 text-2xl font-semibold tracking-tight", children: "Send USDT to complete payment" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-xl text-sm leading-relaxed text-emerald-50", children: "Send the exact amount below over the TRON network (TRC20). The payment will be confirmed automatically after the transfer is detected." }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-col items-center gap-5 rounded-2xl bg-white p-5 text-slate-900 sm:flex-row sm:items-start", children: [
                txn.usdt_deposit_address ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                  QRCodeSVG,
                  {
                    value: `tron:${txn.usdt_deposit_address}`,
                    size: 148,
                    includeMargin: true,
                    className: "rounded-lg",
                    "aria-label": "USDT TRC20 deposit address QR code"
                  }
                ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-[148px] w-[148px] items-center justify-center rounded-lg bg-amber-50 p-4 text-center text-xs font-semibold text-amber-800", children: "Deposit address unavailable" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-[0.16em] text-slate-500", children: "Amount to send" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-3xl font-bold tracking-tight text-slate-950", children: fmtCurrency(payableAmount, "USDT") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500", children: "TRC20 deposit address" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "min-w-0 flex-1 break-all rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-700", children: txn.usdt_deposit_address || "Not configured" }),
                    txn.usdt_deposit_address && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => copyToClipboard(txn.usdt_deposit_address || ""),
                        className: "shrink-0 rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50",
                        "aria-label": "Copy USDT deposit address",
                        children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { size: 16, className: "text-emerald-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { size: 16 })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs leading-5 text-amber-700", children: "Only send USDT using TRC20. Sending another asset or network may permanently lose the funds." })
                ] })
              ] })
            ] }) }),
            isPending && isManualDeposit && !isUsdt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-[28px] border border-[#d8e4f5] bg-white shadow-[0_18px_55px_rgba(15,63,120,0.10)]", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[linear-gradient(120deg,#071b3a_0%,#0b4b9a_58%,#1475d1_100%)] px-6 py-7 text-white sm:px-8", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] text-blue-100", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgba(103,232,249,0.15)]" }),
                      swiftpayVirtualAccountEnabled ? "SWIFTPAY VIRTUAL ACCOUNT" : t("krw_bank_transfer")
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold tracking-tight text-white", children: swiftpayVirtualAccountEnabled ? "SwiftPay Virtual Account" : "토스뱅크 계좌이체" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-md text-sm leading-relaxed text-white", children: swiftpayVirtualAccountEnabled ? "Use the SwiftPay virtual account details below to send the exact KRW amount." : "아래 QR을 스캔하거나 계좌 정보를 사용해 정확한 금액을 보내 주세요." })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-blue-50 backdrop-blur-sm", children: "결제 대기 중" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-7 flex flex-wrap items-end gap-x-8 gap-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-white", children: "보내실 금액" }),
                    openAmount ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "checkout-amount-input mt-1 flex w-full max-w-xs items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold text-white/70", "aria-hidden": "true", children: amountSymbol }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "number",
                          min: "0.01",
                          step: "0.01",
                          inputMode: "decimal",
                          value: enteredAmount,
                          onChange: (event) => setEnteredAmount(event.target.value),
                          placeholder: isKrw ? "결제 금액 입력" : "Enter amount",
                          className: "checkout-number-input min-w-0 flex-1 bg-transparent text-2xl font-bold tracking-tight text-white outline-none placeholder:text-blue-200",
                          "aria-invalid": amountInputInvalid
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-white/60", children: currencyCode })
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl", children: fmtCurrency(txn.amount, currencyCode) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs font-medium uppercase tracking-[0.16em] text-white", children: [
                      currencyName,
                      " (",
                      currencyCode,
                      ")"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-9 w-px bg-white/20" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200", children: "주문번호" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 font-mono text-sm font-semibold text-white", children: displayReference })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 bg-slate-50 p-5 sm:p-8", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 items-center gap-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      PaymentBrandLogo,
                      {
                        brand: manualDepositBankName,
                        size: "sm",
                        className: "border border-[#dce7f5] shadow-sm"
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600", children: checkoutText("Transfer details", "송금 정보") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-slate-700", children: checkoutText("Confirm the account details before sending your deposit.", "입금 전에 아래 계좌 정보를 확인하세요.") })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: [
                    [checkoutText("Bank", "은행"), manualDepositBankName],
                    [checkoutText("Account name", "예금주"), manualDepositAccountName],
                    [checkoutText("Account number", "Account Number"), manualDepositAccountNumber]
                  ].map(([label, value]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-[#dce7f5] bg-white px-4 py-3.5", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600", children: label }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `mt-1.5 break-all text-sm font-semibold text-slate-900 ${label === "계좌번호" || label === "Account Number" ? "font-mono" : ""}`, children: value })
                  ] }, label)) }),
                  isKrw && txn.qr_code_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white p-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700", children: checkoutText("Scan QRPH to pay", "QRPH로 결제") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-slate-500", children: checkoutText("Use your banking app to scan this QR code.", "은행 앱으로 이 QR 코드를 스캔하세요.") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mt-4 flex max-w-xs items-center justify-center rounded-xl border border-slate-100 bg-white p-3", children: /^(https?:)?\/\//i.test(txn.qr_code_url) ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: txn.qr_code_url, alt: "QRPH payment code", className: "w-full rounded-lg object-contain" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeSVG, { value: txn.qr_code_url, size: 280, level: "M", includeMargin: true, bgColor: "#ffffff", fgColor: "#071b3a", className: "h-auto max-w-full" }) })
                  ] }),
                  isKrw && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: openTossPaymentApp,
                      className: "group flex min-h-20 w-full items-center gap-3 rounded-2xl border border-[#d7e5ff] bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[#0064FF] hover:shadow-md",
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          PaymentBrandLogo,
                          {
                            brand: "Toss Pay",
                            logoUrl: "/logos/tosspay.png",
                            size: "lg",
                            className: "h-14 w-20 border-0 bg-[#f7f8ff] p-1.5 shadow-none"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "min-w-0 flex-1", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-bold text-slate-900", children: "Toss Pay" }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5 block text-[11px] text-slate-500", children: "토스페이에서 열기" })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-[#0064FF]", "aria-hidden": "true" })
                      ]
                    }
                  ),
                  isKrw && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-blue-100 bg-blue-50/60 p-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "h-4 w-4 text-[#1475d1]", "aria-hidden": "true" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700", children: checkoutText("Pay through SwiftPay", "SwiftPay로 결제") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs leading-relaxed text-slate-600", children: checkoutText(
                      "Choose USD or EUR. Your KRW total is quoted using a live exchange rate, then paid through SwiftPay’s secure checkout.",
                      "USD 또는 EUR를 선택하세요. 실시간 환율로 원화 금액을 환산한 뒤 SwiftPay의 안전한 결제 페이지에서 결제합니다."
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-2 sm:grid-cols-2", children: ["USD", "EUR"].map((currency) => {
                      const quote = swiftPayQuotes[currency];
                      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-blue-100 bg-white px-3 py-2.5", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                            currency,
                            " live rate"
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: quote ? "Live" : "Loading" })
                        ] }),
                        quote ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm font-bold text-slate-900", children: [
                            "1 ",
                            currency,
                            " = ",
                            quote.inverse_rate.toLocaleString(void 0, { maximumFractionDigits: 2 }),
                            " KRW"
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 text-[11px] text-slate-500", children: [
                            fmtCurrency(quote.charged_amount, currency),
                            " for ",
                            fmtCurrency(Number(txn.amount || 0), "KRW")
                          ] })
                        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm font-semibold text-slate-400", children: "Fetching live rate..." })
                      ] }, currency);
                    }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-2 sm:grid-cols-2", children: ["USD", "EUR"].map((currency) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => openSwiftPayCurrencyCheckout(currency),
                        disabled: swiftPayCurrencyLoading !== null,
                        className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60",
                        children: [
                          swiftPayCurrencyLoading === currency && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
                          currency,
                          " checkout"
                        ]
                      },
                      currency
                    )) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-[10px] leading-relaxed text-slate-500", children: checkoutText(
                      "Your KRW order amount remains the quoted amount shown above.",
                      "원화 주문 금액은 위에 표시된 금액으로 유지됩니다."
                    ) })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "mt-0.5 h-4 w-4 shrink-0 text-amber-600" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: checkoutText(
                      "Send the exact amount and include the order reference in the transfer note. A SwiftPay administrator will verify and approve the payment before its status is updated.",
                      "정확한 금액을 보내고 주문번호를 입금 메모에 입력하세요. SwiftPay 관리자가 입금을 확인하고 승인한 후 결제 상태가 업데이트됩니다."
                    ) })
                  ] })
                ] }),
                isKrw && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-[#dce7f5] pt-5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600", children: checkoutText("Supported Korean banks", "지원되는 한국 은행") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5", children: KRW_BANKS.map((bank) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-0 flex-col items-center gap-1.5 rounded-lg border border-[#dce7f5] bg-white px-2 py-2.5 text-center", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-16 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      PaymentBrandLogo,
                      {
                        brand: bank.name,
                        logoUrl: bank.logo || void 0,
                        size: "sm",
                        className: "border-0 bg-transparent p-0 shadow-none"
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-full truncate text-[10px] font-semibold text-slate-800", children: bank.name })
                  ] }, bank.code)) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-[#dce7f5] bg-white p-4 text-center shadow-sm", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto flex aspect-square max-w-[208px] items-center justify-center rounded-xl bg-white p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeSVG, { value: krwTransferQrValue, size: 188, level: "M", includeMargin: true, bgColor: "#ffffff", fgColor: "#071b3a" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-xs font-bold text-slate-900", children: "QR로 송금 정보 불러오기" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] leading-relaxed text-slate-700", children: "계좌 정보를 확인한 뒤 은행 앱에서 QR을 스캔하세요." })
                ] })
              ] })
            ] }),
            isPending && !isManualDeposit && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", style: { textAlign: checkoutDesign.payment_alignment === "center" ? "center" : "left" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: checkoutDesign.payment_alignment === "center" ? "center" : "left" }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[16px] font-semibold mb-1", style: { color: checkoutDesign.heading_color }, children: checkoutText("Select Payment Channel", "결제 수단 선택") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px]", style: { color: checkoutDesign.body_text_color }, children: isCny ? checkoutText("Choose your preferred payment flow for your CNY payment.", "CNY 결제에 사용할 결제 수단을 선택하세요.") : checkoutText("Choose your preferred bank, wallet, or payment flow.", "은행, 전자지갑 또는 결제 수단을 선택하세요.") })
              ] }),
              loadingInstitutions ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-[#FF6B00]" }) }) : isPhp && institutions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-slate-500", children: checkoutText("No PHP bank or wallet options are available right now.", "현재 사용 가능한 PHP 은행 또는 지갑 옵션이 없습니다.") }) }) : isAlipay ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => openMagpieWalletCheckout("alipay"),
                  className: "w-full flex items-center gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#FF6B00] hover:shadow-lg transition-all group",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-xl bg-[#00A0E9]/10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "Alipay", size: "sm", className: "bg-transparent" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-left", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-lg text-slate-900", children: checkoutText("Pay with Alipay", "Alipay로 결제") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-slate-700", children: checkoutText("Fast & secure mobile wallet", "빠르고 안전한 모바일 전자지갑") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-6 w-6 text-slate-300 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition" })
                  ]
                }
              ) : isWeChat ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => openMagpieWalletCheckout("wechat"),
                  className: "w-full flex items-center gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-[#07C160] hover:shadow-lg transition-all group",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-xl bg-[#07C160]/10 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "WeChat Pay", size: "sm", className: "bg-transparent" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-left", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-lg text-slate-900", children: checkoutText("Pay with WeChat Pay", "WeChat Pay로 결제") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-slate-700", children: checkoutText("Secure payments via WeChat", "WeChat을 통한 안전한 결제") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-6 w-6 text-slate-300 group-hover:text-[#07C160] group-hover:translate-x-1 transition" })
                  ]
                }
              ) : isCny ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `grid gap-4 ${checkoutDesign.payment_layout === "list" ? "grid-cols-1" : "sm:grid-cols-2"}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => openMagpieWalletCheckout("alipay"),
                    className: `flex min-h-36 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all group hover:-translate-y-0.5 hover:border-[#00A0E9] hover:shadow-lg ${checkoutDesign.payment_alignment === "center" ? "justify-center text-center" : "text-left"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#00A0E9]/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "Alipay", size: "md", className: "border-0 bg-transparent p-0 shadow-none" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-semibold text-slate-900", children: checkoutText("Alipay", "Alipay") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[12px] leading-5 text-slate-500", children: checkoutText("Pay in CNY with Alipay", "Alipay로 CNY 결제") })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#00A0E9]" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => openMagpieWalletCheckout("wechat"),
                    className: `flex min-h-36 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all group hover:-translate-y-0.5 hover:border-[#07C160] hover:shadow-lg ${checkoutDesign.payment_alignment === "center" ? "justify-center text-center" : "text-left"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#07C160]/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "WeChat Pay", size: "md", className: "border-0 bg-transparent p-0 shadow-none" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-semibold text-slate-900", children: checkoutText("WeChat Pay", "WeChat Pay") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[12px] leading-5 text-slate-500", children: checkoutText("Pay in CNY with WeChat", "WeChat으로 CNY 결제") })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#07C160]" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => openMagpieWalletCheckout("unionpay"),
                    disabled: walletCheckoutLoading,
                    className: `flex min-h-36 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-all group hover:-translate-y-0.5 hover:border-[#e23b2e] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 ${checkoutDesign.payment_alignment === "center" ? "justify-center text-center" : "text-left"}`,
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "UnionPay", size: "md", className: "border-0 bg-transparent p-0 shadow-none" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base font-semibold text-slate-900", children: checkoutText("UnionPay", "UnionPay") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[12px] leading-5 text-slate-500", children: checkoutText("Pay in CNY with UnionPay", "UnionPay로 CNY 결제") })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#e23b2e]" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sm:col-span-2 rounded-2xl border border-indigo-200 bg-indigo-50 p-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-semibold text-slate-900", children: checkoutText("Alternative: pay in USD or EUR", "대안: USD 또는 EUR로 결제") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs leading-5 text-slate-600", children: checkoutText(
                    "SwiftPay will show the converted foreign-currency amount. Your KRW total remains fixed at the amount above.",
                    "SwiftPay에 환산된 외화 금액이 표시됩니다. 원화 결제 금액은 위 금액으로 고정됩니다."
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs font-semibold text-indigo-900", children: [
                    checkoutText("KRW amount due:", "결제할 원화 금액:"),
                    " ",
                    fmtCurrency(payableAmount, "KRW")
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 grid gap-2 sm:grid-cols-2", children: ["USD", "EUR"].map((currency) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      type: "button",
                      onClick: () => openSwiftPayCurrencyCheckout(currency),
                      disabled: swiftPayCurrencyLoading !== null,
                      className: "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60",
                      children: [
                        swiftPayCurrencyLoading === currency && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
                        currency,
                        " checkout"
                      ]
                    },
                    currency
                  )) })
                ] })
              ] }) : isMagpieCheckout ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => handleStartCheckout(),
                  className: "w-full flex items-center gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-lg transition-all group",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex -space-x-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "Alipay", size: "sm", className: "relative z-10 bg-white" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "WeChat Pay", size: "sm", className: "bg-white" })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-left", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-lg text-slate-900", children: checkoutText("International Checkout", "해외 결제") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-slate-500", children: checkoutText("Alipay and WeChat Pay supported", "Alipay와 WeChat Pay를 지원합니다") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-6 w-6 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition" })
                  ]
                }
              ) : isPhp && loadingInstitutions ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mx-auto mb-3 h-5 w-5 animate-spin" }),
                checkoutText("Loading available payment methods…", "사용 가능한 결제 수단을 불러오는 중…")
              ] }) : isPhp && institutionLoadFailed ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-amber-200 bg-amber-50 px-5 py-8 text-center text-sm text-amber-800", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mx-auto mb-3 h-5 w-5" }),
                checkoutText("Payment methods could not be loaded. Please refresh to try again.", "결제 수단을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.")
              ] }) : visibleInstitutions.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
                qrphInstitutions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "QRPH", size: "sm", className: "h-7 w-12 border-0 bg-transparent p-0 shadow-none" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-widest text-slate-500", children: "QRPH" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400", children: checkoutText("Scan with a supported app", "지원 앱으로 스캔") })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", children: qrphInstitutions.map(renderInstitutionButton) })
                ] }),
                digitalWallets.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-7 w-12 items-center justify-center rounded-lg bg-orange-50 text-orange-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "h-4 w-4", "aria-hidden": "true" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-widest text-slate-500", children: checkoutText("E-Wallets", "전자지갑") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400", children: checkoutText("Mobile payment apps", "모바일 결제 앱") })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", children: digitalWallets.map(renderInstitutionButton) })
                ] }),
                banks.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 pt-6 border-t border-slate-100", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-7 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4", "aria-hidden": "true" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-widest text-slate-500", children: checkoutText("Banks", "은행") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400", children: checkoutText("Secure bank redirect", "안전한 은행 결제") })
                      ] })
                    ] }),
                    banks.length > 4 && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "relative block sm:w-56", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400", "aria-hidden": "true" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: checkoutText("Search banks", "은행 검색") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "input",
                        {
                          type: "search",
                          value: phpBankSearch,
                          onChange: (event) => setPhpBankSearch(event.target.value),
                          placeholder: checkoutText("Search banks", "은행 검색"),
                          className: "h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/20"
                        }
                      )
                    ] })
                  ] }),
                  filteredBanks.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", children: filteredBanks.map(renderInstitutionButton) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500", children: checkoutText("No matching banks found.", "일치하는 은행이 없습니다.") })
                ] })
              ] }) : isPhp ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 bg-white border border-slate-200 rounded-2xl", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-10 w-10 mx-auto mb-4 text-slate-200" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-400", children: checkoutText("No payment methods are currently available", "현재 사용 가능한 결제 수단이 없습니다") })
              ] }) : hasCheckoutLink ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => handleStartCheckout(),
                  className: "w-full bg-[#111111] text-white py-6 rounded-2xl font-semibold text-lg shadow-xl shadow-black/20 hover:bg-black transition-all flex items-center justify-center gap-3 group",
                  children: [
                    "Secure Checkout",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 20, className: "group-hover:translate-x-1 transition-transform" })
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-12 bg-white border border-slate-200 rounded-2xl", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-10 w-10 mx-auto mb-4 text-slate-200" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-400", children: checkoutText("No payment methods available", "사용 가능한 결제 수단이 없습니다") })
              ] }),
              hasQR && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: qrPanelMode === "gcash" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "section",
                {
                  "aria-label": "GCash QRPH payment details",
                  className: "overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "sr-only", children: checkoutText("GCash QRPH payment details", "GCash QRPH 결제 정보") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-[180px] items-center justify-center bg-[#2f5f9f] px-6 py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/logos/qrph.svg", alt: "QRPH", className: "h-14 w-auto" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 p-6", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[15px] text-slate-500", children: checkoutText("Merchant", "가맹점") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-right text-[18px] font-semibold text-slate-900", children: merchantDisplayName })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[15px] text-slate-500", children: checkoutText("Amount Due", "결제 금액") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-right text-[18px] font-semibold text-[#2f5f9f]", children: [
                            "PHP ",
                            Number(txn.amount || 0).toLocaleString(void 0, { maximumFractionDigits: 2 })
                          ] })
                        ] })
                      ] }),
                      gcashDeepLink && /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        "button",
                        {
                          onClick: () => handleGcashDeepLink(gcashDeepLink),
                          className: "flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f5f9f] px-5 py-3.5 text-[18px] font-medium text-white hover:bg-[#254f86] transition-colors",
                          "aria-label": "Open GCash app to continue payment",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { size: 18 }),
                            "Open GCash App"
                          ]
                        }
                      ),
                      !gcashDeepLink && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-[#2f5f9f]/20 bg-[#2f5f9f]/5 px-4 py-3 text-center text-[13px] text-[#1d3f69]", children: "Open your GCash app and scan the QR code below to continue." }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-center", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[22px] font-semibold text-slate-900", children: checkoutText("Scan QR Code to Pay", "QR 코드를 스캔하여 결제") }),
                        hasQrPayload ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /^https?:\/\//i.test(txn.qr_code_url || "") ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: txn.qr_code_url, alt: "GCash QRPH payment code", className: "mx-auto w-full max-w-[320px] rounded-xl object-contain" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeSVG, { value: txn.qr_code_url, size: 320, level: "M", includeMargin: true, bgColor: "#ffffff", fgColor: "#071b3a", className: "h-auto max-w-full" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600", children: "QR code is being prepared. Please refresh in a moment or use Open App." })
                      ] })
                    ] })
                  ]
                }
              ) : qrPanelMode === "qrph" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "section",
                {
                  "aria-label": "QRPH payment details",
                  className: "overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "sr-only", children: checkoutText("QRPH payment details", "QRPH 결제 정보") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 bg-gradient-to-r from-[#0F172A] to-[#1E3A8A] px-6 py-7 text-white", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/logos/qrph.svg", alt: "QRPH", className: "h-10 w-auto" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide", children: "SWIFTPAY QRPH" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-blue-100", children: checkoutText("Scan this code with any QRPH-compatible bank or e-wallet app.", "QRPH를 지원하는 은행 또는 전자지갑 앱으로 이 코드를 스캔하세요.") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 p-6", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: checkoutText("Merchant", "가맹점") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-[15px] font-semibold text-slate-900", children: merchantDisplayName })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sm:text-right", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: checkoutText("Amount Due", "결제 금액") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[18px] font-semibold text-[#1E3A8A]", children: fmtCurrency(Number(txn.amount || 0), txn.currency || "PHP") })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-center", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[18px] font-semibold text-slate-900", children: checkoutText("Scan QR Code to Pay", "QR 코드를 스캔하여 결제") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-500", children: checkoutText("Use your preferred banking app and confirm payment.", "원하는 은행 앱으로 스캔한 뒤 결제를 확인하세요.") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /^https?:\/\//i.test(txn.qr_code_url || "") ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: txn.qr_code_url, alt: "QRPH payment code", className: "mx-auto w-full max-w-[320px] rounded-xl object-contain" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeSVG, { value: txn.qr_code_url, size: 320, level: "M", includeMargin: true, bgColor: "#ffffff", fgColor: "#071b3a", className: "h-auto max-w-full" }) })
                      ] })
                    ] })
                  ]
                }
              ) : qrPanelMode === "alipay" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "section",
                {
                  "aria-label": "Alipay payment details",
                  className: "overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "sr-only", children: checkoutText("Alipay payment details", "알리페이 결제 정보") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 bg-gradient-to-r from-[#0B57D0] to-[#0E63E0] px-6 py-7 text-white", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/logos/alipay.png", alt: "Alipay", className: "h-10 w-auto" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide", children: "ALIPAY QR" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-blue-100", children: checkoutText("Scan this code with the Alipay app to complete payment.", "알리페이 앱으로 이 코드를 스캔해 결제를 완료하세요.") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 p-6", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: checkoutText("Merchant", "가맹점") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 truncate text-[15px] font-semibold text-slate-900", children: merchantDisplayName })
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sm:text-right", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold uppercase tracking-wide text-slate-500", children: checkoutText("Amount Due", "결제 금액") }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[18px] font-semibold text-[#0B57D0]", children: fmtCurrency(Number(txn.amount || 0), txn.currency || "PHP") })
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 text-center", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[18px] font-semibold text-slate-900", children: checkoutText("Pay with Alipay", "알리페이로 결제") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-500", children: checkoutText("Scan the QR code with Alipay, or open the secure checkout directly.", "알리페이로 QR 코드를 스캔하거나 안전한 결제 페이지를 직접 여세요.") }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center", children: /^https?:\/\//i.test(txn.qr_code_url || "") ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: txn.qr_code_url, alt: "Alipay payment code", className: "mx-auto w-full max-w-[320px] rounded-xl object-contain" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeSVG, { value: txn.qr_code_url, size: 320, level: "M", includeMargin: true, bgColor: "#ffffff", fgColor: "#071b3a", className: "h-auto max-w-full" }) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(
                            "button",
                            {
                              type: "button",
                              onClick: () => {
                                if (txn.payment_url) window.location.assign(txn.payment_url);
                              },
                              disabled: !txn.payment_url,
                              className: "flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B57D0] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0949b0] disabled:cursor-not-allowed disabled:opacity-50",
                              children: [
                                /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { size: 16 }),
                                checkoutText("Open secure checkout", "안전한 결제 페이지 열기")
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-400", children: checkoutText("Your payment status will update automatically after confirmation.", "결제가 확인되면 결제 상태가 자동으로 업데이트됩니다.") })
                        ] })
                      ] })
                    ] })
                  ]
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => setShowQRPhModal(true),
                  className: "w-full flex items-center gap-4 p-5 rounded-2xl border bg-white transition-all group border-slate-200 hover:border-emerald-500",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50", children: /* @__PURE__ */ jsxRuntimeExports.jsx(QrCode, { className: "h-6 w-6 text-emerald-600" }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-left", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-slate-900", children: "Scan QR Code" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-500", children: checkoutText("Pay using your banking app", "은행 앱으로 결제") })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-5 w-5 text-slate-300 transition group-hover:text-emerald-500" })
                  ]
                }
              ) }) })
            ] }),
            isPaid && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-[32px] p-12 text-center space-y-6 shadow-xl shadow-slate-200/50", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-10 w-10 text-emerald-500" }) }),
              statusPaymentMethodBrand && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex w-fit items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: statusPaymentMethodBrand, size: "sm" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold text-slate-700", children: [
                  checkoutText("Paid with", "결제 수단"),
                  ": ",
                  statusPaymentMethodBrand
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold text-slate-900 mb-2", children: checkoutText("Payment Successful", "결제가 완료되었습니다") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: checkoutText("Your transaction has been completed successfully.", "거래가 성공적으로 완료되었습니다.") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/home", className: "inline-flex items-center justify-center gap-2 px-8 py-3 bg-[#111111] text-white rounded-xl font-semibold transition hover:bg-black shadow-lg shadow-black/10", children: checkoutText("Done", "완료") }) })
            ] }),
            isExpired && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-[32px] p-12 text-center space-y-6 shadow-xl shadow-slate-200/50", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto border border-rose-100", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-10 w-10 text-rose-500" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold text-slate-900 mb-2", children: checkoutText("Link Expired", "결제 링크 만료") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-slate-500", children: checkoutText("This payment link is no longer active.", "이 결제 링크는 더 이상 사용할 수 없습니다.") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/home", className: "inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-100 text-slate-900 rounded-xl font-semibold transition hover:bg-slate-200", children: checkoutText("Return Home", "홈으로 돌아가기") }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 md:col-span-1 lg:col-span-2 lg:sticky lg:top-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border border-slate-200 rounded-2xl p-6 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1", children: checkoutText("Order reference", "주문 번호") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "min-w-0 flex-1 break-all font-mono text-[13px] font-semibold text-slate-900 blur-[3px] transition-[filter] duration-200 group-hover:blur-0 group-focus-within:blur-0", children: displayReference }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => copyToClipboard(displayReference),
                      className: "shrink-0 rounded-lg p-1.5 transition hover:bg-slate-50",
                      "aria-label": "Copy order reference",
                      children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-emerald-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5 text-slate-500" })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-slate-50 pt-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] font-semibold text-slate-600 uppercase tracking-widest mb-1", children: checkoutText("Created", "생성일") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] font-semibold text-slate-900", children: new Date(txn.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) })
              ] })
            ] }) }),
            txn.bank_account_number && !isKrw && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 pb-4 border-b border-slate-50", children: [
                txn.merchant_logo_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white p-1 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: txn.merchant_logo_url, alt: txn.merchant_name || "Company logo", className: "h-full w-full object-contain" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: isKrw ? krwBankName : txn.bank_name || "Bank", size: "sm" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] font-semibold text-slate-900 uppercase tracking-widest", children: checkoutText("Payment account", "결제 계좌") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-[13px]", children: [
                (isKrw ? krwBankName : txn.bank_name) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-600", children: checkoutText("Bank", "은행") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-slate-900", children: isKrw ? krwBankName : txn.bank_name })
                ] }),
                txn.bank_account_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-600", children: checkoutText("Account holder", "예금주") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-slate-900", children: txn.bank_account_name })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-slate-600", children: checkoutText("Account number", "계좌번호") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "font-mono font-semibold text-slate-900 break-all flex-1", children: txn.bank_account_number }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => copyToClipboard(txn.bank_account_number),
                        className: "p-1.5 hover:bg-slate-50 rounded-lg transition shrink-0",
                        "aria-label": "Copy account number",
                        children: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5 text-emerald-600" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3.5 w-3.5 text-slate-500" })
                      }
                    )
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center pt-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-slate-600 font-semibold uppercase tracking-[0.2em] mb-1", children: checkoutText("Store", "상점") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[14px] font-semibold text-slate-900 tracking-tight", children: merchantDisplayName })
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showCheckoutModal, onOpenChange: setShowCheckoutModal, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "max-w-2xl max-h-[90vh] p-0 border-0 bg-white", children: checkoutModalUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "iframe",
          {
            src: checkoutModalUrl,
            title: "Secure Checkout",
            className: "w-full h-[85vh] border-0 rounded-lg",
            sandbox: "allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation allow-cookies"
          }
        ) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showCardForm, onOpenChange: setShowCardForm, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "max-w-md border-0 bg-white p-0 shadow-[0_24px_80px_rgba(2,6,23,0.16)]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submitMagpieCard, className: "overflow-hidden rounded-[28px] border border-slate-200 bg-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-br from-[#071b3a] via-[#0b4b9a] to-[#1475d1] px-5 py-5 text-white", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/15", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { className: "h-5 w-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: "Card payment" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-100", children: "Securely processed by SwiftPay" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 text-2xl font-semibold text-white drop-shadow-sm", children: fmtCurrency(Number((txn == null ? void 0 : txn.amount) || 0), (txn == null ? void 0 : txn.currency) || "KRW") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 p-5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-[#dfeafc] bg-[#f8fbff] px-3 py-2.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-bold uppercase tracking-[0.2em] text-[#0b4b9a]", children: checkoutText("Currency", "통화") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm font-medium text-slate-700", children: [
                (txn == null ? void 0 : txn.currency) || "KRW",
                " ",
                checkoutText("payment", "결제")
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-800", children: [
              checkoutText("Cardholder name", "카드 소유자 이름"),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, autoComplete: "cc-name", value: cardForm.name, onChange: (e) => setCardForm({ ...cardForm, name: e.target.value }), className: "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 normal-case tracking-normal shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-800", children: [
              checkoutText("Card number", "카드 번호"),
              /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, inputMode: "numeric", autoComplete: "cc-number", value: cardForm.number, onChange: (e) => setCardForm({ ...cardForm, number: e.target.value }), placeholder: "1234 5678 9012 3456", className: "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 tracking-normal shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-800", children: [
              checkoutText("Customer country", "고객 국가"),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "select",
                {
                  value: cardForm.country || ((txn == null ? void 0 : txn.currency) === "KRW" ? "KR" : "PH"),
                  onChange: (e) => setCardForm({ ...cardForm, country: e.target.value }),
                  disabled: (txn == null ? void 0 : txn.currency) === "KRW",
                  className: "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-80",
                  children: COUNTRY_OPTIONS.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option.value, children: option.label }, option.value))
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-slate-800", children: [
                checkoutText("Month", "월"),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, inputMode: "numeric", autoComplete: "cc-exp-month", maxLength: 2, value: cardForm.expMonth, onChange: (e) => setCardForm({ ...cardForm, expMonth: e.target.value }), placeholder: "MM", className: "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 tracking-normal shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-slate-800", children: [
                checkoutText("Year", "연도"),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, inputMode: "numeric", autoComplete: "cc-exp-year", maxLength: 4, value: cardForm.expYear, onChange: (e) => setCardForm({ ...cardForm, expYear: e.target.value }), placeholder: "YYYY", className: "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 tracking-normal shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-semibold uppercase tracking-[0.16em] text-slate-800", children: [
                checkoutText("CVC", "CVC"),
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, inputMode: "numeric", autoComplete: "cc-csc", maxLength: 4, value: cardForm.cvc, onChange: (e) => setCardForm({ ...cardForm, cvc: e.target.value }), placeholder: "CVC", className: "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-900 tracking-normal shadow-inner outline-none transition focus:border-[#1475d1] focus:bg-white focus:ring-4 focus:ring-sky-100" })
              ] })
            ] }),
            cardFormError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700", children: cardFormError }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] leading-relaxed text-slate-600", children: (txn == null ? void 0 : txn.currency) === "KRW" ? checkoutText("Your card payment will process by Toss Bank.", "카드 결제는 토스뱅크를 통해 처리됩니다.") : checkoutText("Your card payment will process by SwiftPay.", "카드 결제는 SwiftPay를 통해 처리됩니다.") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] leading-relaxed text-slate-500", children: checkoutText(
              "Your card details are sent directly to the payment processor for tokenization. SwiftPay does not store your card number or security code.",
              "카드 정보는 토큰화를 위해 결제 처리업체로 직접 전송됩니다. SwiftPay는 카드 번호나 보안 코드를 저장하지 않습니다."
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: cardCheckoutLoading, className: "flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b4b9a] disabled:cursor-not-allowed disabled:opacity-60", children: [
              cardCheckoutLoading && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
              checkoutText("Pay securely", "안전하게 결제")
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: walletMethod !== null, onOpenChange: (open) => !open && setWalletMethod(null), children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "max-w-md border-0 bg-white p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-gradient-to-br from-[#071b3a] via-[#0b4b9a] to-[#1475d1] px-6 py-6 text-white", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-white/15", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "h-5 w-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-semibold", children: walletMethod === "alipay" ? "Alipay payment" : walletMethod === "wechat" ? "WeChat Pay payment" : "UnionPay payment" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-blue-100", children: "Securely processed by SwiftPay" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 text-2xl font-semibold text-white drop-shadow-sm", children: fmtCurrency(Number((txn == null ? void 0 : txn.amount) || 0), "CNY") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 p-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm leading-relaxed text-slate-600", children: "Continue to your selected wallet to authorize this payment. SwiftPay does not collect your wallet password or account credentials." }),
            walletFormError && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { role: "alert", className: "rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700", children: walletFormError }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: submitMagpieWallet,
                disabled: walletCheckoutLoading,
                className: "flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b3a] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b4b9a] disabled:cursor-not-allowed disabled:opacity-60",
                children: [
                  walletCheckoutLoading && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }),
                  "Continue securely"
                ]
              }
            )
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Dialog,
          {
            open: showQRPhModal,
            onOpenChange: (open) => {
              setShowQRPhModal(open);
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-6 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold text-slate-900", children: qrInstructionApp === "toss" ? "Pay with Toss" : "Scan QR Code to Pay" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-slate-500", children: qrInstructionApp === "toss" ? "Open Toss, choose QR scan, and scan this QR code to complete payment." : checkoutText("Use your banking or e-wallet app to scan and complete payment", "은행 또는 전자지갑 앱으로 스캔하여 결제를 완료하세요") })
              ] }),
              (qrInstructionApp === "toss" ? tossQrValue : qrCodeUrl) ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-center", children: qrInstructionApp === "toss" ? /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeSVG, { value: tossQrValue, size: 320, level: "M", includeMargin: true, bgColor: "#ffffff", fgColor: "#071b3a", className: "h-auto max-w-full" }) : /^https?:\/\//i.test(qrCodeUrl || "") ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: qrCodeUrl || "", alt: "Payment QR code", className: "w-full max-w-xs rounded-lg object-contain" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeSVG, { value: qrCodeUrl || "", size: 320, level: "M", includeMargin: true, bgColor: "#ffffff", fgColor: "#071b3a", className: "h-auto max-w-full" }) }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full bg-slate-50 rounded-lg p-4 space-y-2 text-center text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-semibold text-slate-900", children: [
                  "Merchant: ",
                  merchantDisplayName
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-slate-600", children: [
                  "Amount: ",
                  fmtCurrency(Number(txn.amount || 0), txn.currency || "PHP")
                ] })
              ] })
            ] }) })
          }
        ),
        checkoutDesign.show_powered_by && /* @__PURE__ */ jsxRuntimeExports.jsx(CheckoutPoweredBy, { currency: currencyCode, paymentChannels, className: "mx-auto max-w-6xl px-4 sm:px-6 lg:px-8" })
      ]
    }
  );
}
export {
  Checkout as default
};
