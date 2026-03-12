'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { OneRMSeries } from '@/lib/hevy';
import { useUnits } from '@/lib/units';

interface Props {
  series: OneRMSeries[];
}

type TooltipProps = {
  active?: boolean;
  payload?: { payload: { date: string; estimated_1rm_kg: number } }[];
};

export function OneRMChart({ series }: Props) {
  const { toDisplay, unit, fmtWeight } = useUnits();
  const [selectedId, setSelectedId] = useState<string>(series[0]?.exercise_template_id ?? '');

  const selected = useMemo(
    () => series.find((s) => s.exercise_template_id === selectedId) ?? series[0],
    [series, selectedId]
  );

  const chartData = useMemo(() => {
    if (!selected) return [];
    return selected.points.map((p) => ({
      date: p.date,
      estimated_1rm_kg: p.estimated_1rm_kg,
      display: toDisplay(p.estimated_1rm_kg),
    }));
  }, [selected, toDisplay]);

  const peak = useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((best, d) => d.display > best.display ? d : best);
  }, [chartData]);

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs shadow-xl">
        <div className="font-medium text-zinc-200 mb-1">{d.date}</div>
        <div className="text-zinc-400">
          Est. 1RM:{' '}
          <span className="text-zinc-100 font-semibold">{fmtWeight(d.estimated_1rm_kg)}</span>
        </div>
      </div>
    );
  };

  if (series.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full flex items-center justify-center">
        <p className="text-sm text-zinc-500">No compound lift data found</p>
      </div>
    );
  }

  const yMin = chartData.length ? Math.floor(Math.min(...chartData.map((d) => d.display)) * 0.92) : 0;
  const yMax = chartData.length ? Math.ceil(Math.max(...chartData.map((d) => d.display)) * 1.05) : 100;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Estimated 1RM</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Epley formula · weight × (1 + reps/30)</p>
        </div>
        {peak && (
          <div className="text-right">
            <div className="text-2xl font-bold text-zinc-100 tabular-nums">
              {fmtWeight(peak.estimated_1rm_kg)}
            </div>
            <div className="text-xs text-zinc-500">peak on {peak.date}</div>
          </div>
        )}
      </div>

      {/* Exercise selector */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {series.map((s) => (
          <button
            key={s.exercise_template_id}
            onClick={() => setSelectedId(s.exercise_template_id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedId === s.exercise_template_id
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {s.exercise_title.replace(/\s*\(.*?\)\s*/g, '').trim()}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
            tickFormatter={(v: string) =>
              new Date(v + 'T12:00:00Z').toLocaleString('default', {
                month: 'short',
                day: 'numeric',
                timeZone: 'UTC',
              })
            }
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: '#71717a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => Math.round(v).toString()}
          />
          <Tooltip content={<CustomTooltip />} />
          {peak && (
            <ReferenceLine
              y={peak.display}
              stroke="#6366f1"
              strokeDasharray="4 2"
              label={{ value: `PR ${fmtWeight(peak.estimated_1rm_kg)}`, fill: '#818cf8', fontSize: 10, position: 'right' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="display"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#6366f1' }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-2 text-xs text-zinc-600 text-right">
        Y axis in {unit}
      </div>
    </div>
  );
}
