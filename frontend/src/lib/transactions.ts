export type TransactionStatus = 'paid' | 'pending' | 'processing' | 'failed' | 'rejected' | 'expired' | 'cancelled' | 'inactive';

const SUCCESS_STATUSES = new Set([
  'paid',
  'complete',
  'completed',
  'success',
  'successful',
  'succeeded',
  'successfully_paid',
  'executed',
  'settled',
]);
const PENDING_STATUSES = new Set([
  'pending',
  'created',
  'unpaid',
  'awaiting_payment',
  'requires_payment_method',
  'requires_confirmation',
]);
const PROCESSING_STATUSES = new Set([
  'processing',
  'in_progress',
  'transferring',
  'approved',
  'authorized',
  'requires_action',
]);

export interface TransactionRecord {
  id: number;
  transaction_type: string;
  external_id?: string | null;
  xendit_id?: string | null;
  amount: number;
  currency?: string | null;
  status: string;
  approval_status?: string | null;
  rejection_reason?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  description?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  sender_name?: string | null;
  sender_bank?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  paid_at?: string | null;
  payment_status?: string | null;
  payment_url?: string | null;
}

function normalizeStatus(status?: string | null): string {
  return String(status || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function getTransactionStatus(
  transaction: Pick<TransactionRecord, 'status' | 'approval_status' | 'paid_at' | 'payment_status'>,
): TransactionStatus {
  const status = normalizeStatus(transaction.status);
  const paymentStatus = normalizeStatus(transaction.payment_status);
  if (
    Boolean(transaction.paid_at)
    || SUCCESS_STATUSES.has(paymentStatus)
    || SUCCESS_STATUSES.has(status)
  ) return 'paid';
  if (status === 'rejected' || paymentStatus === 'rejected') return 'rejected';
  if (PENDING_STATUSES.has(paymentStatus) || PENDING_STATUSES.has(status)) return 'pending';
  if (PROCESSING_STATUSES.has(paymentStatus) || PROCESSING_STATUSES.has(status)) return 'processing';
  if (['failed', 'error', 'declined'].includes(paymentStatus) || ['failed', 'error', 'declined'].includes(status)) return 'failed';
  if (paymentStatus === 'expired' || status === 'expired') return 'expired';
  if (['canceled', 'cancelled'].includes(paymentStatus) || ['canceled', 'cancelled'].includes(status)) return 'cancelled';
  return 'inactive';
}

export function isSuccessfulTransaction(status: string): boolean {
  return status === 'paid' || SUCCESS_STATUSES.has(normalizeStatus(status));
}

export function isPendingTransaction(status: string): boolean {
  const normalized = normalizeStatus(status);
  return PENDING_STATUSES.has(normalized) || PROCESSING_STATUSES.has(normalized);
}

export function getTransactionStatusLabel(
  status: TransactionStatus,
  language: 'en' | 'ko' = 'en',
): string {
  const labels: Record<TransactionStatus, { en: string; ko: string }> = {
    paid: { en: 'Paid', ko: '결제 완료' },
    pending: { en: 'Pending', ko: '대기 중' },
    processing: { en: 'Processing', ko: '처리 중' },
    failed: { en: 'Failed', ko: '실패' },
    rejected: { en: 'Rejected', ko: '거부됨' },
    expired: { en: 'Expired', ko: '만료됨' },
    cancelled: { en: 'Cancelled', ko: '취소됨' },
    inactive: { en: 'Unknown', ko: '알 수 없음' },
  };
  return labels[status][language];
}

export function isAwaitingApproval(transaction: Pick<TransactionRecord, 'approval_status' | 'status' | 'paid_at' | 'payment_status'>): boolean {
  return transaction.approval_status?.trim().toLowerCase() === 'pending'
    && getTransactionStatus(transaction) === 'paid';
}

export function formatTransactionDate(value?: string | null, locale = 'en-PH'): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
}

export function getTransactionTypeLabel(type?: string | null, language: 'en' | 'ko' = 'en'): string {
  const normalizedType = String(type || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const knownLabels: Record<string, { en: string; ko: string }> = {
    invoice: { en: 'Invoice', ko: '인보이스' },
    payment: { en: 'Payment', ko: '결제' },
    qr_code: { en: 'QR payment', ko: 'QR 결제' },
    qrph_payment: { en: 'QR payment', ko: 'QR 결제' },
    qr_code_payment: { en: 'QR payment', ko: 'QR 결제' },
    payment_link: { en: 'Payment link', ko: '결제 링크' },
    bank_deposit: { en: 'Bank deposit', ko: '은행 입금' },
    bank_transfer: { en: 'Bank transfer', ko: '은행 송금' },
    ewallet: { en: 'E-wallet', ko: '전자지갑' },
    wallet_deposit: { en: 'Wallet deposit', ko: '지갑 입금' },
    wallet_topup: { en: 'Wallet top-up', ko: '지갑 충전' },
    usdt_topup: { en: 'USDT top-up', ko: 'USDT 충전' },
    usdt_deposit: { en: 'USDT deposit', ko: 'USDT 입금' },
    swiftpay_qr: { en: 'QR payment', ko: 'QR 결제' },
    swiftpay_checkout: { en: 'Checkout payment', ko: '체크아웃 결제' },
    disbursement: { en: 'Disbursement', ko: '송금' },
    withdrawal: { en: 'Withdrawal', ko: '출금' },
  };
  if (knownLabels[normalizedType]) return knownLabels[normalizedType][language];

  const fallback = normalizedType.replace(/_/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
  return fallback || (language === 'ko' ? '기타 거래' : 'Other transaction');
}
