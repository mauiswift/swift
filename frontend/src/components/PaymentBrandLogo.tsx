import { useState } from 'react';
import { cn } from '@/lib/utils';
import { OFFICIAL_BRAND_LOGO_REGISTRY, normalizeBrandKey } from '@/config/payment-logo-registry';

const LOGO_PATHS: Record<string, string> = OFFICIAL_BRAND_LOGO_REGISTRY;

const normalizeBrand = (value: string) => normalizeBrandKey(value);

interface PaymentBrandLogoProps {
  brand: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  logoUrl?: string;
}

export default function PaymentBrandLogo({ brand, size = 'md', className, logoUrl }: PaymentBrandLogoProps) {
  const [failed, setFailed] = useState(false);
  const logoPath = LOGO_PATHS[normalizeBrand(brand)] || logoUrl;
  const sizeClass = {
    sm: 'h-7 min-w-16 max-w-24 px-1.5',
    md: 'h-9 min-w-20 max-w-32 px-2',
    lg: 'h-11 min-w-24 max-w-40 px-2.5',
  }[size];

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
        className="max-h-full max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export { LOGO_PATHS };
