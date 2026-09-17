import { cn } from '@/lib/utils';

interface CheckoutPoweredByProps {
  className?: string;
}

export function CheckoutPoweredBy({ className }: CheckoutPoweredByProps) {
  return (
    <footer className={cn('checkout-powered-by', className)}>
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
