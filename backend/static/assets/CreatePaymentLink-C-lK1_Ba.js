import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { e as useNavigate, a as reactExports } from "./router-vendor-C2eKMart.js";
import { a as useLanguage, f as useCollectionCurrency, L as Layout, j as useTranslation, g as client } from "./index-DxezdLhY.js";
import { c as createPaymentLink } from "./paymentLinks-BlbKzDwi.js";
/* empty css                         */
import { v as ChevronLeft, r as Landmark, d as ShieldCheck, ag as QrCode } from "./utils-vendor-HFbfdctU.js";
import "./ui-vendor-DsSOT9J9.js";
function CreatePaymentLink() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = useTranslation(language);
  const { collectionCurrency, enabledCurrencies } = useCollectionCurrency();
  const isKorean = language === "ko";
  const availableCurrencies = Array.from(/* @__PURE__ */ new Set([...enabledCurrencies, "PHP", "USD", "EUR", "KRW"]));
  const [currency, setCurrency] = reactExports.useState(collectionCurrency.toUpperCase());
  const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
  reactExports.useEffect(() => {
    setCurrency(collectionCurrency.toUpperCase());
  }, [collectionCurrency]);
  const [amount, setAmount] = reactExports.useState("");
  const [title, setTitle] = reactExports.useState("");
  const [validUntil, setValidUntil] = reactExports.useState(() => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [payor, setPayor] = reactExports.useState("");
  const [orderNo, setOrderNo] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [error, setError] = reactExports.useState("");
  const handleGenerate = async () => {
    var _a, _b;
    const numericAmount = Number(amount.replace(/[^0-9.]/g, ""));
    const minimumAmount = currency === "KRW" ? 1e3 : 1;
    const maximumAmount = currency === "KRW" ? 1e8 : 5e4;
    const currencyLabel = { PHP: "₱", KRW: "₩", USD: "$", EUR: "€" }[currency] || currency;
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError(isKorean ? "유효한 금액을 입력하세요." : "Please enter a valid amount.");
      return;
    }
    if (numericAmount < minimumAmount || numericAmount > maximumAmount) {
      setError(
        isKorean ? `${currency} 결제 금액은 ${currencyLabel}${minimumAmount.toLocaleString()}~${currencyLabel}${maximumAmount.toLocaleString()}이어야 합니다.` : `${currency} payment links must be between ${currencyLabel}${minimumAmount.toLocaleString()} and ${currencyLabel}${maximumAmount.toLocaleString()}.`
      );
      return;
    }
    if (!title.trim()) {
      setError(isKorean ? "제목을 입력하세요." : "Please enter a title.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      const reference_no = (orderNo == null ? void 0 : orderNo.trim()) || `PLNK-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const normalizedCurrency = currency;
      const usesSwiftPayLinks = ["PHP", "USD", "EUR"].includes(normalizedCurrency);
      const response = usesSwiftPayLinks ? await client.post("/api/v1/swiftpay/payment-links", {
        amount: numericAmount,
        currency: normalizedCurrency,
        title: title.trim(),
        referenceNo: reference_no,
        validUntil: validUntil ? `${validUntil}T23:59:59Z` : void 0,
        customerName: payor.trim() || void 0,
        description: description.trim() || void 0
      }) : normalizedCurrency === "KRW" ? await client.post("/api/v1/krw/payment-links", {
        amount: numericAmount,
        reference_no,
        description: description.trim() || title.trim(),
        customer_name: payor.trim() || void 0,
        payment_methods: ["bank_transfer"],
        expiry_days: Math.max(
          1,
          Math.min(
            90,
            Math.ceil(((/* @__PURE__ */ new Date(`${validUntil}T23:59:59`)).getTime() - Date.now()) / 864e5)
          )
        )
      }) : await client.post("/api/v1/xend/create-payment-link", {
        amount: numericAmount,
        description: description.trim() || title.trim(),
        currency: normalizedCurrency,
        external_id: reference_no,
        customer_name: payor.trim() || "",
        payment_methods: normalizedCurrency === "PHP" ? [] : ["bank_transfer"]
      });
      const data = response.data;
      if (!response.ok || !(data == null ? void 0 : data.success)) {
        const message = (data == null ? void 0 : data.detail) || (data == null ? void 0 : data.message) || "Failed to create payment link.";
        setError(isKorean ? `결제 링크를 만들 수 없습니다: ${message}` : message);
        return;
      }
      const backendPayload = (data == null ? void 0 : data.data) ?? data ?? {};
      const redirectUrl = backendPayload.paymentUrl || backendPayload.payment_url || backendPayload.checkout_url || data.payment_url || data.redirect_url || "";
      if (!redirectUrl) {
        setError(isKorean ? "유효한 결제 링크를 받지 못했습니다." : "Payment link did not return a valid checkout URL.");
        return;
      }
      const rawBankAccount = ((_a = backendPayload.raw) == null ? void 0 : _a.bank_account) || ((_b = data.raw) == null ? void 0 : _b.bank_account) || {};
      const bankAccount = backendPayload.bank_account || data.bank_account || (rawBankAccount.bank_name || rawBankAccount.account_number || rawBankAccount.account_name ? {
        bank_name: rawBankAccount.bank_name,
        number: rawBankAccount.number || rawBankAccount.account_number,
        account_name: rawBankAccount.account_name || rawBankAccount.name,
        swift_code: rawBankAccount.swift_code
      } : null);
      const qrCodeUrl = backendPayload.qr_code_url || data.qr_code_url || "";
      const hasBankAccount = Boolean((bankAccount == null ? void 0 : bankAccount.bank_name) || (bankAccount == null ? void 0 : bankAccount.number) || (bankAccount == null ? void 0 : bankAccount.account_name));
      const channelSelectionUrl = redirectUrl;
      const link = createPaymentLink({
        amount: numericAmount,
        currency: normalizedCurrency,
        title: title.trim(),
        validUntil,
        code: usesSwiftPayLinks ? String(backendPayload.code || "") : void 0,
        provider: usesSwiftPayLinks ? "swiftpay" : void 0,
        payor,
        orderNo,
        externalId: reference_no,
        description,
        paymentUrl: channelSelectionUrl,
        qrCodeUrl,
        bankAccountDetails: hasBankAccount ? {
          bank_name: (bankAccount == null ? void 0 : bankAccount.bank_name) || (bankAccount == null ? void 0 : bankAccount.bankName) || "",
          number: (bankAccount == null ? void 0 : bankAccount.number) || (bankAccount == null ? void 0 : bankAccount.account_number) || "",
          account_name: (bankAccount == null ? void 0 : bankAccount.account_name) || (bankAccount == null ? void 0 : bankAccount.accountName) || "",
          swift_code: bankAccount == null ? void 0 : bankAccount.swift_code
        } : void 0
      });
      navigate(`/pay-by-link/details/${link.code}`);
    } catch (err) {
      setError(isKorean ? "결제 링크를 만들 수 없습니다. 다시 시도하세요." : "Unable to create payment link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "payment-workspace page-enter w-full space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[12px] text-slate-400 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-pointer hover:text-slate-600", onClick: () => navigate("/pay-by-link"), children: t("payment_links") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: ">" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-semibold", children: t("create_payment_link") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => navigate("/pay-by-link"),
          className: "w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 m-0", children: t("create_payment_link") })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sm:p-8 max-w-[640px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[13px] text-slate-500 mb-6 leading-relaxed", children: t("create_payment_link_description").replace("{currency}", currency) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-8 grid gap-3 sm:grid-cols-3", children: (currency === "KRW" ? [
        { icon: Landmark, title: "Korean bank transfer", text: "Manual payment verification" },
        { icon: ShieldCheck, title: "Super-admin approval", text: "Payment is approved after verification" },
        { icon: ShieldCheck, title: "SwiftPay integrated", text: "Self-hosted checkout on swiftpay.ph" }
      ] : [
        { icon: QrCode, title: "GCash / QRPH", text: "Fast QR checkout" },
        { icon: Landmark, title: "Bank transfer", text: "Supported PH banks" },
        { icon: ShieldCheck, title: "SwiftPay integrated", text: "Self-hosted checkout on swiftpay.ph" }
      ]).map(({ icon: Icon, title: cardTitle, text }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 17, className: "mb-2 text-[#FF6B00]" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-slate-900", children: cardTitle }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-slate-500", children: text })
      ] }, cardTitle)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: t("payment_link_currency") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "select",
            {
              value: currency,
              onChange: (event) => setCurrency(event.target.value),
              className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all",
              children: availableCurrencies.map((option) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: option, children: option }, option))
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: t("payment_link_amount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-slate-400 font-medium", children: currency }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: amount,
                onChange: (e) => setAmount(e.target.value),
                inputMode: "decimal",
                placeholder: "0.00",
                className: "w-full bg-white border border-slate-200 rounded-lg pl-8 pr-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: t("payment_link_title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: title,
              onChange: (e) => setTitle(e.target.value),
              maxLength: 100,
              className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: t("payment_link_valid_until") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "date",
                value: validUntil,
                onChange: (e) => setValidUntil(e.target.value),
                min: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: [
              t("payment_link_payor"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-normal", children: t("payment_link_optional") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: payor,
                onChange: (e) => setPayor(e.target.value),
                maxLength: 150,
                className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: [
              t("payment_link_order_no"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-normal", children: t("payment_link_optional") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: orderNo,
                onChange: (e) => setOrderNo(e.target.value),
                maxLength: 50,
                className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: [
              t("payment_link_description"),
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-400 font-normal", children: t("payment_link_optional") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: description,
                onChange: (e) => setDescription(e.target.value),
                maxLength: 500,
                className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-[#FF6B00] transition-all"
              }
            )
          ] })
        ] }),
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-rose-600 mb-2", children: error }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleGenerate,
            disabled: isSubmitting,
            "data-guide-target": "payment-link-generate",
            className: "bg-slate-900 text-white px-8 py-3 rounded-lg font-semibold text-[13px] hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            children: isSubmitting ? t("generating_link") : t("generate_link")
          }
        ) })
      ] })
    ] })
  ] }) });
}
export {
  CreatePaymentLink as default
};
