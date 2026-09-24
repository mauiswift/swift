import { resolveBrandLogoPath } from './payment-logo-registry';

export interface KrwBank {
  code: string;
  name: string;
  logo: string;
}

export const DEFAULT_KRW_BANK_NAME = 'Bank transfer';

export const KRW_BANK_DEFINITIONS = [
  ['002', 'KDB Bank', '/logos/kdb-bank.png'],
  ['003', 'IBK Industrial Bank of Korea', '/logos/ibk-bank.svg'],
  ['004', 'KB Kookmin Bank', '/logos/kb-kookmin.svg'],
  ['011', 'NH NongHyup Bank', '/logos/nonghyup-bank.svg'],
  ['020', 'Woori Bank', '/logos/woori-bank.svg'],
  ['023', 'SC First Bank', '/logos/sc-first-bank.svg'],
  ['027', 'Citi Bank Korea', ''],
  ['031', 'Daegu Bank', ''],
  ['032', 'Busan Bank', ''],
  ['034', 'Gwangju Bank', ''],
  ['035', 'Jeju Bank', ''],
  ['037', 'Jeonbuk Bank', ''],
  ['039', 'Kyongnam Bank', ''],
  ['045', 'Korea Federation of Community Credit Cooperatives', ''],
  ['048', 'Korea Credit Union', ''],
  ['071', 'Post Office Bank', ''],
  ['081', 'Hana Bank', '/logos/hana-bank.svg'],
  ['088', 'Shinhan Bank', '/logos/shinhan-bank.svg'],
  ['089', 'K Bank', ''],
  ['090', 'Kakao Bank', '/logos/kakao-bank.svg'],
  ['092', 'Toss Bank', '/logos/toss-bank.png'],
] as const;

const KRW_BANK_CODE_ALIASES: Record<string, string> = {
  KAKAO: '090',
  TOSS: '092',
  KBANK: '089',
};

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
  const aliasedCode = KRW_BANK_CODE_ALIASES[raw.toUpperCase()];

  const directMatch = KRW_BANKS.find(bank =>
    bank.name.toLowerCase() === raw.toLowerCase()
    || bank.code.toLowerCase() === (aliasedCode || raw).toLowerCase()
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
  const aliasedCode = KRW_BANK_CODE_ALIASES[normalized];
  return KRW_BANKS.some(bank =>
    bank.code.toUpperCase() === (aliasedCode || normalized)
    || bank.name.toUpperCase() === normalized
    || normalized.includes(bank.code.toUpperCase())
    || normalized.includes(bank.name.toUpperCase().replace(/\s+/g, ''))
  );
};
