'use client';

import { MuscleReadiness } from '@/lib/hevy';

interface Props {
  results: MuscleReadiness[];
}

const STATUS_CONFIG: Record<MuscleReadiness['status'], {
  bar: string; text: string; accent: string; label: string;
}> = {
  fresh:       { bar: 'bg-emerald-500', text: 'text-emerald-400', accent: 'bg-emerald-500', label: 'Fresh' },
  optimal:     { bar: 'bg-indigo-500',  text: 'text-indigo-400',  accent: 'bg-indigo-500',  label: 'Optimal' },
  fatigued:    { bar: 'bg-amber-500',   text: 'text-amber-400',   accent: 'bg-amber-500',   label: 'Fatigued' },
  overtrained: { bar: 'bg-red-500',     text: 'text-red-400',     accent: 'bg-red-500',     label: 'Overtrained' },
};

function ReadinessBar({ readiness, status }: { readiness: number; status: MuscleReadiness['status'] }) {
  const { bar } = STATUS_CONFIG[status];
  return (
    <div className="relative h-1.5 rounded-full bg-zinc-800/80">
      <div
        className="absolute inset-y-0 rounded-sm bg-zinc-700/30"
        style={{ left: '40%', width: '30%' }}
      />
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all ${bar}`}
        style={{ width: `${readiness}%` }}
      />
    </div>
  );
}

export function MuscleReadinessChart({ results }: Props) {
  const display = results.slice(0, 12);
  const fatiguedCount    = results.filter((r) => r.status === 'fatigued').length;
  const overtrainedCount = results.filter((r) => r.status === 'overtrained').length;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Muscle Readiness</h2>
          <p className="text-xs text-zinc-600 mt-0.5">SRA fitness-fatigue model</p>
        </div>
        <div className="flex items-center gap-1.5">
          {overtrainedCount > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
              {overtrainedCount} overtrained
            </span>
          )}
          {fatiguedCount > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {fatiguedCount} fatigued
            </span>
          )}
        </div>
      </div>

      {display.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-zinc-600 text-sm">
          No data yet — log workouts to see readiness
        </div>
      ) : (
        <>
          <div className="space-y-3.5">
            {display.map((r) => {
              const { text, accent } = STATUS_CONFIG[r.status];
              return (
                <div key={r.muscle_group} className="flex items-center gap-3">
                  {/* Left accent strip — communicates status through geometry */}
                  <div className={`w-0.5 h-7 rounded-full shrink-0 ${accent}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-zinc-400 capitalize">
                        {r.muscle_group.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs font-semibold tabular-nums ${text}`}>
                        {r.readiness}%
                      </span>
                    </div>
                    <ReadinessBar readiness={r.readiness} status={r.status} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-4 text-[10px] text-zinc-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 rounded-full bg-emerald-500 inline-block" />Fresh (70–100)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 rounded-full bg-indigo-500 inline-block" />Optimal (40–69)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 rounded-full bg-amber-500 inline-block" />Fatigued (15–39)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 rounded-full bg-red-500 inline-block" />Overtrained (&lt;15)
            </span>
          </div>
        </>
      )}
    </div>
  );
}
