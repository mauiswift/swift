export interface ApprovalPaymentStatusRecord {
  status: string;
  payment_status?: string | null;
  approval_status?: string | null;
  payment_received?: boolean;
}

const RECEIVED_PAYMENT_STATUSES = new Set([
  'paid',
  'completed',
  'complete',
  'success',
  'successful',
  'succeeded',
  'successfully_paid',
  'executed',
  'settled',
]);

export function isApprovalPaymentReceived(payment: ApprovalPaymentStatusRecord): boolean {
  const status = String(payment.payment_status || payment.status || '').trim().toLowerCase();
  return Boolean(payment.payment_received) || RECEIVED_PAYMENT_STATUSES.has(status);
}
