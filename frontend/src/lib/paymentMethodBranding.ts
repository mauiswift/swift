import { getTransactionTypeLabel, type TransactionRecord } from '@/lib/transactions';

type TransactionPaymentMethod = Pick<TransactionRecord, 'transaction_type'> & {
  payment_method?: string | null;
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  alipay: 'Alipay',
  bank_transfer: 'Bank transfer',
  card: 'Card',
  gcash: 'GCash',
  qrph: 'QRPH',
  swiftpay: 'SwiftPay',
  wechat: 'WeChat Pay',
  wechatpay: 'WeChat Pay',
};

const TRANSACTION_TYPE_METHODS: Record<string, string> = {
  alipay_qr: 'Alipay',
  gcash_qr: 'GCash',
  qrph_payment: 'QRPH',
  swiftpay_qr: 'QRPH',
  wechat_qr: 'WeChat Pay',
};

const normalizePaymentMethod = (value: string): string => value.trim().toLowerCase().replace(/[\s-]+/g, '_');

export function getTransactionPaymentMethodBrand(transaction: TransactionPaymentMethod): string {
  const selectedMethod = transaction.payment_method?.trim();
  if (selectedMethod) {
    const normalizedMethod = normalizePaymentMethod(selectedMethod);
    return PAYMENT_METHOD_LABELS[normalizedMethod] || selectedMethod;
  }

  const normalizedType = normalizePaymentMethod(transaction.transaction_type || '');
  return TRANSACTION_TYPE_METHODS[normalizedType]
    || getTransactionTypeLabel(transaction.transaction_type);
}
