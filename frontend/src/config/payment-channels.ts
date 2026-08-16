/**
 * Payment Channel Configuration
 * Maps available payment methods to their logos, categories, and metadata
 * Based on SwiftPay PH active payment gateways: SwiftPay (local) & Magpie (international)
 */

export interface PaymentMethodConfig {
  id: string;
  code: string;
  name: string;
  logo: string;
  category: 'digital_wallets' | 'banks' | 'cards' | 'qr_code' | 'international';
  provider: 'swiftpay' | 'magpie';
  region: 'Philippines' | 'China' | 'International';
  type: 'e-wallet' | 'bank' | 'qr' | 'card';
  color: string; // Tailwind color class
  backgroundColor: string; // bg-* class
}

/**
 * Complete payment method catalog for SwiftPay PH
 * Only includes methods that are actively configured in the system
 */
export const PAYMENT_METHODS_CATALOG: PaymentMethodConfig[] = [
  // ===== LOCAL PH PAYMENTS (SwiftPay) =====
  
  // Digital Wallets
  {
    id: 'gcash',
    code: 'GCASH',
    name: 'GCash',
    logo: '/logos/gcash.svg',
    category: 'digital_wallets',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'e-wallet',
    color: 'text-blue-400',
    backgroundColor: 'bg-blue-500/5',
  },
  {
    id: 'maya',
    code: 'MAYA',
    name: 'Maya',
    logo: '/logos/maya.svg',
    category: 'digital_wallets',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'e-wallet',
    color: 'text-green-400',
    backgroundColor: 'bg-green-500/5',
  },
  {
    id: 'grabpay',
    code: 'GRABPAY',
    name: 'GrabPay',
    logo: '/logos/grab.svg',
    category: 'digital_wallets',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'e-wallet',
    color: 'text-emerald-400',
    backgroundColor: 'bg-emerald-500/5',
  },

  // Bank Transfers (QR PH / InstaPay / PESONet)
  {
    id: 'qrph',
    code: 'QRPH',
    name: 'QR PH',
    logo: '/logos/qrph.svg',
    category: 'qr_code',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'qr',
    color: 'text-emerald-400',
    backgroundColor: 'bg-emerald-500/5',
  },
  {
    id: 'virtual_account',
    code: 'VA',
    name: 'Virtual Account',
    logo: '/logos/va.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    color: 'text-purple-400',
    backgroundColor: 'bg-purple-500/5',
  },
  {
    id: 'bpi',
    code: 'BPI',
    name: 'BPI',
    logo: '/logos/bpi.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    color: 'text-indigo-400',
    backgroundColor: 'bg-indigo-500/5',
  },
  {
    id: 'bdo',
    code: 'BDO',
    name: 'BDO',
    logo: '/logos/bdo.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    color: 'text-blue-400',
    backgroundColor: 'bg-blue-500/5',
  },
  {
    id: 'unionbank',
    code: 'UNIONBANK',
    name: 'Union Bank',
    logo: '/logos/unionbank.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    color: 'text-cyan-400',
    backgroundColor: 'bg-cyan-500/5',
  },
  {
    id: 'metrobank',
    code: 'METROBANK',
    name: 'Metrobank',
    logo: '/logos/metrobank.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    color: 'text-blue-300',
    backgroundColor: 'bg-blue-500/5',
  },
  {
    id: 'rcbc',
    code: 'RCBC',
    name: 'RCBC',
    logo: '/logos/rcbc.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    color: 'text-amber-400',
    backgroundColor: 'bg-amber-500/5',
  },
  {
    id: 'psbank',
    code: 'PSBANK',
    name: 'PSBank',
    logo: '/logos/psbank.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    color: 'text-teal-400',
    backgroundColor: 'bg-teal-500/5',
  },
  {
    id: 'security_bank',
    code: 'SECBANK',
    name: 'Security Bank',
    logo: '/logos/secbank.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    color: 'text-red-400',
    backgroundColor: 'bg-red-500/5',
  },
  {
    id: 'asia_united',
    code: 'AUB',
    name: 'Asia United Bank',
    logo: '/logos/aub.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    color: 'text-orange-400',
    backgroundColor: 'bg-orange-500/5',
  },

  // Cards
  {
    id: 'visa',
    code: 'VISA',
    name: 'Visa',
    logo: '/logos/visa.svg',
    category: 'cards',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'card',
    color: 'text-blue-500',
    backgroundColor: 'bg-blue-500/5',
  },
  {
    id: 'mastercard',
    code: 'MASTERCARD',
    name: 'Mastercard',
    logo: '/logos/mastercard.svg',
    category: 'cards',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'card',
    color: 'text-orange-500',
    backgroundColor: 'bg-orange-500/5',
  },

  // ===== INTERNATIONAL PAYMENTS (Magpie + card rails) =====

  {
    id: 'alipay',
    code: 'ALIPAY',
    name: 'Alipay',
    logo: '/logos/alipay.svg',
    category: 'international',
    provider: 'magpie',
    region: 'China',
    type: 'e-wallet',
    color: 'text-blue-400',
    backgroundColor: 'bg-blue-500/5',
  },
  {
    id: 'wechat',
    code: 'WECHAT',
    name: 'WeChat Pay',
    logo: '/logos/wechat.svg',
    category: 'international',
    provider: 'magpie',
    region: 'China',
    type: 'e-wallet',
    color: 'text-green-400',
    backgroundColor: 'bg-green-500/5',
  },
  {
    id: 'kakaopay',
    code: 'KAKAOPAY',
    name: 'KakaoPay',
    logo: '/logos/kakaopay.svg',
    category: 'international',
    provider: 'magpie',
    region: 'International',
    type: 'e-wallet',
    color: 'text-yellow-400',
    backgroundColor: 'bg-yellow-500/5',
  },
  {
    id: 'naverpay',
    code: 'NAVERPAY',
    name: 'NaverPay',
    logo: '/logos/naverpay.svg',
    category: 'international',
    provider: 'magpie',
    region: 'International',
    type: 'e-wallet',
    color: 'text-emerald-400',
    backgroundColor: 'bg-emerald-500/5',
  },
  {
    id: 'tosspay',
    code: 'TOSSPAY',
    name: 'Toss Pay',
    logo: '/logos/tosspay.svg',
    category: 'international',
    provider: 'magpie',
    region: 'International',
    type: 'e-wallet',
    color: 'text-violet-400',
    backgroundColor: 'bg-violet-500/5',
  },
  {
    id: 'payco',
    code: 'PAYCO',
    name: 'PAYCO',
    logo: '/logos/payco.svg',
    category: 'international',
    provider: 'magpie',
    region: 'International',
    type: 'e-wallet',
    color: 'text-red-400',
    backgroundColor: 'bg-red-500/5',
  },

  // Crypto
  {
    id: 'usdt',
    code: 'USDT',
    name: 'USDT (TRC-20)',
    logo: '/logos/tether.svg',
    category: 'international',
    provider: 'swiftpay',
    region: 'International',
    type: 'e-wallet',
    color: 'text-green-400',
    backgroundColor: 'bg-green-500/5',
  },
];

/**
 * Get payment method by code/ID
 */
export const getPaymentMethod = (code: string): PaymentMethodConfig | undefined => {
  const normalized = code.toUpperCase();
  return PAYMENT_METHODS_CATALOG.find(
    m => m.code === normalized || m.id === normalized.toLowerCase()
  );
};

/**
 * Filter payment methods by category
 */
export const getPaymentMethodsByCategory = (
  category: PaymentMethodConfig['category']
): PaymentMethodConfig[] => {
  return PAYMENT_METHODS_CATALOG.filter(m => m.category === category);
};

/**
 * Filter payment methods by provider
 */
export const getPaymentMethodsByProvider = (
  provider: PaymentMethodConfig['provider']
): PaymentMethodConfig[] => {
  return PAYMENT_METHODS_CATALOG.filter(m => m.provider === provider);
};

/**
 * Match institution from API response to payment method config
 */
export const matchInstitutionToPaymentMethod = (
  institutionCode: string,
  institutionName: string
): PaymentMethodConfig | undefined => {
  const upperCode = institutionCode.toUpperCase();
  const upperName = institutionName.toUpperCase();

  // Try direct code match first
  let method = getPaymentMethod(upperCode);
  if (method) return method;

  // Try name matching
  method = PAYMENT_METHODS_CATALOG.find(
    m => m.code === upperCode || m.name.toUpperCase() === upperName
  );
  if (method) return method;

  // Fallback: fuzzy match on common patterns
  if (upperName.includes('GCASH') || upperCode.includes('GCASH')) {
    return getPaymentMethod('GCASH');
  }
  if (upperName.includes('MAYA') || upperCode.includes('MAYA')) {
    return getPaymentMethod('MAYA');
  }
  if (upperName.includes('GRAB') || upperCode.includes('GRABPAY')) {
    return getPaymentMethod('GRABPAY');
  }
  if (upperName.includes('ALIPAY') || upperCode.includes('ALIPAY')) {
    return getPaymentMethod('ALIPAY');
  }
  if (upperName.includes('WECHAT') || upperCode.includes('WECHAT')) {
    return getPaymentMethod('WECHAT');
  }
  if (upperName.includes('KAKAO') || upperCode.includes('KAKAO') || upperCode.includes('KAKAOPAY')) {
    return getPaymentMethod('KAKAOPAY');
  }
  if (upperName.includes('NAVER') || upperCode.includes('NAVER') || upperCode.includes('NAVERPAY')) {
    return getPaymentMethod('NAVERPAY');
  }
  if (upperName.includes('TOSS') || upperCode.includes('TOSS') || upperCode.includes('TOSSPAY')) {
    return getPaymentMethod('TOSSPAY');
  }
  if (upperName.includes('PAYCO') || upperCode.includes('PAYCO')) {
    return getPaymentMethod('PAYCO');
  }
  if (upperName.includes('QR') || upperCode.includes('QR')) {
    return getPaymentMethod('QRPH');
  }
  if (upperCode.includes('VA') || upperName.includes('VIRTUAL')) {
    return getPaymentMethod('VIRTUAL_ACCOUNT');
  }

  return undefined;
};

/**
 * Category grouping for UI display
 */
export interface PaymentCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBgColor: string;
}

export const PAYMENT_CATEGORIES: Record<string, PaymentCategory> = {
  digital_wallets: {
    id: 'digital_wallets',
    label: 'Digital Wallets',
    icon: 'Smartphone',
    description: 'Fast & convenient mobile payments',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/5',
    borderColor: 'border-blue-500/20',
    hoverBgColor: 'bg-blue-500/15',
  },
  banks: {
    id: 'banks',
    label: 'Bank Transfers',
    icon: 'Building2',
    description: 'Direct bank payment methods',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/5',
    borderColor: 'border-purple-500/20',
    hoverBgColor: 'bg-purple-500/15',
  },
  cards: {
    id: 'cards',
    label: 'Credit & Debit Cards',
    icon: 'CreditCard',
    description: 'Visa, Mastercard & other cards',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/5',
    borderColor: 'border-cyan-500/20',
    hoverBgColor: 'bg-cyan-500/15',
  },
  qr_code: {
    id: 'qr_code',
    label: 'QR Code Payment',
    icon: 'QrCode',
    description: 'Scan with your banking app',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/20',
    hoverBgColor: 'bg-emerald-500/15',
  },
  international: {
    id: 'international',
    label: 'International Payment',
    icon: 'Globe',
    description: 'Visa, Mastercard, Alipay, WeChat Pay & more',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/5',
    borderColor: 'border-amber-500/20',
    hoverBgColor: 'bg-amber-500/15',
  },
};
