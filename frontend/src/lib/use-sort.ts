import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export function useSort<T, K extends string>(
  items: T[] | undefined,
  getValue: (item: T, key: K) => string | number,
  initialKey: K,
  initialDirection: SortDirection = 'desc',
) {
  const [sortKey, setSortKey] = useState<K>(initialKey);
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

  function toggleSort(key: K) {
    if (key === sortKey) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  const sorted = useMemo(() => {
    if (!items) return items;
    const copy = [...items];
    copy.sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      let cmp: number;
      if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), 'fr', { sensitivity: 'base' });
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [items, sortKey, sortDirection, getValue]);

  return { sorted, sortKey, sortDirection, toggleSort };
}
