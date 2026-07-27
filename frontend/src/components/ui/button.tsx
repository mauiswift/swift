import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // Primary: Brand blue call-to-action
        default: 'bg-brand-blue-600 text-white hover:bg-brand-blue-700 active:bg-brand-blue-800 shadow-sm shadow-brand-blue-500/20 disabled:hover:bg-brand-blue-600',
        
        // Secondary: Neutral elevated action
        secondary:
          'bg-slate-950 text-white hover:bg-slate-900 active:bg-slate-800 shadow-sm shadow-slate-900/10 disabled:hover:bg-slate-950',
        
        // Outline: Soft neutral outline
        outline:
          'border border-slate-300 text-slate-900 hover:bg-slate-50 active:bg-slate-100 disabled:hover:border-slate-300 disabled:hover:bg-transparent',
        
        // Destructive: Warning actions
        destructive:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-500/10 disabled:hover:bg-red-600',
        
        // Ghost: Subtle action
        ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 hover:text-slate-900',
        
        // Link: Underlined text action
        link: 'text-brand-blue-600 underline-offset-4 hover:underline hover:text-brand-blue-700 active:text-brand-blue-800',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 rounded-lg px-3 text-xs font-semibold',
        lg: 'h-12 rounded-xl px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
