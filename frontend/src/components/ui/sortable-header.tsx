import { ReactNode } from 'react';
import { SortIcon } from './icons';
import { SortDirection } from '@/lib/use-sort';

export function SortableHeader({
  active,
  direction,
  onClick,
  children,
}: {
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        className={`-mx-1.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium uppercase tracking-wide transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${
          active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        {children}
        <SortIcon direction={active ? direction : false} />
      </button>
    </th>
  );
}
