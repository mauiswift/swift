import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { resolveBrandLogoPath } from '@/config/payment-logo-registry';

interface PaymentBrandLogoProps {
  brand: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  logoUrl?: string;
}

export default function PaymentBrandLogo({ brand, size = 'md', className, logoUrl }: PaymentBrandLogoProps) {
  const brandName = String(brand || 'Payment').trim() || 'Payment';
  const [failedOfficialLogo, setFailedOfficialLogo] = useState(false);
  const [failedProviderLogo, setFailedProviderLogo] = useState(false);
  const officialLogoPath = resolveBrandLogoPath(brandName);
  const logoPath = failedProviderLogo
    ? undefined
    : (failedOfficialLogo ? logoUrl : (officialLogoPath || logoUrl));
  useEffect(() => {
    setFailedOfficialLogo(false);
    setFailedProviderLogo(false);
  }, [brand, logoUrl]);
  const sizeClass = {
    sm: 'h-7 w-12',
    md: 'h-9 w-16',
    lg: 'h-11 w-20',
  }[size];

  if (!logoPath) {
    return (
      <span className={cn('inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500', sizeClass, className)} role="img" aria-label={`${brandName} logo`}>
        {brandName.slice(0, 2).toUpperCase()}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm', sizeClass, className)} role="img" aria-label={`${brandName} logo`}>
      <img
        src={logoPath}
        alt={`${brandName} logo`}
        className="h-full w-full object-contain"
        onError={() => {
          if (logoPath === officialLogoPath && logoUrl) {
            setFailedOfficialLogo(true);
          } else {
            setFailedProviderLogo(true);
          }
        }}
      />
    </span>
  );
}
