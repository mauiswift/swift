import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold leading-none select-none transition-all duration-200 ease-out hover:translate-y-[-1px] active:translate-y-[0px] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-[0px] [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primary: Full color with shadow
        primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg disabled:bg-slate-300',

        // Secondary: Dark background
        secondary: 'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700 shadow-md hover:shadow-lg disabled:bg-slate-400',

        // Outline: Bordered style
        outline: 'border border-slate-300 text-slate-900 bg-white hover:bg-slate-50 active:bg-slate-100 disabled:border-slate-200',

        // Tertiary: Minimal style
        tertiary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 disabled:bg-slate-100',

        // Danger: Destructive actions
        danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg disabled:bg-red-400',
        destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg disabled:bg-red-400',

        // Success: Positive actions
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-md hover:shadow-lg disabled:bg-emerald-400',

        // Ghost: Subtle action
        ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 hover:text-slate-900',

        // Link: Underlined text action
        link: 'text-blue-600 underline-offset-4 hover:underline hover:text-blue-700 active:text-blue-800 no-shadow',
        default: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg disabled:bg-slate-300',
      },
      size: {
        xs: 'h-8 px-2.5 text-xs',
        sm: 'h-9 px-3 text-xs',
        default: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
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
