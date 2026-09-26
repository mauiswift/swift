import { client } from '@/lib/api';

export type PaymentChannelFlow = 'checkout' | 'withdrawal' | 'disbursement';
export type PaymentChannels = Record<string, Record<PaymentChannelFlow, string[]> & { checkout_institutions?: string[] }>;

const SUPPORTED_PAYMENT_CHANNEL_CURRENCIES = new Set(['PHP', 'CNY', 'KRW', 'USDT']);
const CHECKOUT_CHANNEL_BRANDS: Record<string, string> = {
  gcash: 'GCash',
  maya: 'Maya',
  grabpay: 'GrabPay',
  bank_transfer: 'Bank transfer',
  virtual_account: 'SwiftPay Virtual Account',
  alipay: 'Alipay',
  wechat: 'WeChat Pay',
  unionpay: 'UnionPay',
  card: 'Card',
};

export const PAYMENT_CHANNELS = [
  { id: 'gcash', label: 'GCash' },
  { id: 'maya', label: 'Maya' },
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'virtual_account', label: 'SwiftPay Virtual Account' },
  { id: 'qr_code', label: 'QR code' },
  { id: 'alipay', label: 'Alipay' },
  { id: 'wechat', label: 'WeChat Pay' },
  { id: 'card', label: 'Card' },
] as const;

const normalizePaymentChannelCurrency = (currency: string | null | undefined): string | null => {
  const normalized = String(currency ?? 'PHP').trim().toUpperCase();
  const aliasMap: Record<string, string> = { USD: 'USDT', USDC: 'USDT' };
  const key = aliasMap[normalized] ?? normalized;
  return SUPPORTED_PAYMENT_CHANNEL_CURRENCIES.has(key) ? key : null;
};

export const sanitizePaymentChannels = (channels: PaymentChannels | null): PaymentChannels | null => {
  if (!channels || typeof channels !== 'object') return null;

  const sanitized = Object.entries(channels).reduce<PaymentChannels>((acc, [currency, config]) => {
    const normalizedCurrency = normalizePaymentChannelCurrency(currency);
    if (!normalizedCurrency || !config || typeof config !== 'object') return acc;

    const nextConfig: Record<string, unknown> = {};
    for (const flow of ['checkout', 'withdrawal', 'disbursement'] as const) {
      const value = (config as Record<string, unknown>)[flow];
      nextConfig[flow] = Array.isArray(value)
        ? value.filter((item): item is string => typeof item === 'string')
        : [];
    }

    const institutions = (config as Record<string, unknown>).checkout_institutions;
    if (Array.isArray(institutions)) {
      nextConfig.checkout_institutions = institutions
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim().toUpperCase());
    }

    acc[normalizedCurrency] = nextConfig as Record<PaymentChannelFlow, string[]> & { checkout_institutions?: string[] };
    return acc;
  }, {} as PaymentChannels);

  return Object.keys(sanitized).length > 0 ? sanitized : null;
};

export async function fetchPaymentChannels(): Promise<PaymentChannels | null> {
  const response = await client.get('/api/v1/app-settings/payment-channels');
  if (!response.ok || !response.data?.channels) return null;
  return sanitizePaymentChannels(response.data.channels as PaymentChannels);
}

export function isPaymentChannelEnabled(
  channels: PaymentChannels | null,
  currency: string,
  flow: PaymentChannelFlow,
  channel: string,
) {
  // Settings are an authorization boundary: do not expose a channel while
  // configuration is unavailable or has not explicitly enabled it.
  if (!channels) return false;

  const normalizedCurrency = normalizePaymentChannelCurrency(currency);
  if (!normalizedCurrency) return false;

  const flowChannels = channels[normalizedCurrency]?.[flow];
  return Array.isArray(flowChannels) ? flowChannels.includes(channel) : false;
}

export function getCheckoutPaymentBrands(
  channels: PaymentChannels | null,
  currency: string,
): string[] {
  const normalizedCurrency = normalizePaymentChannelCurrency(currency);
  if (!channels || !normalizedCurrency) return [];

  const checkoutChannels = channels[normalizedCurrency]?.checkout;
  if (!Array.isArray(checkoutChannels)) return [];

  return [...new Set(checkoutChannels
    .map(channel => {
      const normalizedChannel = channel.trim().toLowerCase();
      if (normalizedChannel === 'qr_code') return normalizedCurrency === 'PHP' ? 'QRPH' : undefined;
      return CHECKOUT_CHANNEL_BRANDS[normalizedChannel];
    })
    .filter((brand): brand is string => Boolean(brand)))];
}