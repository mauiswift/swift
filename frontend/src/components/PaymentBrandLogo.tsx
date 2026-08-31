import { useState } from 'react';
import { cn } from '@/lib/utils';
import { OFFICIAL_BRAND_LOGO_REGISTRY, normalizeBrandKey } from '@/config/payment-logo-registry';

const LOGO_PATHS: Record<string, string> = OFFICIAL_BRAND_LOGO_REGISTRY;

const normalizeBrand = (value: string) => normalizeBrandKey(value);

interface PaymentBrandLogoProps {
  brand: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PaymentBrandLogo({ brand, size = 'md', className }: PaymentBrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const logoPath = LOGO_PATHS[normalizeBrand(brand)];
  const sizeClass = { sm: 'h-6 w-6', md: 'h-8 w-8', lg: 'h-10 w-10' }[size];

  if (!logoPath || failed) {
    return (
      <span className={cn('inline-flex shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500', sizeClass, className)} aria-label={`${brand} logo`}>
        {brand.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-md bg-white p-1', sizeClass, className)}>
      <img
        src={logoPath}
        alt={`${brand} logo`}
        className="h-full w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export { LOGO_PATHS };
