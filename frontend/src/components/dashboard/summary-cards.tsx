import { AnalyticsSummary } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { formatDT } from '@/lib/format';

export function SummaryCards({ summary }: { summary: AnalyticsSummary }) {
  const tiles = [
    { label: 'Articles en stock', value: summary.stockCount.toString() },
    { label: 'Valeur du stock', value: formatDT(summary.stockValue) },
    { label: 'Ventes réalisées', value: summary.salesCount.toString() },
    { label: 'Chiffre d\'affaires', value: formatDT(summary.totalRevenue) },
    {
      label: 'Marge totale',
      value: formatDT(summary.totalMargin),
      accent: summary.totalMargin >= 0 ? 'text-emerald-600' : 'text-red-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => (
        <Card key={tile.label}>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {tile.label}
          </p>
          <p className={`mt-1 text-xl font-semibold text-slate-900 dark:text-white ${tile.accent ?? ''}`}>
            {tile.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
