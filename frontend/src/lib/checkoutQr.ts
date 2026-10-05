export type CheckoutQrPanelMode = 'none' | 'default' | 'gcash' | 'qrph' | 'alipay';

export const normalizeCheckoutQrValue = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim();
};

export const sanitizeCheckoutDeepLink = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  if (/^(?:gcash|supertoss):\/\//i.test(trimmed)) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? trimmed : null;
  } catch {
    return null;
  }
};

export const buildTossQrDeepLink = ({
  baseUrl,
  qrPayload,
}: {
  baseUrl?: unknown;
  qrPayload?: unknown;
}): string => {
  const base = sanitizeCheckoutDeepLink(baseUrl) || 'supertoss://toss/pay';
  const qr = normalizeCheckoutQrValue(qrPayload);
  if (!qr) return base;

  try {
    const parsed = new URL(base);
    parsed.searchParams.set('qr', qr);
    return parsed.toString();
  } catch {
    return base;
  }
};

export const sanitizeGcashAppDeepLink = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  return /^gcash:\/\//i.test(trimmed) ? trimmed : null;
};

export const sanitizeAlipayAppDeepLink = (value: unknown): string | null => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  return /^(?:alipays|alipay):\/\//i.test(trimmed) ? trimmed : null;
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
  if (normalizedMethod === 'alipay') return hasQrPayload ? 'alipay' : 'default';
  return 'default';
};
