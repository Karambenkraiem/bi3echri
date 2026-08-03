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
import { VisitsPoint } from '@/lib/types';
import { CATEGORICAL, CHART_AXIS, CHART_GRID } from '@/lib/chart-colors';
import { Card } from '@/components/ui/card';

export function VisitsChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: VisitsPoint[];
}) {
  const total = data.reduce((sum, d) => sum + d.visits, 0);

  return (
    <Card>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block text-lg font-bold text-slate-900 dark:text-white">{total}</span>
          <span className="block text-xs text-slate-500 dark:text-slate-400">visites</span>
        </p>
      </div>
      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Aucune visite enregistrée sur cette période.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12, fill: CHART_AXIS }}
                axisLine={{ stroke: CHART_GRID }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: CHART_AXIS }}
                axisLine={{ stroke: CHART_GRID }}
                tickLine={false}
                width={40}
                allowDecimals={false}
              />
              <Tooltip
                formatter={(value) => [`${value}`, 'Visites']}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="visits" name="Visites" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
