import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { KRW_BANKS, normalizeKrwBankName } from '@/config/krw-banks';
import { PH_BANKS } from '@/config/ph-banks';
import { BANK_LOGO_ALIASES, getBrandLogoCandidates, normalizeBrandKey, resolveBrandLogoPath } from '@/config/payment-logo-registry';
import { getBankLogo } from './bankBranding';
import type { PaymentChannels } from './paymentChannels';

const originalFetch = globalThis.fetch;
const windowMock = {
  fetch: originalFetch ?? (async () => new Response('{}', { status: 200 })),
  location: { pathname: '/' },
};

globalThis.window = windowMock as any;
if (!globalThis.fetch) {
  globalThis.fetch = windowMock.fetch as typeof fetch;
}

const { getCheckoutPaymentBrands, isPaymentChannelEnabled } = await import('./paymentChannels');

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

  it('includes the Korean banks present in the KRW bank catalog', () => {
    const names = KRW_BANKS.map(bank => bank.name);
    expect(names).toContain('Kakao Bank');
    expect(names).toContain('Toss Bank');
    expect(names).toContain('K Bank');
  });

  it('uses the configured TOSS fallback for empty KRW bank names', () => {
    expect(normalizeKrwBankName('')).toBe('Toss Bank');
    expect(normalizeKrwBankName(null)).toBe('Toss Bank');
  });

  it('keeps Toss Bank separate from Toss Pay branding', () => {
    expect(normalizeKrwBankName('Toss Bank')).toBe('Toss Bank');
    expect(normalizeKrwBankName('토스뱅크')).toBe('Toss Bank');
    expect(normalizeKrwBankName('토스페이')).toBe('Toss Pay');
    expect(resolveBrandLogoPath('Toss Bank')).toBe('/logos/toss-bank.png');
    expect(resolveBrandLogoPath('토스페이')).toBe('/logos/tosspay.png');
  });

  it('uses the correct original logos for KDB and Toss Bank', () => {
    expect(resolveBrandLogoPath('KDB Bank')).toBe('/logos/kdb-bank.png');
    expect(KRW_BANKS.find(bank => bank.code === '092')?.logo).toBe('/logos/toss-bank.png');
  });

  it('uses an official logo for every Korean bank by name and bank code', () => {
    for (const bank of KRW_BANKS) {
      expect(bank.logo, bank.name).not.toBe('');
      expect(resolveBrandLogoPath(bank.name), bank.name).toBe(bank.logo);
      expect(resolveBrandLogoPath(bank.code), bank.code).toBe(bank.logo);
    }
  });

  it('does not mistake K Bank for KB Kookmin Bank', () => {
    expect(resolveBrandLogoPath('K Bank')).toBe('/logos/kbank.png');
    expect(resolveBrandLogoPath('KB Kookmin Bank')).toBe('/logos/kb-kookmin.svg');
  });

  it('does not show a parent bank logo for distinct Philippine institutions', () => {
    const bdoNetwork = PH_BANKS.find(bank => bank.code === 'ORNNPHM1XXX');
    const bpiBanKo = PH_BANKS.find(bank => bank.code === 'BPDIPHM1XXX');

    expect(bdoNetwork).toBeDefined();
    expect(bpiBanKo).toBeDefined();
    expect(getBankLogo('BDO Network Bank', 'ORNNPHM1XXX')).toBeUndefined();
    expect(getBankLogo('BPI Direct BanKo A Savings Bank', 'BPDIPHM1XXX')).toBeUndefined();
    expect(getBankLogo('Banco de Oro Unibank Inc (BDO)', 'BNORPHMXXX')).toBe('/logos/bdo.svg');
    expect(getBankLogo('Bank of the Philippine Islands (BPI)', 'BOPIPHMXXX')).toBe('/logos/bpi.svg');
  });

  it('uses exact aliases rather than matching unrelated names by prefix', () => {
    expect(resolveBrandLogoPath('East West Banking Corporation')).toBe('/logos/eastwest-bank.svg');
    expect(resolveBrandLogoPath('East West Rural Bank / Komo')).toBe('');
    expect(resolveBrandLogoPath('BPI Direct BanKo A Savings Bank')).toBe('');
    expect(resolveBrandLogoPath('BDO Network Bank')).toBe('');
  });

  it('has an existing public asset for every registered logo', () => {
    for (const logoPath of Object.keys(BANK_LOGO_ALIASES)) {
      const assetPath = fileURLToPath(new URL(`../../public${logoPath}`, import.meta.url));
      expect(existsSync(assetPath), logoPath).toBe(true);
    }
  });

  it('does not assign a normalized bank alias to multiple logos', () => {
    const aliasOwners = new Map<string, string>();
    for (const [logoPath, aliases] of Object.entries(BANK_LOGO_ALIASES)) {
      for (const alias of aliases) {
        const normalizedAlias = normalizeBrandKey(alias);
        const existingOwner = aliasOwners.get(normalizedAlias);
        expect(existingOwner === undefined || existingOwner === logoPath, normalizedAlias).toBe(true);
        aliasOwners.set(normalizedAlias, logoPath);
      }
    }
  });

  it('prefers the registered official logo before a provider-supplied logo', () => {
    expect(getBrandLogoCandidates('GCash', '/provider/gcash.svg')).toEqual([
      '/logos/gcash.png',
      '/provider/gcash.svg',
    ]);
    expect(getBrandLogoCandidates('GCash', '/logos/gcash.png')).toEqual(['/logos/gcash.png']);
  });

  it('lists only configured checkout methods with branded logos', () => {
    const channels: PaymentChannels = {
      PHP: {
        checkout: ['gcash', 'bank_transfer', 'card', 'qr_code', 'unknown'],
        withdrawal: [],
        disbursement: [],
      },
      CNY: {
        checkout: ['qr_code'],
        withdrawal: [],
        disbursement: [],
      },
    };

    expect(getCheckoutPaymentBrands(channels, 'PHP')).toEqual([
      'GCash',
      'Bank transfer',
      'Card',
      'QRPH',
    ]);
    expect(getCheckoutPaymentBrands(channels, 'CNY')).toEqual([]);
    expect(getCheckoutPaymentBrands(channels, 'KRW')).toEqual([]);
    expect(getCheckoutPaymentBrands(null, 'PHP')).toEqual([]);
  });
});
