import { describe, expect, it, vi } from 'vitest';
import { KRW_BANKS, normalizeKrwBankName } from '@/config/krw-banks';

const originalFetch = globalThis.fetch;
const windowMock = {
  fetch: originalFetch ?? (async () => new Response('{}', { status: 200 })),
  location: { pathname: '/' },
};

globalThis.window = windowMock as any;
if (!globalThis.fetch) {
  globalThis.fetch = windowMock.fetch as typeof fetch;
}

const { isPaymentChannelEnabled } = await import('./paymentChannels');

describe('isPaymentChannelEnabled', () => {
  it('normalizes USD aliases to the supported USDT channel config', () => {
    const channels = {
      USDT: {
        checkout: ['bank_transfer', 'virtual_account'],
        withdrawal: [],
        disbursement: [],
      },
    } as any;

    expect(isPaymentChannelEnabled(channels, 'USD', 'checkout', 'bank_transfer')).toBe(true);
    expect(isPaymentChannelEnabled(channels, 'USDT', 'checkout', 'virtual_account')).toBe(true);
  });

  it('keeps KRW checkout isolated from USD config keys', () => {
    const channels = {
      KRW: {
        checkout: ['virtual_account'],
        withdrawal: [],
        disbursement: [],
      },
      USD: {
        checkout: ['bank_transfer'],
        withdrawal: [],
        disbursement: [],
      },
    } as any;

    expect(isPaymentChannelEnabled(channels, 'KRW', 'checkout', 'virtual_account')).toBe(true);
    expect(isPaymentChannelEnabled(channels, 'KRW', 'checkout', 'bank_transfer')).toBe(false);
  });

  it('includes the Korean bank catalog used by KRW checkout', () => {
    const names = KRW_BANKS.map(bank => bank.name);
    expect(names).toContain('Kakao Bank');
    expect(names).toContain('Toss Bank');
    expect(names).toContain('K Bank');
    expect(names).toContain('Naver Bank');
  });

  it('uses the configured TOSS fallback for empty KRW bank names', () => {
    expect(normalizeKrwBankName('')).toBe('토스페이');
    expect(normalizeKrwBankName(null)).toBe('토스페이');
  });
});
