import { g as getTransactionTypeLabel } from "./transactions-iCGOaGQ5.js";
const PAYMENT_METHOD_LABELS = {
  alipay: "Alipay",
  bank_transfer: "Bank transfer",
  card: "Card",
  gcash: "GCash",
  qrph: "QRPH",
  swiftpay: "SwiftPay",
  wechat: "WeChat Pay",
  wechatpay: "WeChat Pay"
};
const TRANSACTION_TYPE_METHODS = {
  alipay_qr: "Alipay",
  gcash_qr: "GCash",
  qrph_payment: "QRPH",
  swiftpay_qr: "QRPH",
  wechat_qr: "WeChat Pay"
};
const normalizePaymentMethod = (value) => value.trim().toLowerCase().replace(/[\s-]+/g, "_");
function getTransactionPaymentMethodBrand(transaction) {
  var _a;
  const selectedMethod = (_a = transaction.payment_method) == null ? void 0 : _a.trim();
  if (selectedMethod) {
    const normalizedMethod = normalizePaymentMethod(selectedMethod);
    return PAYMENT_METHOD_LABELS[normalizedMethod] || selectedMethod;
  }
  const normalizedType = normalizePaymentMethod(transaction.transaction_type || "");
  return TRANSACTION_TYPE_METHODS[normalizedType] || getTransactionTypeLabel(transaction.transaction_type);
}
export {
  getTransactionPaymentMethodBrand as g
};
