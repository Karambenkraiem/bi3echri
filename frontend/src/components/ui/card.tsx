import { HTMLAttributes } from 'react';

const ACCENT_CLASSES = {
  blue: 'border-t-4 border-t-blue-500',
  orange: 'border-t-4 border-t-orange-500',
  aqua: 'border-t-4 border-t-teal-500',
  yellow: 'border-t-4 border-t-amber-500',
  magenta: 'border-t-4 border-t-pink-500',
  green: 'border-t-4 border-t-emerald-500',
  violet: 'border-t-4 border-t-violet-500',
  red: 'border-t-4 border-t-red-500',
} as const;

export type CardAccent = keyof typeof ACCENT_CLASSES;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  accent?: CardAccent;
}

export function Card({ className = '', accent, ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_28px_-14px_rgba(15,23,42,0.18)] backdrop-blur-sm transition-shadow dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_10px_28px_-14px_rgba(0,0,0,0.5)] ${accent ? ACCENT_CLASSES[accent] : ''} ${className}`}
      {...props}
    />
  );
}
