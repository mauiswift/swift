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

export function getCurrencySymbol(currency = 'PHP'): string {
  const normalizedCurrency = currency.toUpperCase();
  return currencySymbols[normalizedCurrency] || `${normalizedCurrency} `;
}

export function fmtCurrency(n: number | null | undefined, currency = 'PHP'): string {
  const amount = typeof n === 'number' && !Number.isNaN(n) ? n : 0;
  return `${getCurrencySymbol(currency)}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
