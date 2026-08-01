import { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-14px_rgba(15,23,42,0.18)] backdrop-blur-sm transition-shadow dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_10px_28px_-14px_rgba(0,0,0,0.5)] ${className}`}
      {...props}
    />
  );
}
