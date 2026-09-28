import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { e as useNavigate, a as reactExports } from "./router-vendor-C2eKMart.js";
import { f as useCollectionCurrency, L as Layout, P as PaymentBrandLogo, g as client, b as ue } from "./index-CqBEc9v5.js";
import { c as createPaymentLink } from "./paymentLinks-BlbKzDwi.js";
import { v as ChevronLeft, a3 as Globe } from "./utils-vendor-B--1aD6k.js";
import "./ui-vendor-DsSOT9J9.js";
function CreateInternationalLink() {
  const navigate = useNavigate();
  const { collectionCurrency: sharedCurrency } = useCollectionCurrency();
  const [amount, setAmount] = reactExports.useState("");
  const [productName, setProductName] = reactExports.useState("");
  const [currency, setCurrency] = reactExports.useState(sharedCurrency || "PHP");
  const [payor, setPayor] = reactExports.useState("");
  const [orderNo, setOrderNo] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState("");
  reactExports.useEffect(() => {
    setCurrency(sharedCurrency || "PHP");
  }, [sharedCurrency]);
  const handleGenerate = async () => {
    var _a;
    const numericAmount = Number(amount.replace(/[^0-9.]/g, ""));
    if (!amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (!productName.trim()) {
      setError("Please enter a product name.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const reference_id = (orderNo == null ? void 0 : orderNo.trim()) || `MAG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const payload = {
        amount: numericAmount,
        currency,
        product_name: productName.trim(),
        reference_id,
        customer_name: payor.trim() || void 0,
        payment_method_types: ["alipay", "wechat_pay", "unionpay"]
      };
      const response = await client.post("/api/v1/magpie/qr/checkout/session", payload);
      if (!response.ok || !((_a = response.data) == null ? void 0 : _a.success)) {
        console.error("International link creation failed:", response);
        const data = response.data;
        let errorMessage = "Failed to create international payment link.";
        if (typeof data === "object" && data !== null) {
          errorMessage = data.error || data.message || data.detail || errorMessage;
        } else if (typeof data === "string") {
          errorMessage = data;
        }
        setError(errorMessage);
        return;
      }
      const channelSelectionUrl = response.data.checkout_url;
      const link = createPaymentLink({
        amount: numericAmount,
        currency,
        title: productName.trim(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        payor,
        orderNo: reference_id,
        description: `International Payment (${currency})`,
        paymentUrl: channelSelectionUrl
      });
      ue.success("International payment link generated");
      navigate(`/pay-by-link/details/${link.code}`);
    } catch (err) {
      setError("Unable to create payment link. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Layout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "page-enter", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[12px] text-slate-400 mb-6 font-medium", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-pointer hover:text-slate-600 transition-colors", onClick: () => navigate("/pay-by-link"), children: "Payment links" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-300", children: ">" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-slate-600 font-semibold", children: "International" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => navigate("/pay-by-link"),
          className: "w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all shadow-sm",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { size: 20 })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { size: 22 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight text-slate-900 m-0", children: "Create International Payment Link" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white border border-slate-200 rounded-xl p-8 shadow-sm max-w-[640px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[13px] text-slate-500 mb-10 leading-relaxed font-medium", children: [
        "Generate a branded checkout link for international customers using ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Alipay" }),
        ", ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "WeChat Pay" }),
        ", and ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "UnionPay" }),
        "."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: "Amount" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                value: amount,
                onChange: (e) => setAmount(e.target.value),
                placeholder: "0.00",
                className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: "Currency" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: currency,
                onChange: (e) => setCurrency(e.target.value),
                className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 transition-all appearance-none",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "PHP", children: "PHP (Philippine Peso)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "CNY", children: "CNY (Chinese Yuan)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "KRW", children: "KRW (South Korean Won)" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "USDT", children: "USDT (Tether)" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: "Product / Service Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              value: productName,
              onChange: (e) => setProductName(e.target.value),
              placeholder: "e.g. Consulting Fee",
              className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 transition-all"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: "Reference / Order No" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: orderNo,
                onChange: (e) => setOrderNo(e.target.value),
                placeholder: "Optional",
                className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 transition-all"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[13px] font-semibold text-slate-900 block mb-2", children: "Customer Name" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                value: payor,
                onChange: (e) => setPayor(e.target.value),
                placeholder: "Optional",
                className: "w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-[14px] text-slate-900 outline-none focus:border-blue-500 transition-all"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-4 items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex -space-x-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "Alipay", size: "sm" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PaymentBrandLogo, { brand: "WeChat Pay", size: "sm" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-slate-500 font-medium", children: "Customer will be able to choose between Alipay and WeChat Pay at checkout." })
        ] }),
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-rose-600 mb-2 font-medium", children: error }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pt-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleGenerate,
            disabled: loading,
            className: "bg-[#111111] text-white px-10 py-3.5 rounded-xl font-semibold text-[14px] shadow-lg hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2",
            children: loading ? "Generating..." : "Generate International Link"
          }
        ) })
      ] })
    ] })
  ] }) });
}
export {
  CreateInternationalLink as default
};
