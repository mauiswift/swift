import { cn } from '@/lib/utils';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';

interface CheckoutPoweredByProps {
  className?: string;
  currency?: string;
}

const PAYMENT_LOGOS: Record<string, string[]> = {
  PHP: ['Visa', 'Mastercard', 'GCash', 'Maya'],
  KRW: ['Bank transfer'],
  CNY: ['Alipay', 'WeChat Pay', 'UnionPay'],
  USD: ['Visa', 'Mastercard', 'Stripe'],
  USDT: ['Visa', 'Mastercard', 'Tether', 'USDC'],
  DEFAULT: ['Visa', 'Mastercard'],
};

export function CheckoutPoweredBy({ className, currency = 'PHP' }: CheckoutPoweredByProps) {
  const brands = PAYMENT_LOGOS[currency.trim().toUpperCase()] || PAYMENT_LOGOS.DEFAULT;

  return (
    <footer className={cn('checkout-powered-by', className)}>
      <p className="mb-4 text-center text-[11px] leading-relaxed text-slate-500">
        By continuing, you acknowledge that you are authorizing this payment to the merchant shown above.
      </p>
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
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3" aria-label="Security and compliance certifications">
        {[
          { src: '/logos/compliance/iso-27001.webp', alt: 'ISO/IEC 27001 certified' },
          { src: '/logos/compliance/bsp.webp', alt: 'Bangko Sentral ng Pilipinas' },
          { src: '/logos/compliance/pci-dss.webp', alt: 'PCI DSS compliant' },
        ].map(badge => (
          <div key={badge.src} className="flex h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <img src={badge.src} alt={badge.alt} className="h-8 w-auto object-contain" />
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
