import { client } from '@/lib/api';

export type PaymentChannelFlow = 'checkout' | 'withdrawal' | 'disbursement';
export type PaymentChannels = Record<string, Record<PaymentChannelFlow, string[]> & { checkout_institutions?: string[] }>;

export const PAYMENT_CHANNELS = [
  { id: 'gcash', label: 'GCash' },
  { id: 'maya', label: 'Maya' },
  { id: 'bank_transfer', label: 'Bank transfer' },
  { id: 'qr_code', label: 'QR code' },
  { id: 'alipay', label: 'Alipay' },
  { id: 'wechat', label: 'WeChat Pay' },
  { id: 'card', label: 'Card' },
] as const;

export async function fetchPaymentChannels(): Promise<PaymentChannels | null> {
  const response = await client.get('/api/v1/app-settings/payment-channels');
  return response.ok && response.data?.channels ? response.data.channels as PaymentChannels : null;
}

export function isPaymentChannelEnabled(
  channels: PaymentChannels | null,
  currency: string,
  flow: PaymentChannelFlow,
  channel: string,
) {
  if (!channels) return true;
  return channels[String(currency || 'PHP').toUpperCase()]?.[flow]?.includes(channel) ?? false;
}