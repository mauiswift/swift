export type CheckoutQrPanelMode = 'none' | 'default' | 'gcash' | 'qrph';

export const sanitizeCheckoutDeepLink = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  if (/^gcash:\/\//i.test(trimmed)) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
};

export const resolveCheckoutQrPanelMode = ({
  hasQR,
  paymentMethod,
  gcashDeepLink,
}: {
  hasQR: boolean;
  paymentMethod: string;
  gcashDeepLink: string | null;
}): CheckoutQrPanelMode => {
  if (!hasQR) return 'none';
  const normalizedMethod = String(paymentMethod || '').trim().toLowerCase();
  if (gcashDeepLink || normalizedMethod === 'gcash') return 'gcash';
  if (normalizedMethod === 'qrph') return 'qrph';
  return 'default';
};
