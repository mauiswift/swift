import { describe, expect, it } from 'vitest';
import {
  formatTransactionDate,
  getTransactionStatus,
  getTransactionTypeLabel,
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

  it('keeps provider-confirmed payments pending admin approval', () => {
    expect(getTransactionStatus({ status: 'succeeded', approval_status: 'pending' })).toBe('pending');
  });

  it('normalizes common pending and failure aliases', () => {
    expect(getTransactionStatus({ status: 'awaiting-payment' })).toBe('pending');
    expect(getTransactionStatus({ status: 'canceled' })).toBe('cancelled');
    expect(getTransactionStatus({ status: 'rejected' })).toBe('failed');
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
