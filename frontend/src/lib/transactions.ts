export type TransactionStatus = 'paid' | 'completed' | 'executed' | 'pending' | 'processing' | 'failed' | 'expired' | 'cancelled';

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
  payment_url?: string | null;
}

export function getTransactionStatus(transaction: Pick<TransactionRecord, 'status' | 'approval_status'>): TransactionStatus {
  const status = transaction.status.toLowerCase() as TransactionStatus;
  if (transaction.approval_status?.toLowerCase() === 'pending' && ['paid', 'completed'].includes(status)) {
    return 'pending';
  }
  return status;
}

export function isSuccessfulTransaction(status: string): boolean {
  return ['paid', 'completed', 'executed'].includes(status);
}

export function isPendingTransaction(status: string): boolean {
  return ['pending', 'processing'].includes(status);
}

export function formatTransactionDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

export function getTransactionTypeLabel(type: string): string {
  const normalizedType = type.trim().toLowerCase();
  const knownLabels: Record<string, string> = {
    invoice: 'Invoice',
    qr_code: 'QR Code',
    qrph_payment: 'QR Payment',
    payment_link: 'Payment Link',
    bank_deposit: 'Bank Deposit',
    ewallet: 'E-wallet',
  };
  if (knownLabels[normalizedType]) return knownLabels[normalizedType];

  return type
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}
