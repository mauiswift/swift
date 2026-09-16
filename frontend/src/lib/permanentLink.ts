export const PERMANENT_LINK_CURRENCIES = ['PHP', 'KRW', 'CNY', 'USDT'] as const;

export type PermanentLinkCurrency = (typeof PERMANENT_LINK_CURRENCIES)[number];

export function buildPermanentPaymentLink(
  origin: string,
  slug: string,
  currency: string,
): string {
  const normalizedCurrency = currency.trim().toUpperCase();
  if (
    !PERMANENT_LINK_CURRENCIES.includes(
      normalizedCurrency as PermanentLinkCurrency,
    )
  ) {
    throw new Error(`Unsupported permanent link currency: ${currency}`);
  }
  return `${origin.replace(/\/$/, '')}/pay/${encodeURIComponent(
    slug,
  )}-${normalizedCurrency}`;
}
