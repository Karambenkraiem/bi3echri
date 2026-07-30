'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { MarginByCategory } from '@/lib/types';
import { CATEGORICAL, CHART_AXIS, CHART_GRID } from '@/lib/chart-colors';
import { Card } from '@/components/ui/card';
import { formatDT } from '@/lib/format';

export function MarginByCategoryChart({ data }: { data: MarginByCategory[] }) {
  const chartData = data.map((d) => ({ ...d, name: d.categoryName }));

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
        Marge par catégorie
      </h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        Aide à décider quelles catégories d&apos;articles sont les plus rentables à commercialiser.
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: CHART_AXIS }}
              axisLine={{ stroke: CHART_GRID }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: CHART_AXIS }}
              axisLine={{ stroke: CHART_GRID }}
              tickLine={false}
              width={56}
            />
            <Tooltip
              formatter={(value) => [formatDT(Number(value)), 'Marge']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="totalMargin" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} maxBarSize={56}>
              <LabelList
                dataKey="totalMargin"
                position="top"
                formatter={(value) => formatDT(Number(value))}
                style={{ fontSize: 11, fill: CHART_AXIS }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
