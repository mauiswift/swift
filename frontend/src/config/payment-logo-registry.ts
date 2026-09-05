/**
 * Canonical brand-to-logo registry for banking and e-wallet icons.
 * Keep this as the single source of truth so every brand resolves to the
 * original official asset instead of fragile ad-hoc string matching.
 */

export const OFFICIAL_BRAND_LOGO_REGISTRY: Record<string, string> = {
  gcash: '/logos/gcash.svg',
  maya: '/logos/maya.svg',
  grabpay: '/logos/grab.svg',
  grab: '/logos/grab.svg',
  kakaopay: '/logos/kakaopay.svg',
  naverpay: '/logos/naverpay.svg',
  tosspay: '/logos/tosspay.svg',
  payco: '/logos/payco.svg',

  bdo: '/logos/bdo.svg',
  bdounibank: '/logos/bdo.svg',
  bpi: '/logos/bpi.svg',
  bankofthephilippineislands: '/logos/bpi.svg',
  metrobank: '/logos/metrobank.svg',
  metrobankphilippines: '/logos/metrobank.svg',
  unionbank: '/logos/unionbank.svg',
  unionbankofthephilippines: '/logos/unionbank.svg',
  securitybank: '/logos/security-bank.svg',
  secbank: '/logos/security-bank.svg',
  landbank: '/logos/landbank.svg',
  landbankofthephilippines: '/logos/landbank.svg',
  rcbc: '/logos/rcbc.svg',
  psbank: '/logos/psbank.svg',
  aub: '/logos/asia-united-bank.svg',
  asiaunited: '/logos/asia-united-bank.svg',
  asiaunitedbank: '/logos/asia-united-bank.svg',

  virtualaccount: '/logos/va.svg',
  va: '/logos/va.svg',
  virtual: '/logos/va.svg',
  bank: '/logos/va.svg',

  usdt: '/logos/tether.svg',
  tether: '/logos/tether.svg',
  visa: '/logos/visa.svg',
  mastercard: '/logos/mastercard.svg',
  alipay: '/logos/alipay-official.svg',
  alipaypay: '/logos/alipay-official.svg',
  wechat: '/logos/wechat.svg',
  wechatpay: '/logos/wechat.svg',
  qrph: '/logos/qrph.svg',
  qr: '/logos/qrph.svg',
};

export const normalizeBrandKey = (value: string): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

export const resolveBrandLogoPath = (value: string): string => {
  const key = normalizeBrandKey(value);
  return OFFICIAL_BRAND_LOGO_REGISTRY[key] || '';
};
