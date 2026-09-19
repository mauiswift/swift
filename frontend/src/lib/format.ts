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

const currencySymbols: Record<string, string> = { PHP: '₱', USD: '$', CNY: '¥', KRW: '₩', USDT: '₮' };

const currencyNames: Record<string, string> = {
  PHP: 'Philippine peso',
  CNY: 'Chinese yuan',
  KRW: 'South Korean won',
  USDT: 'Tether USD',
};

const currencyLocales: Record<string, string> = {
  PHP: 'en-PH', CNY: 'zh-CN', KRW: 'ko-KR', USDT: 'en-US',
};

export function getCurrencySymbol(currency = 'PHP'): string {
  const normalizedCurrency = currency.toUpperCase();
  return currencySymbols[normalizedCurrency] || `${normalizedCurrency} `;
}

export function getCurrencyName(currency = 'PHP', language: 'en' | 'ko' | 'zh' = 'en'): string {
  const normalizedCurrency = currency.trim().toUpperCase();
  if (language === 'ko') {
    return ({
      PHP: '필리핀 페소',
      CNY: '중국 위안',
      KRW: '대한민국 원',
      USDT: '테더 (USDT)',
    } as Record<string, string>)[normalizedCurrency] || normalizedCurrency;
  }
  if (language === 'zh') {
    return ({
      PHP: '菲律宾比索',
      CNY: '人民币',
      KRW: '韩元',
      USDT: '泰达币 USD',
    } as Record<string, string>)[normalizedCurrency] || normalizedCurrency;
  }
  return currencyNames[normalizedCurrency] || normalizedCurrency;
}

export function fmtCurrency(n: number | null | undefined, currency = 'PHP'): string {
  const amount = typeof n === 'number' && !Number.isNaN(n) ? n : 0;
  const normalizedCurrency = currency.trim().toUpperCase();
  const locale = currencyLocales[normalizedCurrency] || 'en-US';

  if (normalizedCurrency === 'USDT') {
    return `₮${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (normalizedCurrency === 'USD') {
    return `$${amount.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
