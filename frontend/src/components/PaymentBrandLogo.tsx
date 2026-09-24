import { useEffect, useState } from 'react';
import { Building2, WalletCards } from 'lucide-react';
import { cn } from '@/lib/utils';
import { normalizeBrandKey, resolveBrandLogoPath } from '@/config/payment-logo-registry';

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
  const brandKey = normalizeBrandKey(brandName);
  const isWallet = ['gcash', 'maya', 'grabpay', 'alipay', 'kakaopay', 'tosspay', 'naverpay', 'payco', 'wechatpay'].some(key => brandKey.includes(key));
  const fallbackLabel = brandName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'PM';
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
      <span className={cn('inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-600', sizeClass, className)} role="img" aria-label={`${brandName} logo`}>
        {isWallet ? <WalletCards className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" /> : <Building2 className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />}
        <span>{fallbackLabel}</span>
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
