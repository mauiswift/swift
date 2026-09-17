import { cn } from '@/lib/utils';
import PaymentBrandLogo from '@/components/PaymentBrandLogo';

interface CheckoutPoweredByProps {
  className?: string;
  currency?: string;
}

const PAYMENT_LOGOS: Record<string, string[]> = {
  PHP: ['Visa', 'Mastercard', 'GCash', 'Maya'],
  KRW: ['Visa', 'Mastercard', 'Toss Pay', 'KakaoPay'],
  CNY: ['Alipay', 'WeChat Pay', 'UnionPay'],
  USD: ['Visa', 'Mastercard', 'Stripe'],
  USDT: ['Visa', 'Mastercard', 'Tether', 'USDC'],
  DEFAULT: ['Visa', 'Mastercard'],
};

export function CheckoutPoweredBy({ className, currency = 'PHP' }: CheckoutPoweredByProps) {
  const brands = PAYMENT_LOGOS[currency.trim().toUpperCase()] || PAYMENT_LOGOS.DEFAULT;

  return (
    <footer className={cn('checkout-powered-by', className)}>
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
