import { describe, expect, it } from 'vitest';

import {
  buildPermanentPaymentLink,
  PERMANENT_LINK_CURRENCIES,
} from './permanentLink';

describe('buildPermanentPaymentLink', () => {
  it.each(PERMANENT_LINK_CURRENCIES)('builds the %s link', (currency) => {
    expect(buildPermanentPaymentLink('https://kr.swiftpay.site/', 'my-store', currency))
      .toBe(`https://kr.swiftpay.site/pay/my-store-${currency}`);
  });

  it('rejects unsupported currencies', () => {
    expect(() => buildPermanentPaymentLink('https://kr.swiftpay.site', 'my-store', 'USD'))
      .toThrow('Unsupported permanent link currency');
  });
});
