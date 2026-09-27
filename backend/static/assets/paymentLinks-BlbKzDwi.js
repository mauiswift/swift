const PAID_PAYMENT_STATUSES = /* @__PURE__ */ new Set(["paid", "completed", "executed", "success", "succeeded"]);
const PENDING_PAYMENT_STATUSES = /* @__PURE__ */ new Set(["pending", "processing", "created", "in_progress", "in-progress"]);
function normalizePaymentStatus(status) {
  const normalized = String(status || "pending").trim().toLowerCase();
  if (PAID_PAYMENT_STATUSES.has(normalized)) return "paid";
  if (PENDING_PAYMENT_STATUSES.has(normalized)) return "pending";
  return "failed";
}
function getPaymentStatusLabel(status) {
  const normalized = String(status || "pending").trim().toLowerCase();
  if (normalizePaymentStatus(normalized) === "paid") return "Paid";
  if (normalizePaymentStatus(normalized) === "pending") return "Pending";
  return normalized.replace(/[_-]+/g, " ") || "Failed";
}
const STORAGE_KEY = "swiftpay_payment_links";
const defaultLinks = [
  {
    code: "E3Z4",
    amount: 100,
    currency: "PHP",
    title: "try",
    status: "Active",
    created: "Jul 19 2026, 2:49 pm",
    validUntil: "Jul 21 2026, 11:59 pm",
    description: "-",
    orderNo: "-",
    payor: "-"
  },
  {
    code: "E3H6",
    amount: 100,
    currency: "PHP",
    title: "TEST",
    status: "Inactive",
    created: "Jul 16 2026, 10:30 pm",
    validUntil: "Jul 21 2026, 11:59 pm",
    description: "-",
    orderNo: "-",
    payor: "-"
  }
];
function parseLinks(value) {
  if (!value) {
    return defaultLinks;
  }
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return defaultLinks;
    }
    return parsed.map((link) => {
      var _a;
      return {
        ...defaultLinks[0],
        ...link,
        currency: ((_a = link.currency) == null ? void 0 : _a.toUpperCase()) || "PHP"
      };
    });
  } catch {
    return defaultLinks;
  }
}
function getAllPaymentLinks() {
  if (typeof window === "undefined") {
    return defaultLinks;
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  return parseLinks(stored);
}
function getPaymentLink(code) {
  if (typeof window === "undefined") {
    return defaultLinks.find((link) => link.code === code);
  }
  const links = getAllPaymentLinks();
  return links.find((link) => link.code === code) ?? null;
}
function getIdentifiedPaymentLinkUrl(link, origin) {
  const rawUrl = link.paymentUrl || (link.externalId ? `${origin}/checkout/${encodeURIComponent(link.externalId)}` : "");
  if (!rawUrl) return rawUrl;
  const url = new URL(rawUrl, origin);
  const currency = link.currency.toUpperCase();
  const isCheckoutPath = url.pathname.startsWith("/checkout/");
  const isSwiftPayHost = ["swiftpay.site", "kr.swiftpay.site"].includes(url.hostname);
  if (isCheckoutPath && (url.hostname === new URL(origin).hostname || isSwiftPayHost)) {
    const originUrl = new URL(origin);
    const isLocal = ["localhost", "127.0.0.1"].includes(originUrl.hostname);
    if (!isLocal) {
      url.protocol = originUrl.protocol;
      url.host = "kr.swiftpay.site";
    }
  }
  if (isCheckoutPath) url.searchParams.set("currency", currency);
  return url.toString();
}
function savePaymentLinks(links) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}
function updatePaymentLink(code, patch) {
  const links = getAllPaymentLinks();
  const updatedLinks = links.map(
    (link) => link.code === code ? { ...link, ...patch } : link
  );
  savePaymentLinks(updatedLinks);
  return updatedLinks.find((link) => link.code === code) ?? null;
}
function togglePaymentLinkStatus(code) {
  const link = getPaymentLink(code);
  if (!link) {
    return null;
  }
  const updated = updatePaymentLink(code, {
    status: link.status === "Active" ? "Inactive" : "Active"
  });
  return updated;
}
function generateUniqueCode(existingCodes) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  do {
    code = Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (existingCodes.includes(code));
  return code;
}
function createPaymentLink(payload) {
  var _a, _b, _c;
  const existingLinks = getAllPaymentLinks();
  const code = payload.code || generateUniqueCode(existingLinks.map((link2) => link2.code));
  const now = /* @__PURE__ */ new Date();
  const created = now.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
  const link = {
    code,
    amount: payload.amount,
    currency: payload.currency.toUpperCase(),
    title: payload.title,
    status: "Active",
    created,
    validUntil: payload.validUntil,
    description: ((_a = payload.description) == null ? void 0 : _a.trim()) || "-",
    orderNo: ((_b = payload.orderNo) == null ? void 0 : _b.trim()) || "-",
    payor: ((_c = payload.payor) == null ? void 0 : _c.trim()) || "-",
    provider: payload.provider,
    externalId: payload.externalId,
    paymentStatus: "pending",
    paymentUrl: payload.paymentUrl,
    qrCodeUrl: payload.qrCodeUrl,
    bankAccountDetails: payload.bankAccountDetails
  };
  savePaymentLinks([link, ...existingLinks]);
  return link;
}
export {
  getIdentifiedPaymentLinkUrl as a,
  getPaymentLink as b,
  createPaymentLink as c,
  getPaymentStatusLabel as d,
  getAllPaymentLinks as g,
  normalizePaymentStatus as n,
  togglePaymentLinkStatus as t,
  updatePaymentLink as u
};
