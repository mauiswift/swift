import { describe, expect, it } from 'vitest';
import { filterVisiblePaymentApprovals, KRW_PAYMENT_APPROVER_ID } from './paymentApprovalAccess';

describe('payment approval visibility', () => {
  const payments = [
    { id: 'php', currency: 'PHP', processing_currency: 'PHP' },
    { id: 'krw', currency: 'KRW', processing_currency: 'KRW' },
    { id: 'converted', currency: 'PHP', processing_currency: 'KRW' },
  ];

  it('hides KRW payments from other reviewers', () => {
    expect(filterVisiblePaymentApprovals('other-reviewer', payments)).toEqual([payments[0]]);
  });

  it('shows KRW payments only to the designated approver', () => {
    expect(filterVisiblePaymentApprovals(KRW_PAYMENT_APPROVER_ID, payments)).toEqual(payments);
  });
});