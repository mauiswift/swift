import { j as jsxRuntimeExports } from "./query-vendor-C49KnSO9.js";
import { k as useParams, f as useNavigate, j as useSearchParams, a as reactExports } from "./router-vendor-N0qZPfHZ.js";
import { v as useCollectionCurrency, i as client, b as ue, k as getCurrencySymbol } from "./index-CpEIrYHf.js";
import { L as LoadingSkeleton } from "./LoadingSkeleton-Bs5L13ZF.js";
import { aF as Store, d as ShieldCheck, b as LoaderCircle, G as ChevronRight } from "./utils-vendor-Bm5lXE_Q.js";
import "./ui-vendor-CXLHQPHT.js";
const LINK_CURRENCIES = ["PHP", "KRW", "CNY", "USDT"];
function parsePermanentLink(value) {
  const normalized = (value || "").toLowerCase();
  const currency = LINK_CURRENCIES.find((code) => normalized.endsWith(`-${code.toLowerCase()}`));
  return currency ? { slug: normalized.slice(0, -(currency.length + 1)), currency } : { slug: value || "", currency: null };
}
function PermanentPayPage() {
  var _a, _b;
  const { slug: routeSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const link = parsePermanentLink(routeSlug);
  const [merchant, setMerchant] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [amount, setAmount] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [acknowledged, setAcknowledged] = reactExports.useState(false);
  const [creating, setCreating] = reactExports.useState(false);
  const { collectionCurrency } = useCollectionCurrency();
  const fetchMerchant = reactExports.useCallback(async () => {
    var _a2;
    try {
      const currency = link.currency || ((_a2 = searchParams.get("currency")) == null ? void 0 : _a2.toUpperCase());
      const query = currency ? `?currency=${encodeURIComponent(currency)}` : "";
      const res = await client.get(`/api/v1/public/merchant/${encodeURIComponent(link.slug)}${query}`);
      if (res.data) setMerchant(res.data);
    } catch (err) {
      ue.error("Merchant not found");
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [link.slug, link.currency, navigate, searchParams]);
  reactExports.useEffect(() => {
    fetchMerchant();
  }, [fetchMerchant]);
  const handlePay = async (e) => {
    var _a2, _b2;
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return ue.error("Please enter a valid amount");
    }
    if (!acknowledged) {
      return ue.error("Please acknowledge the payment compliance notice to continue");
    }
    setCreating(true);
    try {
      const currency = (merchant == null ? void 0 : merchant.collection_currency) || "PHP";
      const linkCurrency = link.currency || searchParams.get("currency");
      const query = linkCurrency ? `?currency=${encodeURIComponent(linkCurrency)}` : "";
      const res = await client.post(`/api/v1/public/merchant/${encodeURIComponent(link.slug)}/payment${query}`, {
        amount: numericAmount,
        currency,
        description: description || `Payment to ${merchant == null ? void 0 : merchant.store_name}`
      });
      if (res.ok && ((_a2 = res.data) == null ? void 0 : _a2.external_id)) {
        navigate(`/checkout/${encodeURIComponent(res.data.external_id)}`);
      } else {
        ue.error(((_b2 = res.data) == null ? void 0 : _b2.detail) || "Failed to initialize payment");
      }
    } catch (err) {
      ue.error("An error occurred. Please try again.");
    } finally {
      setCreating(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingSkeleton, { variant: "page" });
  }
  const displayCurrency = link.currency || ((_a = searchParams.get("currency")) == null ? void 0 : _a.toUpperCase()) || (merchant == null ? void 0 : merchant.collection_currency) || collectionCurrency || "PHP";
  const merchantName = ((_b = merchant == null ? void 0 : merchant.store_name) == null ? void 0 : _b.trim()) || "Merchant";
  const parsedAmount = Number(amount);
  const amountInvalid = amount.length > 0 && (!Number.isFinite(parsedAmount) || parsedAmount <= 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-[#F9FAFB] font-sans text-slate-900", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-slate-200 bg-white py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-4xl flex-col items-center px-4 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm", children: (merchant == null ? void 0 : merchant.store_logo_url) ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: merchant.store_logo_url, alt: merchantName, className: "h-full w-full object-contain p-2" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Store, { size: 24, className: "text-slate-200" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-slate-900", children: merchantName }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 14, className: "text-emerald-500" }),
        "Secure payment"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "mx-auto flex max-w-4xl justify-center px-4 py-8 sm:py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "w-full overflow-hidden rounded-[28px] border border-[#d8e4f5] bg-white shadow-[0_18px_55px_rgba(15,63,120,0.10)]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-[linear-gradient(120deg,#071b3a_0%,#0b4b9a_58%,#1475d1_100%)] px-6 py-7 text-white sm:px-8 sm:py-9", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-start justify-between gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] text-blue-100", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_0_4px_rgba(103,232,249,0.15)]" }),
            "OPEN AMOUNT PAYMENT"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-slate-950/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { size: 12 }),
              "Secure Platform"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-50", children: displayCurrency })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-semibold tracking-tight text-white sm:text-[28px]", children: "Enter amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm leading-relaxed text-slate-200", children: "Choose how much you want to pay, then continue to the secure payment selection page." })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-7 space-y-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 text-[13px] text-blue-50/90 backdrop-blur-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-semibold text-white", children: "Payment summary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-50/80", children: "Merchant" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right font-semibold text-white", children: merchantName })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-blue-50/80", children: "Currency" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-white", children: displayCurrency })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handlePay, className: "space-y-6 p-6 sm:p-8 lg:p-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "permanent-payment-amount", className: "text-xs font-semibold uppercase tracking-widest text-slate-400", children: "Enter payment amount" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-3 flex items-center gap-2 rounded-xl border bg-slate-50 px-4 py-3 transition focus-within:bg-white ${amountInvalid ? "border-red-200" : "border-slate-200 focus-within:border-slate-200"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: amountInvalid ? "text-2xl font-semibold text-red-400" : "text-2xl font-semibold text-slate-400", children: getCurrencySymbol(displayCurrency) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: "permanent-payment-amount",
                type: "number",
                min: "0.01",
                step: "0.01",
                required: true,
                autoFocus: true,
                value: amount,
                onChange: (e) => setAmount(e.target.value),
                placeholder: "0.00",
                className: "min-w-0 flex-1 bg-transparent text-2xl font-semibold text-slate-900 outline-none placeholder:text-slate-300"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold text-slate-500", children: displayCurrency })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between gap-3 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: amountInvalid ? "font-medium text-red-600" : "text-slate-500", children: amountInvalid ? "Enter an amount greater than zero." : "Customer can enter any amount for this payment." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-slate-400", children: "Min 0.01" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "permanent-payment-note", className: "text-xs font-semibold uppercase tracking-widest text-slate-400", children: "Note / Description" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              id: "permanent-payment-note",
              value: description,
              onChange: (e) => setDescription(e.target.value),
              placeholder: "What is this for?",
              className: "mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1475d1] focus:bg-white"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm leading-5 text-slate-600 transition-colors hover:border-slate-300 hover:bg-white", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "checkbox",
              required: true,
              checked: acknowledged,
              onChange: (event) => setAcknowledged(event.target.checked),
              className: "mt-0.5 h-4 w-4 shrink-0 accent-[#071b3a]"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "I confirm that I have already received the goods or services purchased from ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-slate-900", children: merchantName }),
            ", and that I am voluntarily making this payment. I acknowledge that the payment details I provide are accurate and agree to the applicable payment compliance requirements."
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "submit",
            disabled: creating || !amount || amountInvalid || !acknowledged,
            className: "w-full rounded-xl bg-[#071b3a] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#0b4b9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1475d1] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            children: creating ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mx-auto h-5 w-5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center justify-center gap-1", children: [
              "Continue",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" })
            ] })
          }
        )
      ] })
    ] }) }) })
  ] });
}
export {
  PermanentPayPage as default
};
