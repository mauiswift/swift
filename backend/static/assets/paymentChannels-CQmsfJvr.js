import { i as client } from "./index-CpEIrYHf.js";
const SUPPORTED_PAYMENT_CHANNEL_CURRENCIES = /* @__PURE__ */ new Set(["PHP", "CNY", "KRW", "USDT"]);
const CHECKOUT_CHANNEL_BRANDS = {
  gcash: "GCash",
  maya: "Maya",
  grabpay: "GrabPay",
  bank_transfer: "Bank transfer",
  virtual_account: "SwiftPay Virtual Account",
  alipay: "Alipay",
  wechat: "WeChat Pay",
  unionpay: "UnionPay",
  card: "Card"
};
const normalizePaymentChannelCurrency = (currency) => {
  const normalized = String(currency ?? "PHP").trim().toUpperCase();
  const aliasMap = { USD: "USDT", USDC: "USDT" };
  const key = aliasMap[normalized] ?? normalized;
  return SUPPORTED_PAYMENT_CHANNEL_CURRENCIES.has(key) ? key : null;
};
const sanitizePaymentChannels = (channels) => {
  if (!channels || typeof channels !== "object") return null;
  const sanitized = Object.entries(channels).reduce((acc, [currency, config]) => {
    const normalizedCurrency = normalizePaymentChannelCurrency(currency);
    if (!normalizedCurrency || !config || typeof config !== "object") return acc;
    const nextConfig = {};
    for (const flow of ["checkout", "withdrawal", "disbursement"]) {
      const value = config[flow];
      nextConfig[flow] = Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
    }
    const institutions = config.checkout_institutions;
    if (Array.isArray(institutions)) {
      nextConfig.checkout_institutions = institutions.filter((item) => typeof item === "string").map((item) => item.trim().toUpperCase());
    }
    acc[normalizedCurrency] = nextConfig;
    return acc;
  }, {});
  return Object.keys(sanitized).length > 0 ? sanitized : null;
};
async function fetchPaymentChannels() {
  var _a;
  const response = await client.get("/api/v1/app-settings/payment-channels");
  if (!response.ok || !((_a = response.data) == null ? void 0 : _a.channels)) return null;
  return sanitizePaymentChannels(response.data.channels);
}
function isPaymentChannelEnabled(channels, currency, flow, channel) {
  var _a;
  if (!channels) return false;
  const normalizedCurrency = normalizePaymentChannelCurrency(currency);
  if (!normalizedCurrency) return false;
  const flowChannels = (_a = channels[normalizedCurrency]) == null ? void 0 : _a[flow];
  return Array.isArray(flowChannels) ? flowChannels.includes(channel) : false;
}
function getCheckoutPaymentBrands(channels, currency) {
  var _a;
  const normalizedCurrency = normalizePaymentChannelCurrency(currency);
  if (!channels || !normalizedCurrency) return [];
  const checkoutChannels = (_a = channels[normalizedCurrency]) == null ? void 0 : _a.checkout;
  if (!Array.isArray(checkoutChannels)) return [];
  return [...new Set(checkoutChannels.map((channel) => {
    const normalizedChannel = channel.trim().toLowerCase();
    if (normalizedChannel === "qr_code") return normalizedCurrency === "PHP" ? "QRPH" : void 0;
    return CHECKOUT_CHANNEL_BRANDS[normalizedChannel];
  }).filter((brand) => Boolean(brand)))];
}
export {
  fetchPaymentChannels as f,
  getCheckoutPaymentBrands as g,
  isPaymentChannelEnabled as i
};
