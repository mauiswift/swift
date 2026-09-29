import { j as jsxRuntimeExports } from "./query-vendor-DuVr9DAU.js";
import { i as useParams, u as useLocation, h as useSearchParams, a as reactExports } from "./router-vendor-C2eKMart.js";
import { Q as QRCodeSVG } from "./index-wGjaXQdC.js";
import { g as client, b as ue, h as fmtCurrency } from "./index-BWilGeH7.js";
import { s as sanitizeAlipayAppDeepLink, a as sanitizeGcashAppDeepLink } from "./checkoutQr-Dkn_xoTn.js";
import { z as LoaderCircle, J as CircleCheck, aN as Smartphone, n as ArrowRight } from "./utils-vendor-DoKCqRlq.js";
import "./ui-vendor-DsSOT9J9.js";
function GcashPaymentPage() {
  const { identifier } = useParams();
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const isAlipay = pathname.endsWith("/alipay");
  const [transaction, setTransaction] = reactExports.useState(null);
  const [error, setError] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const pollIntervalRef = reactExports.useRef(null);
  const appLaunchTimeoutRef = reactExports.useRef(null);
  const deepLink = reactExports.useMemo(() => {
    const value = searchParams.get("deep_link") || (isAlipay ? searchParams.get("alipay_deep_link") : searchParams.get("gcash_deep_link"));
    return isAlipay ? sanitizeAlipayAppDeepLink(value) : sanitizeGcashAppDeepLink(value);
  }, [isAlipay, searchParams]);
  const qrValue = searchParams.get("qr");
  reactExports.useEffect(() => {
    if (!identifier) {
      setError("Payment ID not found");
      setLoading(false);
      return;
    }
    let active = true;
    const fetchTransaction = async () => {
      try {
        const response = await client.get(`/api/v1/payments/checkout/${encodeURIComponent(identifier)}`);
        if (!response.ok || !response.data) throw new Error("Payment link not found or has expired");
        if (active) setTransaction(response.data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Failed to load payment details");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchTransaction();
    pollIntervalRef.current = setInterval(async () => {
      var _a;
      try {
        const response = await client.get(`/api/v1/payments/checkout/${encodeURIComponent(identifier)}/status`);
        const status2 = String(((_a = response.data) == null ? void 0 : _a.status) || "").toLowerCase();
        if (!active || !status2) return;
        setTransaction((previous) => previous ? { ...previous, status: status2 } : previous);
        if (["paid", "completed", "executed"].includes(status2)) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          ue.success(isAlipay ? "付款已确认！" : "Payment confirmed!");
        } else if (["expired", "cancelled", "failed"].includes(status2)) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        }
      } catch (err) {
        console.error(`${isAlipay ? "Alipay" : "GCash"} payment status polling failed:`, err);
      }
    }, 2e3);
    return () => {
      active = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (appLaunchTimeoutRef.current) clearTimeout(appLaunchTimeoutRef.current);
    };
  }, [identifier, isAlipay]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex min-h-screen items-center justify-center ${isAlipay ? "bg-[#f0f7ff]" : "bg-[#f4f8ff]"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: `h-8 w-8 animate-spin ${isAlipay ? "text-[#1677ff]" : "text-[#1677ff]"}` }) });
  }
  if (error || !transaction) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-[#f4f8ff] px-4 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `max-w-md rounded-3xl bg-white p-8 shadow-xl ${isAlipay ? "border border-[#b9dcff]" : ""}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold text-slate-900", children: isAlipay ? "无法使用支付宝付款" : "GCash payment unavailable" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-slate-500", children: error || (isAlipay ? "无法加载付款详情，请稍后重试。" : "The payment details could not be loaded.") })
    ] }) });
  }
  const status = transaction.status.toLowerCase();
  const isPaid = ["paid", "completed", "executed"].includes(status);
  const isClosed = isPaid || ["expired", "cancelled", "failed"].includes(status);
  const qrAppLink = !isAlipay && qrValue && !/^https?:\/\//i.test(qrValue) ? buildGcashDeepLink(qrValue, transaction) : null;
  const appPaymentLink = deepLink || qrAppLink;
  const alipayCopy = {
    eyebrow: "支付宝付款",
    amount: "待支付金额",
    confirmed: "付款已确认",
    open: "打开支付宝",
    orScan: "或使用支付宝扫码付款",
    unavailable: "二维码暂不可用，请点击上方按钮继续付款。",
    instruction: "请使用支付宝扫描下方二维码完成付款。"
  };
  const openPaymentApp = () => {
    if (!appPaymentLink) return;
    window.location.assign(appPaymentLink);
    if (appLaunchTimeoutRef.current) clearTimeout(appLaunchTimeoutRef.current);
    appLaunchTimeoutRef.current = setTimeout(() => {
      ue.info(isAlipay ? "支付宝未打开，请扫描下方二维码继续付款。" : "GCash app did not open. Scan the QR code below to continue.");
    }, 1800);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: `min-h-screen px-4 py-6 text-slate-900 sm:py-10 ${isAlipay ? "bg-[#f0f7ff]" : "bg-[#f5f8fc]"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-[430px]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: `overflow-hidden rounded-[24px] border bg-white ${isAlipay ? "border-[#b9dcff] shadow-[0_18px_50px_rgba(22,119,255,0.18)]" : "border-slate-200 shadow-[0_18px_50px_rgba(30,64,120,0.12)]"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex flex-col items-center px-6 py-7 text-center text-white sm:px-8 ${isAlipay ? "bg-gradient-to-br from-[#1677ff] via-[#1677ff] to-[#00a0e9]" : "bg-[#007dff]"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: isAlipay ? "/logos/alipay.png" : "/logos/gcash.png", alt: isAlipay ? "Alipay" : "GCash", className: "h-10 w-auto object-contain brightness-0 invert" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-[11px] font-bold tracking-[0.2em] text-blue-100", children: isAlipay ? alipayCopy.eyebrow : "Pay with GCash" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 text-2xl font-bold tracking-tight", children: transaction.merchant_name || "Payment" }),
      transaction.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-blue-100", children: transaction.description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 p-6 sm:p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-2xl px-5 py-4 ${isAlipay ? "border border-[#b9dcff] bg-[#edf6ff]" : "border border-blue-100 bg-blue-50/60"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold tracking-widest text-slate-500", children: isAlipay ? alipayCopy.amount : "Amount to pay" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-3xl font-bold tracking-tight text-slate-900", children: fmtCurrency(transaction.amount, transaction.currency) })
      ] }),
      isPaid ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-2xl p-5 text-center ${isAlipay ? "bg-[#e8f3ff] text-[#1677ff]" : "bg-emerald-50 text-emerald-700"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mx-auto h-10 w-10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 font-semibold", children: isAlipay ? alipayCopy.confirmed : "Payment confirmed" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        appPaymentLink && !isClosed && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: openPaymentApp,
            "aria-label": isAlipay ? "Open Alipay" : "Open GCash App",
            className: `flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${isAlipay ? "bg-[#1677ff] shadow-[0_8px_20px_rgba(22,119,255,0.28)] hover:bg-[#0f6fee] focus-visible:ring-[#1677ff]" : "bg-[#007dff] shadow-[0_8px_20px_rgba(0,125,255,0.25)] hover:bg-[#006fe6] focus-visible:ring-[#007dff]"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Smartphone, { className: "h-5 w-5" }),
              isAlipay ? alipayCopy.open : "Open GCash App",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-slate-400", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-px flex-1 bg-slate-200" }),
          isAlipay ? alipayCopy.orScan : "Or scan to pay",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-px flex-1 bg-slate-200" })
        ] }),
        qrValue ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center rounded-2xl border border-slate-200 bg-white p-5", children: /^https?:\/\/.*\.(?:png|jpe?g|webp)(?:[?#].*)?$/i.test(qrValue) || /^https:\/\/gcash/i.test(qrValue) ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: qrValue, alt: `${isAlipay ? "Alipay" : "GCash"} payment QR code`, className: "h-64 w-64 object-contain" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(QRCodeSVG, { value: qrValue, size: 256, level: "M", includeMargin: true, className: "h-auto max-w-full" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `rounded-2xl p-4 text-center text-sm ${isAlipay ? "bg-[#edf6ff] text-[#1455a0]" : "bg-amber-50 text-amber-800"}`, children: isAlipay ? alipayCopy.unavailable : "QR code is unavailable. Use the GCash button above to continue." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `text-center text-xs leading-5 ${isAlipay ? "text-[#1455a0]" : "text-slate-500"}`, children: isAlipay ? alipayCopy.instruction : "Open the GCash app to approve this payment, or scan the QR code using GCash." })
      ] })
    ] })
  ] }) }) });
}
function buildGcashDeepLink(qrCode, transaction) {
  const params = new URLSearchParams({
    qrCode,
    orderAmount: Number(transaction.amount).toFixed(2),
    merchantName: transaction.merchant_name || "Payment",
    qrCodeFormat: "EMVCO",
    sub: "p2mpay"
  });
  return `gcash://com.mynt.gcash/app/006300000800?${params.toString()}`;
}
export {
  GcashPaymentPage as default
};
