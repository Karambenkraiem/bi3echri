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
import { ChannelPerformance } from '@/lib/types';
import { CATEGORICAL, CHART_AXIS, CHART_GRID } from '@/lib/chart-colors';
import { Card } from '@/components/ui/card';
import { formatDT } from '@/lib/format';

export function ChannelPerformanceChart({ data }: { data: ChannelPerformance[] }) {
  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">
        Performance par canal d&apos;annonce
      </h2>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        Où vendre en priorité selon la marge générée.
      </p>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
            <XAxis
              dataKey="channel"
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
              formatter={(value) => formatDT(Number(value))}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="totalMargin" name="Marge" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
