import { resolveBrandLogoPath } from './payment-logo-registry';

export interface KrwBank {
  code: string;
  name: string;
  logo: string;
}

const KRW_BANK_DEFINITIONS = [
  ['KB', 'KB Kookmin Bank'],
  ['SHINHAN', 'Shinhan Bank'],
  ['HANA', 'Hana Bank'],
  ['WOORI', 'Woori Bank'],
  ['NH', 'NH NongHyup Bank'],
  ['IBK', 'IBK'],
  ['KDB', 'KDB Bank'],
  ['SC', 'SC First Bank'],
  ['KAKAO', 'Kakao Bank'],
  ['TOSS', 'Toss Bank'],
] as const;

export const KRW_BANKS: KrwBank[] = KRW_BANK_DEFINITIONS.map(([code, name]) => ({
  code,
  name,
  logo: resolveBrandLogoPath(name),
}));
