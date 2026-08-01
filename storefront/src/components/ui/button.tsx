import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-violet-600 to-blue-600 text-white shadow-sm shadow-violet-600/20 hover:from-violet-500 hover:to-blue-500 hover:shadow-md hover:shadow-violet-600/25 focus-visible:ring-violet-500/50',
  secondary:
    'border border-slate-300 bg-white/60 text-slate-700 hover:border-slate-400 hover:bg-white dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 focus-visible:ring-slate-400/50',
  danger:
    'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-sm shadow-red-600/20 hover:from-red-500 hover:to-rose-500 hover:shadow-md hover:shadow-rose-600/25 focus-visible:ring-red-500/50',
  ghost:
    'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus-visible:ring-slate-400/50',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', className = '', ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
