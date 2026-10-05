import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBankBrandColor, getBankDisplayName, getBankInitials, getBankLogo } from '@/lib/bankBranding';

interface BankLogoProps {
  name: string;
  code?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
  lg: 'h-14 w-14',
};

export default function BankLogo({ name, code, className, size = 'md' }: BankLogoProps) {
  const displayName = getBankDisplayName(name);
  const logo = getBankLogo(name, code);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logo]);

  if (logo && !logoFailed) {
    return (
      <span
        className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-sm transition-all', sizeClasses[size], className)}
        role="img"
        aria-label={`${displayName} logo`}
        title={displayName}
      >
        <img
          src={logo}
          alt=""
          className="h-full w-full object-contain transition-opacity duration-200"
          onError={() => setLogoFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn('inline-flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-slate-200 text-slate-800 shadow-sm transition-all', sizeClasses[size], className)}
      style={{ backgroundColor: getBankBrandColor(displayName, code) }}
      role="img"
      aria-label={`${displayName} icon`}
      title={displayName}
    >
      <Building2 className="h-4 w-4 opacity-75" aria-hidden="true" />
      <span className="max-w-full truncate px-0.5 text-[9px] font-extrabold uppercase leading-none tracking-tight">
        {getBankInitials(displayName, code)}
      </span>
    </span>
  );
}
