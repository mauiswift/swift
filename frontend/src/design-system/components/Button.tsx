import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export default function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue-500';
  const styles = {
    primary: 'bg-[hsl(var(--brand-blue-500))] text-white shadow-lg shadow-brand-blue-500/15 hover:bg-[hsl(var(--brand-blue-600))] active:bg-[hsl(var(--brand-blue-700))]',
    secondary: 'bg-slate-950 text-white border border-slate-800 hover:bg-slate-900 active:bg-slate-800',
    ghost: 'bg-transparent text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 active:bg-slate-200',
  } as const;

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
