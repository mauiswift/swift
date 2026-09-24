import { resolveBrandLogoPath } from './payment-logo-registry';

export interface KrwBank {
  code: string;
  name: string;
  logo: string;
}

export const DEFAULT_KRW_BANK_NAME = 'Bank transfer';

export const KRW_BANK_DEFINITIONS = [
  ['004', 'KB Kookmin Bank', '/logos/kb-kookmin.svg'],
  ['011', 'NH NongHyup Bank', '/logos/nonghyup-bank.svg'],
  ['020', 'Woori Bank', '/logos/woori-bank.svg'],
  ['023', 'SC First Bank', '/logos/sc-first-bank.svg'],
  ['027', 'KEB Hana Bank', '/logos/hana-bank.svg'],
  ['032', 'Busan Bank', ''],
  ['034', 'Gwangju Bank', ''],
  ['035', 'Jeju Bank', ''],
  ['037', 'Jeonbuk Bank', ''],
  ['039', 'Jeongbuk Bank', ''],
  ['040', 'Shinhan Bank', '/logos/shinhan-bank.svg'],
  ['050', 'Jeju Bank', ''],
  ['071', 'Post Office Bank', ''],
  ['081', 'Hana Bank', '/logos/hana-bank.svg'],
  ['088', 'National Bank', ''],
  ['089', 'Bank of Korea', ''],
  ['090', 'NongHyup Bank', '/logos/nonghyup-bank.svg'],
  ['KAKAO', 'Kakao Bank', '/logos/kakao-bank.svg'],
  ['TOSS', 'Toss Bank', '/logos/toss-bank.png'],
  ['KBANK', 'K Bank', ''],
  ['NAVER', 'Naver Bank', ''],
] as const;

export const KRW_BANKS: KrwBank[] = KRW_BANK_DEFINITIONS.map(([code, name, logo]) => ({
  code,
  name,
  logo: logo || resolveBrandLogoPath(name),
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

  return raw || DEFAULT_KRW_BANK_NAME;
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
