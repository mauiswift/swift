import { KRW_BANKS } from '@/config/krw-banks';
import { PH_BANKS } from '@/config/ph-banks';
import { normalizeBrandKey, resolveBrandLogoPath } from '@/config/payment-logo-registry';

const BANK_NAME_STOP_WORDS = new Set([
  'bank',
  'banking',
  'corporation',
  'company',
  'inc',
  'incorporated',
  'of',
  'philippines',
  'the',
]);

export function getBankLogo(label: string, code?: string): string | undefined {
  return (resolveBrandLogoPath(code || '') || resolveBrandLogoPath(label)) || undefined;
}

export function getBankDisplayName(label: string): string {
  return label.trim() || 'Receiving bank';
}

export function getBankInitials(label: string, code?: string): string {
  const normalizedLabel = normalizeBrandKey(label);
  const normalizedCode = normalizeBrandKey(code || '');
  const knownBank = [...PH_BANKS, ...KRW_BANKS].find((bank) =>
    normalizeBrandKey(bank.name) === normalizedLabel
    || normalizeBrandKey(bank.code) === normalizedCode
    || (normalizedCode.length >= 6 && normalizeBrandKey(bank.code).startsWith(normalizedCode)),
  );
  const name = knownBank?.name || getBankDisplayName(label);
  const words = name
    .replace(/[()]/g, ' ')
    .split(/[\s/&-]+/)
    .filter(Boolean)
    .filter((word) => !BANK_NAME_STOP_WORDS.has(normalizeBrandKey(word)));
  const initials = words.slice(0, 3).map((word) => word[0]).join('').toUpperCase();

  return (
    initials.length > 1
      ? initials
      : normalizedCode.slice(0, 3) || normalizedLabel.slice(0, 3) || 'BK'
  ).toUpperCase();
}

export function getBankBrandColor(label: string, code?: string): string {
  const key = normalizeBrandKey(code || label) || normalizeBrandKey(label);
  const hash = Array.from(key).reduce((total, character) => total * 31 + character.charCodeAt(0), 0);
  return `hsl(${Math.abs(hash) % 360} 48% 94%)`;
}
