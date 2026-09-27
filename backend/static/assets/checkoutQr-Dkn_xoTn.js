const normalizeCheckoutQrValue = (value) => {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim();
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
  sanitizeGcashAppDeepLink as a,
  normalizeCheckoutQrValue as n,
  resolveCheckoutQrPanelMode as r,
  sanitizeAlipayAppDeepLink as s
};
