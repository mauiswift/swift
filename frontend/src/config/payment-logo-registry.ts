/** Canonical bank assets and aliases returned by different bank APIs. */
export const normalizeBrandKey = (value: string): string => {
  const raw = String(value ?? '').trim();
  const aliases: Record<string, string> = {
    '토스페이': 'tosspay',
    '토스뱅크': 'tossbank',
  };
  return (aliases[raw] || raw)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
};

export const BANK_LOGO_ALIASES: Record<string, string[]> = {
  '/logos/bdo.svg': ['bdo', 'bdounibank', 'bdounibankinc', 'bdounibankcorporation', 'bancodeorounibankincbdo', 'bnorphmxxx'],
  '/logos/bpi.svg': ['bpi', 'bankofthephilippineislands', 'bankofthephilippineislandsbpi', 'bankofthephilippineislandsinc', 'bankofthephilippineislandscorporation', 'bopiphmxxx'],
  '/logos/metrobank.svg': ['metrobank', 'metrobankphilippines', 'mbtc', 'metropolitanbank', 'metropolitanbankandtrust', 'metropolitanbankandtrustcompany', 'mbtcphmmxxx'],
  '/logos/unionbank.svg': ['unionbank', 'unionbankofthephilippines', 'unionbankofthephilippinesinc', 'unionbankofthephilippinescorporation', 'ubphphmmxxx'],
  '/logos/security-bank.svg': ['securitybank', 'security_bank', 'secbank', 'secbankph', 'securitybankcorp', 'securitybankcorporation', 'setcphmmxxx'],
  '/logos/landbank.png': ['landbank', 'ldb', 'landbankph', 'landbankphilippines', 'landbankofthephilippines', 'landbankofthephilippinesinc', 'tlbpphmmxxx'],
  '/logos/dbp.svg': ['dbp', 'developmentbank', 'developmentbankofthephils', 'developmentbankofthephilippines', 'dbphphmmxxx'],
  '/logos/rcbc.svg': ['rcbc', 'rizalcommercialbankingcorporation', 'rcbcphmmxxx'],
  '/logos/psbank.svg': ['psbank', 'psb', 'philippinesavingsbank', 'philippinesavingsbankinc', 'phbmphmmxxx'],
  '/logos/asia-united-bank.png': ['aub', 'asiaunited', 'asia_united', 'asiaunitedbank', 'asiaunitedbankcorporation', 'aubkphmmxxx'],
  '/logos/eastwest-bank.svg': ['eastwest', 'eastwest_bank', 'eastwestbank', 'eastwestbankcorporation', 'eastwestbankingcorporation', 'ewbcphmmxxx'],
  '/logos/netbank.png': ['netbank', 'net_bank', 'cuobphm1xxx'],
  '/logos/diskartech.png': ['diskartech', 'rcbcdigital'],
  '/logos/bsp.svg': ['bsp', 'bangkosentralngpilipinas', 'centralbankofthephilippines'],
  '/logos/gcash.png': ['gcash', 'gcashwallet'],
  '/logos/maya.svg': ['maya', 'paymaya', 'mayawallet', 'mydbphm2xxx', 'paphphm1xxx'],
  '/logos/grab.svg': ['grab', 'grabpay', 'ghpesgsgxxx'],
  '/logos/instapay.png': ['instapay', 'instapayph', 'instapaynetwork', 'pesonet', 'pesonetph'],
  '/logos/va.svg': ['virtualaccount', 'va', 'virtual', 'banktransfer', 'bankdeposit'],
  '/logos/visa.svg': ['visa'],
  '/logos/mastercard.svg': ['mastercard'],
  '/logos/unionpay.svg': ['unionpay', 'unionpaynetwork', 'unionpayinternational'],
  '/logos/card.svg': ['card', 'swiftpayorder', 'paymentlink'],
  '/logos/alipay.png': ['alipay', 'alipayqr', 'alipaypay', 'aphiphm2xxx'],
  '/logos/wechat.png': ['wechat', 'wechatpay', 'wechatqr'],
  '/logos/qrph.svg': ['qrph', 'qr'],
  '/logos/kb-kookmin.svg': ['kb', 'kookminbank', 'kbkookminbank', '004'],
  '/logos/shinhan-bank.svg': ['shinhan', 'shinhanbank', '088'],
  '/logos/hana-bank.svg': ['hana', 'hanabank', '081'],
  '/logos/woori-bank.svg': ['woori', 'wooribank', '020'],
  '/logos/nonghyup-bank.svg': ['nh', 'nonghyup', 'nonghyupbank', 'nhnonghyupbank', '011'],
  '/logos/ibk-bank.svg': ['ibk', 'industrialbankofkorea', 'ibkindustrialbankofkorea', '003'],
  '/logos/kdb-bank.png': ['kdb', 'kdbbank', '002'],
  '/logos/kakao-bank.svg': ['kakaobank', 'kakao', '090'],
  '/logos/toss-bank.png': ['tossbank', '092'],
  '/logos/sc-first-bank.svg': ['sc', 'scfirstbank', 'scbank', '023'],
  '/logos/citi.png': ['citibankkorea', 'citibank', 'citi', '027'],
  '/logos/im-bank.png': ['daegu', 'daegubank', 'imbank', '031'],
  '/logos/busan-bank.png': ['busan', 'busanbank', 'bnkbusanbank', '032'],
  '/logos/gwangju-bank.png': ['gwangju', 'gwangjubank', 'kjbank', '034'],
  '/logos/jeju-bank.png': ['jeju', 'jejubank', '035'],
  '/logos/jeonbuk-bank.png': ['jeonbuk', 'jeonbukbank', 'jbbank', '037'],
  '/logos/kyongnam-bank.jpg': ['kyongnam', 'kyongnambank', 'bnkkyongnambank', '039'],
  '/logos/mg-credit-cooperative.png': ['mg', 'mgcommunitycreditcooperatives', 'koreafederationofcommunitycreditcooperatives', '045'],
  '/logos/credit-union.png': ['creditunion', 'koreacreditunion', '048'],
  '/logos/korea-post-bank.png': ['postofficebank', 'koreapost', 'koreapostbank', '071'],
  '/logos/kbank.png': ['kbank', '089'],
  '/logos/naver.svg': ['naver'],
  '/logos/kakaopay.png': ['kakaopay'],
  '/logos/tosspay.png': ['tosspay'],
  '/logos/naverpay.png': ['naverpay'],
  '/logos/payco.png': ['payco'],
  '/logos/tether.svg': ['usdt', 'tether'],
};

export const OFFICIAL_BRAND_LOGO_REGISTRY: Record<string, string> = Object.fromEntries(
  Object.entries(BANK_LOGO_ALIASES).flatMap(([logoPath, aliases]) =>
    aliases.map((alias) => [normalizeBrandKey(alias), logoPath])
  )
);

export const resolveBrandLogoPath = (value: string): string => {
  const key = normalizeBrandKey(value);
  if (!key) return '';
  return OFFICIAL_BRAND_LOGO_REGISTRY[key] || '';
};

export const getBrandLogoCandidates = (value: string, providerLogoUrl?: string): string[] => {
  const candidates = [resolveBrandLogoPath(value), providerLogoUrl?.trim()];
  return [...new Set(candidates.filter((path): path is string => Boolean(path)))];
};
