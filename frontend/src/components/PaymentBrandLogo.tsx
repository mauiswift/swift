import { useState } from 'react';
import { cn } from '@/lib/utils';

const LOGO_PATHS: Record<string, string> = {
  gcash: '/logos/gcash.svg',
  maya: '/logos/maya.svg',
  grabpay: '/logos/grab.svg',
  bdo: '/logos/bdo.svg',
  bpi: '/logos/bpi.svg',
  metrobank: '/logos/metrobank.svg',
  unionbank: '/logos/unionbank.svg',
  securitybank: '/logos/security-bank.svg',
  secbank: '/logos/security-bank.svg',
  landbank: '/logos/landbank.svg',
  rcbc: '/logos/rcbc.svg',
  psbank: '/logos/psbank.svg',
  aub: '/logos/asia-united-bank.svg',
  asiaunited: '/logos/asia-united-bank.svg',
  netbank: '/logos/va.svg',
  usdt: '/logos/tether.svg',
  visa: '/logos/visa.svg',
  mastercard: '/logos/mastercard.svg',
  alipay: '/logos/alipay.svg',
  wechat: '/logos/wechat.svg',
  qrph: '/logos/qrph.svg',
};

const normalizeBrand = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

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
