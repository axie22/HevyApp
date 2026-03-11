'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AcwrResult } from '@/lib/hevy';
import { DangerBadge } from './DangerBadge';

interface Props {
  results: AcwrResult[];
}

function statusColor(status: AcwrResult['status']): string {
  switch (status) {
    case 'danger': return '#ef4444';
    case 'optimal': return '#22c55e';
    case 'undertrained': return '#f59e0b';
    default: return '#71717a';
  }
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: AcwrResult }[] }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs shadow-xl">
      <div className="font-semibold text-zinc-200 mb-1 capitalize">{d.muscle_group}</div>
      <div className="text-zinc-400">ACWR: <span className="text-zinc-200 font-medium">{d.ratio.toFixed(2)}</span></div>
      <div className="text-zinc-400">Acute: <span className="text-zinc-200">{Math.round(d.acute_load)} kg</span></div>
      <div className="text-zinc-400">Chronic: <span className="text-zinc-200">{Math.round(d.chronic_load)} kg</span></div>
    </div>
  );
};

export function AcwrChart({ results }: Props) {
  const displayData = results
    .filter((r) => r.status !== 'insufficient_data')
    .slice(0, 12);

  const dangerCount = results.filter((r) => r.status === 'danger').length;
  const undertrainedCount = results.filter((r) => r.status === 'undertrained').length;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Fatigue & Recovery</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Acute:Chronic Workload Ratio by muscle group</p>
        </div>
        <div className="flex gap-2">
          {dangerCount > 0 && <DangerBadge level="danger" label={`${dangerCount} danger`} />}
          {undertrainedCount > 0 && <DangerBadge level="warning" label={`${undertrainedCount} undertrained`} />}
        </div>
      </div>

      {displayData.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-zinc-500 text-sm">
          Not enough data yet — train more muscle groups to see ACWR analysis
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={displayData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="muscle_group"
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'Danger 1.5', fill: '#ef4444', fontSize: 10 }} />
            <ReferenceLine y={0.8} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: 'Under 0.8', fill: '#f59e0b', fontSize: 10 }} />
            <Bar dataKey="ratio" radius={[4, 4, 0, 0]}>
              {displayData.map((entry, i) => (
                <Cell key={i} fill={statusColor(entry.status)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}

      <div className="mt-3 flex gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Optimal (0.8–1.5)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Danger (&gt;1.5)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Undertrained (&lt;0.8)</span>
      </div>
    </div>
  );
}
