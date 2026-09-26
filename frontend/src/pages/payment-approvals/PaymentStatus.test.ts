import { describe, expect, it } from 'vitest';
import { isApprovalPaymentReceived } from '@/lib/paymentApprovalStatus';

describe('approval payment status', () => {
  it('shows a received payment as paid when local status is still pending approval', () => {
    expect(isApprovalPaymentReceived({
      status: 'pending',
      payment_status: 'pending',
      approval_status: 'pending',
      payment_received: true,
    })).toBe(true);
  });

  it('shows an unpaid pending payment as awaiting payment', () => {
    expect(isApprovalPaymentReceived({
      status: 'pending',
      payment_status: 'pending',
      approval_status: 'pending',
      payment_received: false,
    })).toBe(false);
  });
});
