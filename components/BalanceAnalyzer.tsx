'use client';

import { useMemo, useState } from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { EnrichedWorkout, BalanceResult } from '@/lib/hevy';
import { analyzeBalance } from '@/lib/analytics';
import { DangerBadge } from './DangerBadge';

interface Props {
  workouts: EnrichedWorkout[];
  initialBalance: BalanceResult;
}

type Period = 30 | 90 | 365;

function RatioGauge({
  label,
  ratio,
  leftLabel,
  rightLabel,
  dangerThreshold,
}: {
  label: string;
  ratio: number;
  leftLabel: string;
  rightLabel: string;
  dangerThreshold: number;
}) {
  // Normalize ratio to 0–100% where 1.0 ratio = 50%
  const clampedRatio = Math.min(ratio, dangerThreshold * 1.2);
  const pct = Math.round((clampedRatio / (dangerThreshold * 1.2)) * 100);
  const isWarning = ratio > dangerThreshold;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-zinc-400">{label}</span>
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="60%"
            outerRadius="90%"
            data={[{ value: pct, fill: isWarning ? '#ef4444' : '#22c55e' }]}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" cornerRadius={4} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
          <span className={`text-sm font-bold ${isWarning ? 'text-red-400' : 'text-emerald-400'}`}>
            {ratio === 99 ? '∞' : ratio.toFixed(1)}x
          </span>
        </div>
      </div>
      <div className="flex w-full justify-between text-xs text-zinc-500 px-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

export function BalanceAnalyzer({ workouts, initialBalance }: Props) {
  const [period, setPeriod] = useState<Period>(30);

  const balance = useMemo(() => {
    if (period === initialBalance.period_days) return initialBalance;
    return analyzeBalance(workouts, period);
  }, [period, workouts, initialBalance]);

  const periods: Period[] = [30, 90, 365];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Strength Balance</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Push/pull & quad/hip volume ratios</p>
        </div>
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden text-xs">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 transition-colors ${
                period === p
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {p === 365 ? '1Y' : `${p}D`}
            </button>
          ))}
        </div>
      </div>

      {balance.push_volume === 0 && balance.pull_volume === 0 ? (
        <div className="flex h-40 items-center justify-center text-zinc-500 text-sm">
          No push/pull data for this period
        </div>
      ) : (
        <>
          <div className="flex justify-around py-2">
            <RatioGauge
              label="Push / Pull"
              ratio={balance.push_pull_ratio}
              leftLabel="Pull"
              rightLabel="Push"
              dangerThreshold={2.0}
            />
            <RatioGauge
              label="Quad / Hip"
              ratio={balance.quad_hip_ratio}
              leftLabel="Hip"
              rightLabel="Quad"
              dangerThreshold={2.5}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-500">
            <div className="rounded-lg bg-zinc-800/50 p-2">
              <div className="text-zinc-400 font-medium">Push</div>
              <div className="text-zinc-200">{Math.round(balance.push_volume).toLocaleString()} kg</div>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2">
              <div className="text-zinc-400 font-medium">Pull</div>
              <div className="text-zinc-200">{Math.round(balance.pull_volume).toLocaleString()} kg</div>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2">
              <div className="text-zinc-400 font-medium">Quad</div>
              <div className="text-zinc-200">{Math.round(balance.quad_volume).toLocaleString()} kg</div>
            </div>
            <div className="rounded-lg bg-zinc-800/50 p-2">
              <div className="text-zinc-400 font-medium">Hip / Posterior</div>
              <div className="text-zinc-200">{Math.round(balance.hip_volume).toLocaleString()} kg</div>
            </div>
          </div>

          {balance.warning && (
            <div className="mt-3 rounded-lg border border-amber-800 bg-amber-900/30 px-3 py-2 text-xs text-amber-300">
              {balance.warning}
            </div>
          )}
        </>
      )}
    </div>
  );
}
