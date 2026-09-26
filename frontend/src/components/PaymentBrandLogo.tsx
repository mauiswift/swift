import { useEffect, useState } from 'react';
import { Building2, WalletCards } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBrandLogoCandidates, normalizeBrandKey } from '@/config/payment-logo-registry';

interface PaymentBrandLogoProps {
  brand: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  logoUrl?: string;
}

export default function PaymentBrandLogo({ brand, size = 'md', className, logoUrl }: PaymentBrandLogoProps) {
  const brandName = String(brand || 'Payment').trim() || 'Payment';
  const [failedLogoPaths, setFailedLogoPaths] = useState<string[]>([]);
  const logoCandidates = getBrandLogoCandidates(brandName, logoUrl);
  const brandKey = normalizeBrandKey(brandName);
  const isWallet = ['gcash', 'maya', 'grabpay', 'alipay', 'kakaopay', 'tosspay', 'naverpay', 'payco', 'wechatpay'].some(key => brandKey.includes(key));
  const fallbackLabel = brandName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase() || 'PM';
  const fallbackTone = [
    'from-blue-50 to-indigo-100 text-indigo-700',
    'from-emerald-50 to-teal-100 text-teal-700',
    'from-amber-50 to-orange-100 text-orange-700',
    'from-violet-50 to-fuchsia-100 text-violet-700',
  ][brandKey.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4];
  const logoPath = logoCandidates.find(path => !failedLogoPaths.includes(path));
  useEffect(() => {
    setFailedLogoPaths([]);
  }, [brand, logoUrl]);
  const sizeClass = {
    sm: 'h-7 w-12',
    md: 'h-9 w-16',
    lg: 'h-11 w-20',
  }[size];

  if (!logoPath) {
    return (
      <span className={cn('inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-gradient-to-br text-[10px] font-bold uppercase tracking-wide', fallbackTone, sizeClass, className)} role="img" aria-label={`${brandName} logo`}>
        {isWallet ? <WalletCards className="h-3.5 w-3.5 opacity-70" aria-hidden="true" /> : <Building2 className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />}
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
          setFailedLogoPaths(paths => paths.includes(logoPath) ? paths : [...paths, logoPath]);
        }}
      />
    </span>
  );
}
