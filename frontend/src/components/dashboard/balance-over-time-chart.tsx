'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BalanceOverTimePoint } from '@/lib/types';
import { CATEGORICAL, CHART_AXIS, CHART_GRID } from '@/lib/chart-colors';
import { formatDT } from '@/lib/format';

export function BalanceOverTimeChart({ data }: { data: BalanceOverTimePoint[] }) {
  return (
    <div className="h-72 w-full">
      {data.length === 0 ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          Aucun mouvement enregistré.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
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
              width={64}
            />
            <Tooltip
              formatter={(value) => [formatDT(Number(value)), 'Solde']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Line
              type="monotone"
              dataKey="balance"
              name="Solde"
              stroke={CATEGORICAL[0]}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
