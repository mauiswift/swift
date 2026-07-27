/**
 * Official Payment Method Logos & Branding
 * Uses official company logos and brand guidelines
 * Sourced from official brand centers and payment provider guidelines
 */

export const OFFICIAL_PAYMENT_LOGOS = {
  // ===== DIGITAL WALLETS (E-Wallets) =====
  'gcash': {
    default: '/logos/gcash.svg',
    official: true,
    brand_color: '#007DFF', // GCash official blue
    width: 100,
    height: 35,
  },
  'maya': {
    default: '/logos/maya.svg',
    official: true,
    brand_color: '#00C851', // Maya official green
    width: 100,
    height: 40,
  },
  'grabpay': {
    default: '/logos/grab.svg',
    official: true,
    brand_color: '#00B14F', // GrabPay official green
    width: 90,
    height: 35,
  },

  // ===== BANK LOGOS =====
  'bpi': {
    default: '/logos/bpi.svg',
    official: true,
    brand_color: '#CE0000', // BPI official red
    width: 80,
    height: 50,
  },
  'bdo': {
    default: '/logos/bdo.svg',
    official: true,
    brand_color: '#003DA5', // BDO official blue
    width: 100,
    height: 35,
  },
  'unionbank': {
    default: '/logos/unionbank.svg',
    official: true,
    brand_color: '#0052CC', // UnionBank official blue
    width: 110,
    height: 30,
  },
  'metrobank': {
    default: '/logos/metrobank.svg',
    official: true,
    brand_color: '#D32F2F', // Metrobank official red
    width: 100,
    height: 40,
  },
  'rcbc': {
    default: '/logos/rcbc.svg',
    official: true,
    brand_color: '#C41E3A', // RCBC official red
    width: 90,
    height: 45,
  },
  'psbank': {
    default: '/logos/psbank.svg',
    official: true,
    brand_color: '#007DB3', // PSBank official blue
    width: 100,
    height: 35,
  },
  'secbank': {
    default: '/logos/security-bank.svg',
    official: true,
    brand_color: '#E31937', // Security Bank official red
    width: 110,
    height: 40,
  },
  'aub': {
    default: '/logos/asia-united-bank.svg',
    official: true,
    brand_color: '#C8102E', // AUB official red
    width: 100,
    height: 40,
  },

  // ===== CARDS =====
  'visa': {
    default: '/logos/visa.svg',
    official: true,
    brand_color: '#1434CB', // Visa official blue
    width: 60,
    height: 38,
  },
  'mastercard': {
    default: '/logos/mastercard.svg',
    official: true,
    brand_color: '#EB001B', // Mastercard official red
    width: 60,
    height: 38,
  },

  // ===== QR CODE PAYMENT =====
  'qrph': {
    default: '/logos/qrph.svg',
    official: true,
    brand_color: '#00A86B', // QR PH official green
    width: 100,
    height: 50,
  },

  // ===== INTERNATIONAL PAYMENTS =====
  'alipay': {
    default: '/logos/alipay.svg',
    official: true,
    brand_color: '#1677FF', // Alipay official blue
    width: 80,
    height: 30,
  },
  'wechat': {
    default: '/logos/wechat.svg',
    official: true,
    brand_color: '#07C160', // WeChat Pay official green
    width: 80,
    height: 33,
  },

  // ===== CRYPTO =====
  'usdt': {
    default: '/logos/tether.svg',
    official: true,
    brand_color: '#26A17B', // USDT/Tether official green
    width: 60,
    height: 60,
  },

  // ===== VIRTUAL ACCOUNT =====
  'virtual_account': {
    default: '/logos/va.svg',
    official: false, // SwiftPay branded
    brand_color: '#8B5CF6', // Purple
    width: 100,
    height: 40,
  },
};

/**
 * Get logo path based on theme
 */
export const getLogoBrandPath = (
  methodId: string,
  theme: 'light' | 'dark' | 'default' = 'default'
): string => {
  const logos = OFFICIAL_PAYMENT_LOGOS[methodId as keyof typeof OFFICIAL_PAYMENT_LOGOS];
  if (!logos) return '/logos/placeholder.svg';
  return logos[theme] || logos.default;
};

/**
 * Get brand color for method
 */
export const getMethodBrandColor = (methodId: string): string => {
  const logos = OFFICIAL_PAYMENT_LOGOS[methodId as keyof typeof OFFICIAL_PAYMENT_LOGOS];
  return logos?.brand_color || '#000000';
};

/**
 * Get logo dimensions
 */
export const getLogoDimensions = (methodId: string): { width: number; height: number } => {
  const logos = OFFICIAL_PAYMENT_LOGOS[methodId as keyof typeof OFFICIAL_PAYMENT_LOGOS];
  return {
    width: logos?.width || 100,
    height: logos?.height || 40,
  };
};

/**
 * Official Swiftpay Logo
 */
export const SWIFTPAY_LOGOS = {
  horizontal: '/logos/swiftpay-horizontal.svg',
  vertical: '/logos/swiftpay-vertical.svg',
  icon: '/logos/swiftpay-icon.svg',
  icon_gradient: '/logos/swiftpay-icon-gradient.svg',
  monochrome: '/logos/swiftpay-monochrome.svg',
};
