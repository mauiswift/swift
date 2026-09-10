/** Canonical bank assets and the names returned by different bank APIs. */
export const BANK_LOGO_ALIASES: Record<string, string[]> = {
  '/logos/bdo.svg': ['bdo', 'bdounibank', 'bdounibankinc'],
  '/logos/bpi.svg': ['bpi', 'bankofthephilippineislands', 'bankofthephilippineislandsinc'],
  '/logos/metrobank.svg': ['metrobank', 'metrobankphilippines', 'metropolitanbankandtrustcompany'],
  '/logos/unionbank.svg': ['unionbank', 'unionbankofthephilippines', 'unionbankofthephilippinesinc'],
  '/logos/security-bank.svg': ['securitybank', 'security_bank', 'secbank', 'securitybankcorp', 'securitybankcorporation'],
  '/logos/landbank.svg': ['landbank', 'ldb', 'landbankph', 'landbankphilippines', 'landbankofthephilippines', 'landbankofthephilippinesinc'],
  '/logos/dbp.svg': ['dbp', 'developmentbank', 'developmentbankofthephils', 'developmentbankofthephilippines'],
  '/logos/netbank.svg': ['netbank', 'net_bank'],
  '/logos/rcbc.svg': ['rcbc', 'rizalcommercialbankingcorporation'],
  '/logos/psbank.svg': ['psbank', 'philippinesavingsbank'],
  '/logos/asia-united-bank.svg': ['aub', 'asiaunited', 'asia_united', 'asiaunitedbank', 'asiaunitedbankcorporation'],
  '/logos/eastwest-bank.svg': ['eastwest', 'eastwest_bank', 'eastwestbank'],
  '/logos/bsp.svg': ['bsp', 'bangkosentralngpilipinas'],
};

/**
 * Canonical brand-to-logo registry for banking and e-wallet icons.
 * Keep this as the single source of truth so every brand resolves to the
 * original official asset instead of fragile ad-hoc string matching.
 */

export const OFFICIAL_BRAND_LOGO_REGISTRY: Record<string, string> = {
  gcash: '/logos/gcash_wide.svg',
  maya: '/logos/maya.svg',
  grabpay: '/logos/grab.svg',
  grab: '/logos/grab.svg',
  kakaopay: '/logos/kakaopay.svg',
  naverpay: '/logos/naverpay.svg',
  tosspay: '/logos/tosspay.svg',
  payco: '/logos/payco.svg',

  ...Object.fromEntries(
    Object.entries(BANK_LOGO_ALIASES).flatMap(([logoPath, aliases]) =>
      aliases.map((alias) => [alias, logoPath])
    )
  ),

  kb: '/logos/kb-kookmin.svg',
  kookminbank: '/logos/kb-kookmin.svg',
  kbkookminbank: '/logos/kb-kookmin.svg',
  shinhan: '/logos/shinhan-bank.svg',
  shinhanbank: '/logos/shinhan-bank.svg',
  hana: '/logos/hana-bank.svg',
  hanabank: '/logos/hana-bank.svg',
  woori: '/logos/woori-bank.svg',
  wooribank: '/logos/woori-bank.svg',
  nh: '/logos/nonghyup-bank.svg',
  nhnonghyupbank: '/logos/nonghyup-bank.svg',
  nonghyup: '/logos/nonghyup-bank.svg',
  nonghyupbank: '/logos/nonghyup-bank.svg',
  ibk: '/logos/ibk-bank.svg',
  industrialbankofkorea: '/logos/ibk-bank.svg',
  kdb: '/logos/kdb-bank.png',
  kdbbank: '/logos/kdb-bank.png',
  kakaobank: '/logos/kakao-bank.svg',
  tossbank: '/logos/toss-bank.png',
  sc: '/logos/sc-first-bank.svg',
  scfirstbank: '/logos/sc-first-bank.svg',
  naver: '/logos/naver.svg',
  naverbank: '/logos/naver.svg',

  virtualaccount: '/logos/va.svg',
  va: '/logos/va.svg',
  virtual: '/logos/va.svg',
  bank: '/logos/va.svg',
  banktransfer: '/logos/va.svg',
  bankdeposit: '/logos/va.svg',
  instapay: '/logos/va.svg',
  pesonet: '/logos/va.svg',

  usdt: '/logos/tether.svg',
  tether: '/logos/tether.svg',
  visa: '/logos/visa.svg',
  mastercard: '/logos/mastercard.svg',
  card: '/logos/card.svg',
  swiftpayorder: '/logos/card.svg',
  paymentlink: '/logos/card.svg',
  alipay: '/logos/alipay-official.svg',
  alipayqr: '/logos/alipay-official.svg',
  alipaypay: '/logos/alipay-official.svg',
  wechat: '/logos/wechat.svg',
  wechatpay: '/logos/wechat.svg',
  wechatqr: '/logos/wechat.svg',
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
