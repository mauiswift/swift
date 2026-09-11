import { useState } from 'react';
import { cn } from '@/lib/utils';
import { resolveBrandLogoPath } from '@/config/payment-logo-registry';

interface PaymentBrandLogoProps {
  brand: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  logoUrl?: string;
}

export default function PaymentBrandLogo({ brand, size = 'md', className, logoUrl }: PaymentBrandLogoProps) {
  const [failedOfficialLogo, setFailedOfficialLogo] = useState(false);
  const officialLogoPath = resolveBrandLogoPath(brand);
  const logoPath = !failedOfficialLogo ? officialLogoPath : undefined;
  const sizeClass = {
    sm: 'h-7 w-12',
    md: 'h-9 w-16',
    lg: 'h-11 w-20',
  }[size];

  if (!logoPath) {
    return (
      <span className={cn('inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-500', sizeClass, className)} aria-label={`${brand} logo`}>
        {brand.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white p-1.5 shadow-sm', sizeClass, className)}>
      <img
        src={logoPath}
        alt={`${brand} logo`}
        className="h-full w-full object-contain"
        onError={() => {
          setFailedOfficialLogo(true);
        }}
      />
    </span>
  );
}
