import { resolveBrandLogoPath } from './payment-logo-registry';

export interface KrwBank {
  code: string;
  name: string;
  logo: string;
}

export const DEFAULT_KRW_BANK_NAME = 'Kakao Bank';

export const KRW_BANK_DEFINITIONS = [
  ['KB', 'KB Kookmin Bank'],
  ['SHINHAN', 'Shinhan Bank'],
  ['HANA', 'Hana Bank'],
  ['WOORI', 'Woori Bank'],
  ['NH', 'NH NongHyup Bank'],
  ['IBK', 'IBK'],
  ['KDB', 'KDB Bank'],
  ['SC', 'SC First Bank'],
  ['K', 'K Bank'],
  ['KAKAO', 'Kakao Bank'],
  ['NAVER', 'Naver Bank'],
  ['TOSS', 'Toss Bank'],
] as const;

export const KRW_BANKS: KrwBank[] = KRW_BANK_DEFINITIONS.map(([code, name]) => ({
  code,
  name,
  logo: resolveBrandLogoPath(name),
}));

export const KRW_BANK_BY_CODE = new Map(
  KRW_BANKS.map(bank => [bank.code.toUpperCase(), bank]),
);

export const normalizeKrwBankName = (value?: string | null): string => {
  const raw = String(value ?? '').trim();
  if (!raw) return DEFAULT_KRW_BANK_NAME;

  const directMatch = KRW_BANKS.find(bank =>
    bank.name.toLowerCase() === raw.toLowerCase()
    || bank.code.toLowerCase() === raw.toLowerCase()
  );
  if (directMatch) return directMatch.name;

  const normalized = raw.toUpperCase();
  if (normalized.includes('KAKAO')) return 'Kakao Bank';
  if (normalized.includes('TOSS')) return 'Toss Bank';
  if (normalized.includes('K BANK') || normalized.includes('KBANK')) return 'K Bank';
  if (normalized.includes('NAVER')) return 'Naver Bank';

  return raw;
};

export const isSupportedKrwBank = (value?: string | null): boolean => {
  const raw = String(value ?? '').trim();
  if (!raw) return false;

  const normalized = raw.toUpperCase();
  return KRW_BANKS.some(bank =>
    bank.code.toUpperCase() === normalized
    || bank.name.toUpperCase() === normalized
    || normalized.includes(bank.code.toUpperCase())
    || normalized.includes(bank.name.toUpperCase().replace(/\s+/g, ''))
  );
};
