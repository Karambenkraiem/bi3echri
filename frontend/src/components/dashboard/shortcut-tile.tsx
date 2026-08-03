import { ComponentType, SVGProps } from 'react';
import Link from 'next/link';

const COLOR_CLASSES = {
  blue: 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300 group-hover:bg-blue-500 group-hover:text-white',
  orange:
    'bg-orange-500/10 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300 group-hover:bg-orange-500 group-hover:text-white',
  aqua: 'bg-teal-500/10 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300 group-hover:bg-teal-500 group-hover:text-white',
  yellow:
    'bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300 group-hover:bg-amber-500 group-hover:text-white',
  magenta:
    'bg-pink-500/10 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300 group-hover:bg-pink-500 group-hover:text-white',
  green:
    'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300 group-hover:bg-emerald-500 group-hover:text-white',
  violet:
    'bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300 group-hover:bg-violet-500 group-hover:text-white',
  red: 'bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-300 group-hover:bg-red-500 group-hover:text-white',
  indigo:
    'bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white',
} as const;

export type ShortcutColor = keyof typeof COLOR_CLASSES;

interface ShortcutTileProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  color: ShortcutColor;
  href?: string;
  onClick?: () => void;
}

export function ShortcutTile({ icon: Icon, label, color, href, onClick }: ShortcutTileProps) {
  const content = (
    <>
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${COLOR_CLASSES[color]}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
    </>
  );

  const className =
    'group flex flex-col items-start gap-2 rounded-xl border border-slate-200/70 bg-white/80 p-3 text-left shadow-sm backdrop-blur-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg active:translate-y-0 active:scale-[0.98] dark:border-slate-800/70 dark:bg-slate-900/80 dark:hover:border-slate-700';

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
