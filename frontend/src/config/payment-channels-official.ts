/**
 * Official SwiftPay PH Payment Channels
 * Exact logos and names as per official branding guidelines
 * Only payment methods shown in images 1 & 2 are supported
 */

export interface PaymentChannelConfig {
  id: string;
  code: string;
  name: string;
  fullName: string;
  logo: string;
  category: 'digital_wallets' | 'banks' | 'cards' | 'qr_code' | 'international';
  provider: 'swiftpay' | 'magpie';
  region: 'Philippines' | 'China' | 'International';
  type: 'e-wallet' | 'bank' | 'qr' | 'card';
  brandColor: string;
  displayOrder: number;
}

/**
 * OFFICIAL PAYMENT CHANNELS - SwiftPay PH
 * Source: Images 1 & 2 - Approved payment methods
 */
export const PAYMENT_CHANNELS: PaymentChannelConfig[] = [
  // ===== DIGITAL WALLETS / E-WALLETS =====
  {
    id: 'maya',
    code: 'MAYA',
    name: 'Maya',
    fullName: 'Maya',
    logo: '/logos/maya.svg',
    category: 'digital_wallets',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'e-wallet',
    brandColor: '#00C851',
    displayOrder: 1,
  },
  {
    id: 'gcash',
    code: 'GCASH',
    name: 'GCash',
    fullName: 'GCash',
    logo: '/logos/gcash.svg',
    category: 'digital_wallets',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'e-wallet',
    brandColor: '#007DFF',
    displayOrder: 2,
  },

  // ===== PHILIPPINE BANKS =====
  {
    id: 'bdo',
    code: 'BDO',
    name: 'BDO',
    fullName: 'BDO Unibank',
    logo: '/logos/bdo.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    brandColor: '#003DA5',
    displayOrder: 3,
  },
  {
    id: 'bpi',
    code: 'BPI',
    name: 'BPI',
    fullName: 'Bank of the Philippine Islands',
    logo: '/logos/bpi.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    brandColor: '#CE0000',
    displayOrder: 4,
  },
  {
    id: 'vbank',
    code: 'VBANK',
    name: 'VBank',
    fullName: 'VBank',
    logo: '/logos/vbank.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    brandColor: '#E91E63',
    displayOrder: 5,
  },
  {
    id: 'bpi_fsb',
    code: 'BPI_FSB',
    name: 'BPI Family Savings Bank',
    fullName: 'BPI Family Savings Bank',
    logo: '/logos/bpi-fsb.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    brandColor: '#D4AF37',
    displayOrder: 6,
  },
  {
    id: 'diskartech',
    code: 'DISKARTECH',
    name: 'DiskarTech',
    fullName: 'DiskarTech',
    logo: '/logos/diskartech.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    brandColor: '#00BCD4',
    displayOrder: 7,
  },
  {
    id: 'landbank',
    code: 'LANDBANK',
    name: 'Land Bank',
    fullName: 'Land Bank',
    logo: '/logos/landbank.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    brandColor: '#2ECC71',
    displayOrder: 8,
  },
  {
    id: 'metrobank',
    code: 'METROBANK',
    name: 'Metrobank',
    fullName: 'Metrobank',
    logo: '/logos/metrobank.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    brandColor: '#1E3A8A',
    displayOrder: 9,
  },
  {
    id: 'netbank',
    code: 'NETBANK',
    name: 'Netbank',
    fullName: 'Netbank',
    logo: '/logos/netbank.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    brandColor: '#3B82F6',
    displayOrder: 10,
  },
  {
    id: 'rcbc',
    code: 'RCBC',
    name: 'RCBC',
    fullName: 'RCBC',
    logo: '/logos/rcbc.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    brandColor: '#60A5FA',
    displayOrder: 11,
  },
  {
    id: 'unionbank',
    code: 'UNIONBANK',
    name: 'UnionBank',
    fullName: 'Union Bank of the Philippines',
    logo: '/logos/unionbank.svg',
    category: 'banks',
    provider: 'swiftpay',
    region: 'Philippines',
    type: 'bank',
    brandColor: '#FF6B35',
    displayOrder: 12,
  },

  // ===== INTERNATIONAL WALLETS =====
  {
    id: 'alipay',
    code: 'ALIPAY',
    name: 'Alipay',
    fullName: 'Alipay',
    logo: '/logos/alipay.svg',
    category: 'international',
    provider: 'magpie',
    region: 'China',
    type: 'e-wallet',
    brandColor: '#1677FF',
    displayOrder: 13,
  },
  {
    id: 'wechat',
    code: 'WECHAT',
    name: 'WeChat Pay',
    fullName: 'WeChat Pay',
    logo: '/logos/wechat.svg',
    category: 'international',
    provider: 'magpie',
    region: 'China',
    type: 'e-wallet',
    brandColor: '#07C160',
    displayOrder: 14,
  },
  {
    id: 'visa',
    code: 'VISA',
    name: 'Visa',
    fullName: 'Visa',
    logo: '/logos/visa.svg',
    category: 'international',
    provider: 'swiftpay',
    region: 'International',
    type: 'card',
    brandColor: '#1A73E8',
    displayOrder: 15,
  },
  {
    id: 'mastercard',
    code: 'MASTERCARD',
    name: 'Mastercard',
    fullName: 'Mastercard',
    logo: '/logos/mastercard.svg',
    category: 'international',
    provider: 'swiftpay',
    region: 'International',
    type: 'card',
    brandColor: '#FF5F00',
    displayOrder: 16,
  },
  {
    id: 'kakaopay',
    code: 'KAKAOPAY',
    name: 'KakaoPay',
    fullName: 'KakaoPay',
    logo: '/logos/kakaopay.svg',
    category: 'international',
    provider: 'magpie',
    region: 'International',
    type: 'e-wallet',
    brandColor: '#FEE500',
    displayOrder: 17,
  },
  {
    id: 'naverpay',
    code: 'NAVERPAY',
    name: 'NaverPay',
    fullName: 'NaverPay',
    logo: '/logos/naverpay.svg',
    category: 'international',
    provider: 'magpie',
    region: 'International',
    type: 'e-wallet',
    brandColor: '#03C75A',
    displayOrder: 18,
  },
  {
    id: 'tosspay',
    code: 'TOSSPAY',
    name: 'Toss Pay',
    fullName: 'Toss Pay',
    logo: '/logos/tosspay.svg',
    category: 'international',
    provider: 'magpie',
    region: 'International',
    type: 'e-wallet',
    brandColor: '#7B61FF',
    displayOrder: 19,
  },
  {
    id: 'payco',
    code: 'PAYCO',
    name: 'PAYCO',
    fullName: 'PAYCO',
    logo: '/logos/payco.svg',
    category: 'international',
    provider: 'magpie',
    region: 'International',
    type: 'e-wallet',
    brandColor: '#FF4B4B',
    displayOrder: 20,
  },
];

/**
 * Categorized payment channels for UI display
 */
export const getPaymentChannelsByCategory = (
  category: PaymentChannelConfig['category']
): PaymentChannelConfig[] => {
  return PAYMENT_CHANNELS.filter(ch => ch.category === category)
    .sort((a, b) => a.displayOrder - b.displayOrder);
};

/**
 * Get payment channel by code
 */
export const getPaymentChannel = (code: string): PaymentChannelConfig | undefined => {
  return PAYMENT_CHANNELS.find(ch => ch.code === code.toUpperCase());
};

/**
 * Get payment channel by ID
 */
export const getPaymentChannelById = (id: string): PaymentChannelConfig | undefined => {
  return PAYMENT_CHANNELS.find(ch => ch.id === id.toLowerCase());
};

/**
 * Match incoming institution from API to payment channel
 */
export const matchInstitutionToChannel = (
  institutionCode: string,
  institutionName?: string
): PaymentChannelConfig | undefined => {
  const upperCode = institutionCode.toUpperCase();
  
  // Direct code match
  let channel = getPaymentChannel(upperCode);
  if (channel) return channel;
  
  // Name match
  if (institutionName) {
    const upperName = institutionName.toUpperCase();
    channel = PAYMENT_CHANNELS.find(
      ch => ch.fullName.toUpperCase() === upperName || ch.name.toUpperCase() === upperName
    );
    if (channel) return channel;
  }
  
  return undefined;
};

/**
 * Export all payment channels for UI rendering
 */
export const DIGITAL_WALLETS = getPaymentChannelsByCategory('digital_wallets');
export const BANKS = getPaymentChannelsByCategory('banks');
export const CARDS = getPaymentChannelsByCategory('cards');
export const QR_CODES = getPaymentChannelsByCategory('qr_code');
export const INTERNATIONAL = getPaymentChannelsByCategory('international');
