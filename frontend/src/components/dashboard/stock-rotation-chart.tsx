'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StockRotation } from '@/lib/types';
import { CATEGORICAL, CHART_AXIS, CHART_GRID } from '@/lib/chart-colors';
import { Card } from '@/components/ui/card';

export function StockRotationChart({ data }: { data: StockRotation[] }) {
  const chartData = data.map((d) => ({ ...d, name: d.categoryName }));

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
        Vitesse de rotation du stock
      </h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        Nombre moyen de jours entre l&apos;achat et la vente, par catégorie.
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: CHART_AXIS }}
              axisLine={{ stroke: CHART_GRID }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: CHART_AXIS }}
              axisLine={{ stroke: CHART_GRID }}
              tickLine={false}
              width={110}
            />
            <Tooltip
              formatter={(value) => [`${value ?? 0} jours`, 'Délai moyen']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="avgDaysToSell" fill={CATEGORICAL[2]} radius={[0, 4, 4, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
