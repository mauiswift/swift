export interface ApprovalPaymentStatusRecord {
  status: string;
  payment_status?: string | null;
}

export function getApprovalPaymentStatus(payment: ApprovalPaymentStatusRecord): string {
  return String(payment.payment_status || payment.status || '').trim().toLowerCase() || 'unknown';
}
