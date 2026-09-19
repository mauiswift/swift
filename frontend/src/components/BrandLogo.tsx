import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  variant?: 'default' | 'white';
  src?: string | null;
  alt?: string;
  className?: string;
  markClassName?: string;
  showName?: boolean;
}

export function BrandMark({ className, color = '#0B63FF' }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('h-8 w-8', className)}>
      <circle cx="16" cy="5" r="2.5" fill={color} />
      <circle cx="16" cy="27" r="2.5" fill={color} />
      <circle cx="10" cy="20.5" r="2.5" fill={color} />
      <circle cx="10" cy="9.5" r="2.5" fill={color} />
      <circle cx="22" cy="20.5" r="2.5" fill={color} />
      <circle cx="16" cy="15" r="2.5" fill={color} />
      <circle cx="22" cy="9.5" r="2.5" fill={color} />
    </svg>
  );
}

export default function BrandLogo({
  variant = 'default',
  src,
  alt = 'SwiftPay',
  className,
  markClassName,
  showName = false,
}: BrandLogoProps) {
  const defaultSrc = variant === 'white' ? '/logo-white.svg' : '/logo.svg';
  const [logoSrc, setLogoSrc] = useState(src || defaultSrc);

  useEffect(() => {
    setLogoSrc(src || defaultSrc);
  }, [src, defaultSrc]);

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2', className)}>
      {logoSrc && (
        <img
          src={logoSrc}
          alt={showName ? alt : `${alt} logo`}
          className="h-full max-w-full w-auto object-contain"
          onError={() => setLogoSrc('')}
        />
      )}
      {!logoSrc && (
        <span className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-lg p-1.5',
          variant === 'white' ? 'bg-white/10' : 'bg-slate-100',
        )}>
          <BrandMark className={cn('h-6 w-6', markClassName)} color={variant === 'white' ? '#FFFFFF' : '#0B63FF'} />
        </span>
      )}
      {showName && <span className={cn('truncate', variant === 'white' ? 'text-white' : 'text-slate-900')}>{alt}</span>}
    </span>
  );
}
