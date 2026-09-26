import { describe, expect, it, vi } from 'vitest';
import { KRW_BANKS, normalizeKrwBankName } from '@/config/krw-banks';
import { resolveBrandLogoPath } from '@/config/payment-logo-registry';

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
    expect(normalizeKrwBankName('')).toBe('Toss Bank');
    expect(normalizeKrwBankName(null)).toBe('Toss Bank');
  });

  it('keeps Toss Bank separate from Toss Pay branding', () => {
    expect(normalizeKrwBankName('Toss Bank')).toBe('Toss Bank');
    expect(normalizeKrwBankName('토스뱅크')).toBe('Toss Bank');
    expect(normalizeKrwBankName('토스페이')).toBe('Toss Bank');
    expect(resolveBrandLogoPath('Toss Bank')).toBe('/logos/toss-bank.png');
    expect(resolveBrandLogoPath('토스페이')).toBe('/logos/tosspay.png');
  });

  it('does not mistake K Bank for KB Kookmin Bank', () => {
    expect(resolveBrandLogoPath('K Bank')).toBe('');
    expect(resolveBrandLogoPath('KB Kookmin Bank')).toBe('/logos/kb-kookmin.svg');
  });
});
