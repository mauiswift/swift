const normalizeCheckoutQrValue = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim();
};
const sanitizeCheckoutDeepLink = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  if (/^(?:gcash|supertoss):\/\//i.test(trimmed)) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
};
const buildTossQrDeepLink = ({
  baseUrl,
  qrPayload
}) => {
  const base = sanitizeCheckoutDeepLink(baseUrl) || "supertoss://toss/pay";
  const qr = normalizeCheckoutQrValue(qrPayload);
  if (!qr) return base;
  try {
    const parsed = new URL(base);
    parsed.searchParams.set("qr", qr);
    return parsed.toString();
  } catch {
    return base;
  }
};
const sanitizeGcashAppDeepLink = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  return /^gcash:\/\//i.test(trimmed) ? trimmed : null;
};
const sanitizeAlipayAppDeepLink = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  return /^(?:alipays|alipay):\/\//i.test(trimmed) ? trimmed : null;
};
const sanitizeTossDeepLink = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  return /^supertoss:\/\/toss\/pay(?:[/?#]|$)/i.test(trimmed) ? trimmed : null;
};
const resolveCheckoutQrPanelMode = ({
  hasQR,
  hasQrPayload,
  paymentMethod,
  gcashDeepLink
}) => {
  if (!hasQR) return "none";
  const normalizedMethod = String(paymentMethod || "").trim().toLowerCase();
  if (gcashDeepLink) return "gcash";
  if (normalizedMethod === "gcash") return gcashDeepLink || hasQrPayload ? "gcash" : "default";
  if (normalizedMethod === "qrph") return hasQrPayload ? "qrph" : "default";
  if (normalizedMethod === "alipay") return hasQrPayload ? "alipay" : "default";
  return "default";
};
export {
  sanitizeAlipayAppDeepLink as a,
  buildTossQrDeepLink as b,
  sanitizeGcashAppDeepLink as c,
  normalizeCheckoutQrValue as n,
  resolveCheckoutQrPanelMode as r,
  sanitizeTossDeepLink as s
};
