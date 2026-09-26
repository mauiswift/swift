import { describe, expect, it } from 'vitest';
import { getApprovalPaymentStatus } from '@/lib/paymentApprovalStatus';

describe('approval payment status', () => {
  it('uses the actual payment status instead of the transaction or review status', () => {
    expect(getApprovalPaymentStatus({
      status: 'pending',
      payment_status: 'failed',
    })).toBe('failed');
  });

  it('falls back to the transaction payment status when no separate status is returned', () => {
    expect(getApprovalPaymentStatus({ status: 'pending' })).toBe('pending');
  });

  it('uses unknown when the API returns no payment status', () => {
    expect(getApprovalPaymentStatus({ status: '' })).toBe('unknown');
  });
});
