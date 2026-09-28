const SUCCESS_STATUSES = /* @__PURE__ */ new Set([
  "paid",
  "complete",
  "completed",
  "success",
  "successful",
  "succeeded",
  "successfully_paid",
  "executed",
  "settled"
]);
const PENDING_STATUSES = /* @__PURE__ */ new Set([
  "pending",
  "created",
  "unpaid",
  "awaiting_payment",
  "requires_payment_method",
  "requires_confirmation"
]);
const PROCESSING_STATUSES = /* @__PURE__ */ new Set([
  "processing",
  "in_progress",
  "transferring",
  "approved",
  "authorized",
  "requires_action"
]);
function normalizeStatus(status) {
  return String(status || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}
function getTransactionStatus(transaction) {
  const status = normalizeStatus(transaction.status);
  const paymentStatus = normalizeStatus(transaction.payment_status);
  if (Boolean(transaction.paid_at) || SUCCESS_STATUSES.has(paymentStatus) || SUCCESS_STATUSES.has(status)) return "paid";
  if (status === "rejected" || paymentStatus === "rejected") return "rejected";
  if (PENDING_STATUSES.has(paymentStatus) || PENDING_STATUSES.has(status)) return "pending";
  if (PROCESSING_STATUSES.has(paymentStatus) || PROCESSING_STATUSES.has(status)) return "processing";
  if (["failed", "error", "declined"].includes(paymentStatus) || ["failed", "error", "declined"].includes(status)) return "failed";
  if (paymentStatus === "expired" || status === "expired") return "expired";
  if (["canceled", "cancelled"].includes(paymentStatus) || ["canceled", "cancelled"].includes(status)) return "cancelled";
  return "inactive";
}
function isSuccessfulTransaction(status) {
  return status === "paid" || SUCCESS_STATUSES.has(normalizeStatus(status));
}
function isPendingTransaction(status) {
  const normalized = normalizeStatus(status);
  return PENDING_STATUSES.has(normalized) || PROCESSING_STATUSES.has(normalized);
}
function getTransactionStatusLabel(status, language = "en") {
  const labels = {
    paid: { en: "Paid", ko: "결제 완료", zh: "已付款" },
    pending: { en: "Pending", ko: "대기 중", zh: "待处理" },
    processing: { en: "Processing", ko: "처리 중", zh: "处理中" },
    failed: { en: "Failed", ko: "실패", zh: "失败" },
    rejected: { en: "Rejected", ko: "거부됨", zh: "已拒绝" },
    expired: { en: "Expired", ko: "만료됨", zh: "已过期" },
    cancelled: { en: "Cancelled", ko: "취소됨", zh: "已取消" },
    inactive: { en: "Unknown", ko: "알 수 없음", zh: "未知" }
  };
  return labels[status][language];
}
function isAwaitingApproval(transaction) {
  var _a;
  return ((_a = transaction.approval_status) == null ? void 0 : _a.trim().toLowerCase()) === "pending" && getTransactionStatus(transaction) === "paid";
}
function formatTransactionDate(value, locale = "en-PH") {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}
function getTransactionTypeLabel(type, language = "en") {
  const normalizedType = String(type || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const knownLabels = {
    invoice: { en: "Invoice", ko: "인보이스" },
    payment: { en: "Payment", ko: "결제" },
    qr_code: { en: "QR payment", ko: "QR 결제" },
    qrph_payment: { en: "QR payment", ko: "QR 결제" },
    qr_code_payment: { en: "QR payment", ko: "QR 결제" },
    payment_link: { en: "Payment link", ko: "결제 링크" },
    bank_deposit: { en: "Bank deposit", ko: "은행 입금" },
    bank_transfer: { en: "Bank transfer", ko: "은행 송금" },
    ewallet: { en: "E-wallet", ko: "전자지갑" },
    wallet_deposit: { en: "Wallet deposit", ko: "지갑 입금" },
    wallet_topup: { en: "Wallet top-up", ko: "지갑 충전" },
    usdt_topup: { en: "USDT top-up", ko: "USDT 충전" },
    usdt_deposit: { en: "USDT deposit", ko: "USDT 입금" },
    swiftpay_qr: { en: "QR payment", ko: "QR 결제" },
    swiftpay_checkout: { en: "Checkout payment", ko: "체크아웃 결제" },
    disbursement: { en: "Disbursement", ko: "송금" },
    withdrawal: { en: "Withdrawal", ko: "출금" }
  };
  if (knownLabels[normalizedType]) return knownLabels[normalizedType][language];
  const fallback = normalizedType.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
  return fallback || (language === "ko" ? "기타 거래" : "Other transaction");
}
export {
  getTransactionStatus as a,
  getTransactionStatusLabel as b,
  isSuccessfulTransaction as c,
  isPendingTransaction as d,
  formatTransactionDate as f,
  getTransactionTypeLabel as g,
  isAwaitingApproval as i
};
