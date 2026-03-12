'use client';

import { AcwrResult } from '@/lib/hevy';
import { DangerBadge } from './DangerBadge';

interface Props {
  results: AcwrResult[];
}

const STATUS_STYLES: Record<AcwrResult['status'], { bar: string; text: string; chip: string }> = {
  danger:           { bar: 'bg-red-500',     text: 'text-red-400',     chip: 'bg-red-500/10 text-red-400 ring-red-500/25' },
  optimal:          { bar: 'bg-emerald-500', text: 'text-emerald-400', chip: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25' },
  undertrained:     { bar: 'bg-amber-500',   text: 'text-amber-400',   chip: 'bg-amber-500/10 text-amber-400 ring-amber-500/25' },
  insufficient_data:{ bar: 'bg-zinc-600',    text: 'text-zinc-500',    chip: 'bg-zinc-800 text-zinc-500 ring-zinc-700' },
};

const STATUS_LABEL: Record<AcwrResult['status'], string> = {
  danger: 'Danger',
  optimal: 'Optimal',
  undertrained: 'Undertrained',
  insufficient_data: 'N/A',
};

function RatioBar({ ratio, status }: { ratio: number; status: AcwrResult['status'] }) {
  const MAX = 2.0;
  const fillPct = Math.min((ratio / MAX) * 100, 100);
  const { bar } = STATUS_STYLES[status];
  return (
    <div className="relative h-1.5 rounded-full bg-zinc-800">
      {/* Optimal zone shading: 0.8–1.5 = 40%–75% of 0–2 scale */}
      <div
        className="absolute inset-y-0 rounded-sm bg-zinc-700/50"
        style={{ left: '40%', width: '35%' }}
      />
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${bar}`}
        style={{ width: `${fillPct}%` }}
      />
      {ratio > MAX && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-3 rounded-sm bg-red-500 opacity-80" />
      )}
    </div>
  );
}

export function AcwrChart({ results }: Props) {
  const displayData = results.filter((r) => r.status !== 'insufficient_data').slice(0, 10);
  const dangerCount = results.filter((r) => r.status === 'danger').length;
  const undertrainedCount = results.filter((r) => r.status === 'undertrained').length;

  // Detect "new/resumed training" — all training concentrated in the acute window
  const allNewTraining = displayData.length > 0 && displayData.every((r) => r.ratio >= 3.8);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Fatigue & Recovery</h2>
          <p className="text-xs text-zinc-500 mt-0.5">7-day acute vs 28-day chronic workload ratio</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {dangerCount > 0 && <DangerBadge level="danger" label={`${dangerCount} danger`} />}
          {undertrainedCount > 0 && <DangerBadge level="warning" label={`${undertrainedCount} undertrained`} />}
        </div>
      </div>

      {allNewTraining && (
        <div className="mb-4 rounded-lg bg-amber-950/40 border border-amber-800/30 px-3 py-2.5 text-xs text-amber-300/80 leading-relaxed">
          Ratios near 4.0 — chronic baseline is low. You may have recently started or resumed
          training. Ratios will normalize as the 28-day history fills in.
        </div>
      )}

      {displayData.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-zinc-500 text-sm">
          Not enough data — train across more muscle groups to see ACWR
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {displayData.map((r) => {
              const { text, chip } = STATUS_STYLES[r.status];
              return (
                <div key={r.muscle_group}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-zinc-300 capitalize font-medium">
                      {r.muscle_group.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-600 tabular-nums">
                        {Math.round(r.acute_load)} / {Math.round(r.chronic_load)} kg
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${text}`}>
                        {r.ratio.toFixed(2)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ring-1 ${chip}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                  </div>
                  <RatioBar ratio={r.ratio} status={r.status} />
                </div>
              );
            })}
          </div>

          {/* Scale ticks */}
          <div className="mt-3 flex justify-between text-[10px] text-zinc-700 px-0">
            <span>0</span>
            <span>0.8</span>
            <span>1.5</span>
            <span>2.0+</span>
          </div>

          <div className="mt-3 flex gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Optimal (0.8–1.5)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Danger (&gt;1.5)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Undertrained (&lt;0.8)
            </span>
          </div>
        </>
      )}
    </div>
  );
}
