'use client';

import { useState } from 'react';
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
import { SessionQualityResult } from '@/lib/hevy';

interface Props {
  qualities: SessionQualityResult[];
}

function scoreColor(score: number): string {
  if (score >= 7.5) return '#22c55e';
  if (score >= 5) return '#f59e0b';
  return '#ef4444';
}

const CustomDot = (props: { cx?: number; cy?: number; payload?: SessionQualityResult }) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={scoreColor(payload.score)}
      stroke="#18181b"
      strokeWidth={1.5}
    />
  );
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SessionQualityResult }[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs shadow-xl">
      <div className="font-semibold text-zinc-200 mb-2">{d.date}</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Overall</span>
          <span className="font-bold" style={{ color: scoreColor(d.score) }}>{d.score}/10</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Density</span>
          <span className="text-zinc-200">{d.density_score.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Completeness</span>
          <span className="text-zinc-200">{d.completeness_score.toFixed(1)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-zinc-400">Timing</span>
          <span className="text-zinc-200">{d.timing_score.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

export function SessionQuality({ qualities }: Props) {
  const recent = qualities.slice(-60);
  const avgScore = recent.length > 0
    ? (recent.reduce((sum, q) => sum + q.score, 0) / recent.length).toFixed(1)
    : '—';

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Session Quality</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Density · Completeness · Timing</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: parseFloat(avgScore) >= 7 ? '#22c55e' : parseFloat(avgScore) >= 5 ? '#f59e0b' : '#ef4444' }}>
            {avgScore}
          </div>
          <div className="text-xs text-zinc-500">avg score</div>
        </div>
      </div>

      {recent.length < 2 ? (
        <div className="flex h-48 items-center justify-center text-zinc-500 text-sm">
          Need more sessions for quality scoring
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={recent} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#71717a', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={Math.floor(recent.length / 6)}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={7.5} stroke="#22c55e" strokeDasharray="4 2" strokeOpacity={0.5} />
            <ReferenceLine y={5} stroke="#f59e0b" strokeDasharray="4 2" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#71717a"
              strokeWidth={1.5}
              dot={<CustomDot />}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
