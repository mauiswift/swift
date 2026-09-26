import { cn } from '@/lib/utils';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';
import { getCheckoutPaymentBrands, type PaymentChannels } from '@/lib/paymentChannels';

interface CheckoutPoweredByProps {
  className?: string;
  currency?: string;
  paymentChannels: PaymentChannels | null;
}

export function CheckoutPoweredBy({ className, currency = 'PHP', paymentChannels }: CheckoutPoweredByProps) {
  const brands = getCheckoutPaymentBrands(paymentChannels, currency);

  return (
    <footer className={cn('checkout-powered-by', className)}>
      <p className="mb-4 text-center text-[11px] leading-relaxed text-slate-500">
        By continuing, you acknowledge that you are authorizing this payment to the merchant shown above.
      </p>
      {brands.length > 0 && (
        <div className="checkout-payment-logos" aria-label={`Accepted ${currency.toUpperCase()} payment methods`}>
          <span className="checkout-payment-logos-label">Accepted payment methods</span>
          <div className="checkout-payment-logos-list">
            {brands.map(brand => (
              <PaymentBrandLogo
                key={brand}
                brand={brand}
                size="sm"
                className="checkout-payment-logo"
              />
            ))}
          </div>
        </div>
      )}
      <div className="checkout-compliance-badges" aria-label="Security and compliance certifications">
        {[
          { src: '/logos/compliance/iso-27001.webp', alt: 'ISO/IEC 27001 certified' },
          { src: '/logos/compliance/bsp.webp', alt: 'Bangko Sentral ng Pilipinas' },
          { src: '/logos/compliance/pci-dss.webp', alt: 'PCI DSS compliant' },
        ].map(badge => (
          <div key={badge.src} className="checkout-compliance-badge">
            <img src={badge.src} alt={badge.alt} />
          </div>
        ))}
      </div>
      <span className="checkout-powered-by-label">Powered by</span>
      <a
        href="https://drltechnology.com"
        target="_blank"
        rel="noreferrer"
        className="checkout-powered-by-brand"
        aria-label="DRL Technology"
      >
        <img
          src="/partners/drl-technology-gold.png"
          alt="DRL Technology"
          className="checkout-powered-by-logo"
        />
      </a>
    </footer>
  );
}
