export const KRW_PAYMENT_APPROVER_ID = '7851923260';

type PaymentCurrency = {
  currency?: string | null;
  processing_currency?: string | null;
};

export function filterVisiblePaymentApprovals<T extends PaymentCurrency>(
  userId: string | undefined,
  payments: T[],
): T[] {
  if (userId === KRW_PAYMENT_APPROVER_ID) return payments;

  return payments.filter((payment) =>
    [payment.currency, payment.processing_currency].every(
      (currency) => currency?.trim().toUpperCase() !== 'KRW',
    ),
  );
}