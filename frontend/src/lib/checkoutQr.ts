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

export const sanitizeGcashAppDeepLink = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  return /^gcash:\/\//i.test(trimmed) ? trimmed : null;
};

export const sanitizeTossDeepLink = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  return /^supertoss:\/\/toss\/pay(?:[/?#]|$)/i.test(trimmed) ? trimmed : null;
};

export const resolveCheckoutQrPanelMode = ({
  hasQR,
  hasQrPayload,
  paymentMethod,
  gcashDeepLink,
}: {
  hasQR: boolean;
  hasQrPayload: boolean;
  paymentMethod: string;
  gcashDeepLink: string | null;
}): CheckoutQrPanelMode => {
  if (!hasQR) return 'none';
  const normalizedMethod = String(paymentMethod || '').trim().toLowerCase();
  if (gcashDeepLink) return 'gcash';
  if (normalizedMethod === 'gcash') return (gcashDeepLink || hasQrPayload) ? 'gcash' : 'default';
  if (normalizedMethod === 'qrph') return hasQrPayload ? 'qrph' : 'default';
  return 'default';
};
