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
  const [failedCustomLogo, setFailedCustomLogo] = useState(false);
  const officialLogoPath = resolveBrandLogoPath(brand);
  const logoPath = !failedOfficialLogo && officialLogoPath
    ? officialLogoPath
    : !failedCustomLogo
      ? logoUrl
      : undefined;
  const sizeClass = {
    sm: 'h-7 min-w-16 max-w-24 px-1.5',
    md: 'h-9 min-w-20 max-w-32 px-2',
    lg: 'h-11 min-w-24 max-w-40 px-2.5',
  }[size];

  if (!logoPath) {
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
        onError={() => {
          if (logoPath === officialLogoPath && logoUrl) {
            setFailedOfficialLogo(true);
          } else {
            setFailedCustomLogo(true);
          }
        }}
      />
    </span>
  );
}
