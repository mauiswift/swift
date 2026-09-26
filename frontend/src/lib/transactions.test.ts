import { describe, expect, it } from 'vitest';
import {
  formatTransactionDate,
  getTransactionStatusLabel,
  getTransactionStatus,
  getTransactionTypeLabel,
  isAwaitingApproval,
  isPendingTransaction,
  isSuccessfulTransaction,
} from './transactions';

describe('transaction display normalization', () => {
  it.each(['success', 'successful', 'succeeded', 'successfully_paid', 'settled'])(
    'normalizes provider success status %s',
    status => {
      expect(getTransactionStatus({ status, approval_status: 'approved' })).toBe('paid');
    },
  );

  it('shows receipt separately while a payment awaits admin approval', () => {
    const transaction = { status: 'pending', approval_status: 'pending', paid_at: '2026-09-26T14:39:28Z' };
    expect(getTransactionStatus(transaction)).toBe('paid');
    expect(isAwaitingApproval(transaction)).toBe(true);
    expect(getTransactionStatusLabel('paid', 'en')).toBe('Paid');
    expect(getTransactionStatusLabel('paid', 'ko')).toBe('결제 완료');
  });

  it('keeps payment outcome separate from an admin rejection', () => {
    const transaction = { status: 'pending', approval_status: 'rejected', paid_at: '2026-09-26T14:39:28Z' };
    expect(getTransactionStatus(transaction)).toBe('paid');
    expect(isAwaitingApproval(transaction)).toBe(false);
  });

  it('normalizes common pending and terminal aliases distinctly', () => {
    expect(getTransactionStatus({ status: 'awaiting-payment' })).toBe('pending');
    expect(getTransactionStatus({ status: 'canceled' })).toBe('cancelled');
    expect(getTransactionStatus({ status: 'rejected' })).toBe('rejected');
    expect(getTransactionStatus({ status: 'expired' })).toBe('expired');
    expect(getTransactionStatus({ status: 'declined' })).toBe('failed');
    expect(getTransactionStatus({ status: 'unrecognized-status' })).toBe('inactive');
  });

  it('recognizes normalized status groups', () => {
    expect(isSuccessfulTransaction('successfully_paid')).toBe(true);
    expect(isPendingTransaction('in-progress')).toBe(true);
  });

  it('provides consistent localized transaction type labels', () => {
    expect(getTransactionTypeLabel('swiftpay_qr', 'en')).toBe('QR payment');
    expect(getTransactionTypeLabel('swiftpay_qr', 'ko')).toBe('QR 결제');
    expect(getTransactionTypeLabel('unknown_type', 'en')).toBe('Unknown Type');
    expect(getTransactionTypeLabel(null, 'ko')).toBe('기타 거래');
  });

  it('uses a caller-selected locale for transaction dates', () => {
    expect(formatTransactionDate('invalid-date', 'ko-KR')).toBe('—');
    expect(formatTransactionDate('2026-09-26T00:00:00Z', 'ko-KR')).not.toBe('—');
  });
});
