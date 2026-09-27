import { describe, expect, it } from 'vitest';
import { resolveBrandLogoPath } from '@/config/payment-logo-registry';
import { getTransactionPaymentMethodBrand } from './paymentMethodBranding';

describe('getTransactionPaymentMethodBrand', () => {
  it('uses the selected payment method rather than the generic transaction type', () => {
    const brand = getTransactionPaymentMethodBrand({
      transaction_type: 'swiftpay_qr',
      payment_method: 'GCASH',
    });
    expect(brand).toBe('GCash');
    expect(resolveBrandLogoPath(brand)).toBe('/logos/gcash.png');
  });

  it('maps known QR transaction types to official brands for existing records', () => {
    expect(getTransactionPaymentMethodBrand({ transaction_type: 'alipay_qr' })).toBe('Alipay');
    expect(getTransactionPaymentMethodBrand({ transaction_type: 'swiftpay_qr' })).toBe('QRPH');
  });

  it('preserves institution codes so the official logo registry can resolve them', () => {
    expect(getTransactionPaymentMethodBrand({
      transaction_type: 'invoice',
      payment_method: 'BDO',
    })).toBe('BDO');
  });
});
