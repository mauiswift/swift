export function fmt(n?: number | null): string {
  if (typeof n === 'number' && !Number.isNaN(n)) {
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  }
  return '0.00';
}

export function fmtShort(n?: number | null): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '0.00';
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : fmt(n);
}

export function fmtUsd(n?: number | null): string {
  if (typeof n === 'number' && !Number.isNaN(n)) {
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return '0.00';
}

export function fmtCurrencyPhp(n?: number | null): string {
  if (typeof n === 'number' && !Number.isNaN(n)) {
    return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  }
  return '₱0.00';
}

const currencySymbols: Record<string, string> = {
  PHP: '₱', USD: '$', CNY: '¥', KRW: '₩', EUR: '€', GBP: '£', SGD: 'S$', USDT: 'USDT ',
};

const currencyNames: Record<string, string> = {
  PHP: 'Philippine peso',
  USD: 'US dollar',
  CNY: 'Chinese yuan',
  KRW: 'South Korean won',
  EUR: 'Euro',
  GBP: 'British pound',
  SGD: 'Singapore dollar',
  USDT: 'Tether USD',
};

const currencyLocales: Record<string, string> = {
  PHP: 'en-PH', USD: 'en-US', CNY: 'zh-CN', KRW: 'ko-KR',
  EUR: 'de-DE', GBP: 'en-GB', SGD: 'en-SG', USDT: 'en-US',
};

export function getCurrencySymbol(currency = 'PHP'): string {
  const normalizedCurrency = currency.toUpperCase();
  return currencySymbols[normalizedCurrency] || `${normalizedCurrency} `;
}

export function getCurrencyName(currency = 'PHP'): string {
  const normalizedCurrency = currency.trim().toUpperCase();
  return currencyNames[normalizedCurrency] || normalizedCurrency;
}

export function fmtCurrency(n: number | null | undefined, currency = 'PHP'): string {
  const amount = typeof n === 'number' && !Number.isNaN(n) ? n : 0;
  const normalizedCurrency = currency.trim().toUpperCase();
  const locale = currencyLocales[normalizedCurrency] || 'en-US';

  if (normalizedCurrency === 'USDT') {
    return `USDT ${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
      currencyDisplay: 'symbol',
    }).format(amount);
  } catch {
    return `${getCurrencySymbol(normalizedCurrency)}${amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}
