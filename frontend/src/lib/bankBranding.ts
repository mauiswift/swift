import { resolveBrandLogoPath } from '@/config/payment-logo-registry';

export function getBankLogo(label: string): string | undefined {
  return resolveBrandLogoPath(label) || undefined;
}

export function getBankDisplayName(label: string): string {
  return label.trim() || 'Receiving bank';
}
