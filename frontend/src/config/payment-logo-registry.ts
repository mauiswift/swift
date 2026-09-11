/** Canonical bank assets and aliases returned by different bank APIs. */
export const normalizeBrandKey = (value: string): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

export const BANK_LOGO_ALIASES: Record<string, string[]> = {
  '/logos/bdo.svg': ['bdo', 'bdounibank', 'bdounibankinc', 'bdounibankcorporation'],
  '/logos/bpi.svg': ['bpi', 'bankofthephilippineislands', 'bankofthephilippineislandsinc', 'bankofthephilippineislandscorporation'],
  '/logos/metrobank.svg': ['metrobank', 'metrobankphilippines', 'mbtc', 'metropolitanbank', 'metropolitanbankandtrust', 'metropolitanbankandtrustcompany'],
  '/logos/unionbank.svg': ['unionbank', 'unionbankofthephilippines', 'unionbankofthephilippinesinc', 'unionbankofthephilippinescorporation'],
  '/logos/security-bank.svg': ['securitybank', 'security_bank', 'secbank', 'secbankph', 'securitybankcorp', 'securitybankcorporation'],
  '/logos/landbank.png': ['landbank', 'ldb', 'landbankph', 'landbankphilippines', 'landbankofthephilippines', 'landbankofthephilippinesinc'],
  '/logos/dbp.svg': ['dbp', 'developmentbank', 'developmentbankofthephils', 'developmentbankofthephilippines'],
  '/logos/rcbc.svg': ['rcbc', 'rizalcommercialbankingcorporation'],
  '/logos/psbank.svg': ['psbank', 'psb', 'philippinesavingsbank', 'philippinesavingsbankinc'],
  '/logos/asia-united-bank.svg': ['aub', 'asiaunited', 'asia_united', 'asiaunitedbank', 'asiaunitedbankcorporation'],
  '/logos/eastwest-bank.svg': ['eastwest', 'eastwest_bank', 'eastwestbank', 'eastwestbankcorporation'],
  '/logos/netbank.png': ['netbank', 'net_bank'],
  '/logos/bsp.svg': ['bsp', 'bangkosentralngpilipinas', 'centralbankofthephilippines'],
  '/logos/gcash.png': ['gcash', 'gcashwallet'],
  '/logos/maya.svg': ['maya', 'paymaya', 'mayawallet'],
  '/logos/grab.svg': ['grab', 'grabpay'],
  '/logos/instapay.png': ['instapay', 'instapayph', 'instapaynetwork', 'pesonet', 'pesonetph'],
  '/logos/va.svg': ['virtualaccount', 'va', 'virtual', 'banktransfer', 'bankdeposit'],
  '/logos/visa.svg': ['visa'],
  '/logos/mastercard.svg': ['mastercard'],
  '/logos/card.svg': ['card', 'swiftpayorder', 'paymentlink'],
  '/logos/alipay.png': ['alipay', 'alipayqr', 'alipaypay'],
  '/logos/wechat.svg': ['wechat', 'wechatpay', 'wechatqr'],
  '/logos/qrph.svg': ['qrph', 'qr'],
  '/logos/kb-kookmin.svg': ['kb', 'kookminbank', 'kbkookminbank'],
  '/logos/shinhan-bank.svg': ['shinhan', 'shinhanbank'],
  '/logos/hana-bank.svg': ['hana', 'hanabank'],
  '/logos/woori-bank.svg': ['woori', 'wooribank'],
  '/logos/nonghyup-bank.svg': ['nh', 'nonghyup', 'nonghyupbank'],
  '/logos/ibk-bank.svg': ['ibk', 'industrialbankofkorea'],
  '/logos/kdb-bank.png': ['kdb', 'kdbbank'],
  '/logos/kakao-bank.svg': ['kakaobank', 'kakao'],
  '/logos/toss-bank.png': ['tossbank', 'toss'],
  '/logos/sc-first-bank.svg': ['sc', 'scfirstbank', 'scbank'],
  '/logos/naver.svg': ['naver', 'naverbank'],
  '/logos/kakaopay.svg': ['kakaopay'],
  '/logos/tosspay.svg': ['tosspay'],
  '/logos/naverpay.svg': ['naverpay'],
  '/logos/payco.svg': ['payco'],
  '/logos/tether.svg': ['usdt', 'tether'],
};

export const OFFICIAL_BRAND_LOGO_REGISTRY: Record<string, string> = Object.fromEntries(
  Object.entries(BANK_LOGO_ALIASES).flatMap(([logoPath, aliases]) =>
    aliases.map((alias) => [normalizeBrandKey(alias), logoPath])
  )
);

export const resolveBrandLogoPath = (value: string): string => {
  const key = normalizeBrandKey(value);
  return OFFICIAL_BRAND_LOGO_REGISTRY[key] || '';
};
