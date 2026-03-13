'use client';

import { PlateauResult } from '@/lib/hevy';
import { DangerBadge } from './DangerBadge';
import { useUnits } from '@/lib/units';

interface Props {
  plateaus: PlateauResult[];
}

export function PlateauCards({ plateaus }: Props) {
  const { fmtWeight } = useUnits();

  if (plateaus.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full flex flex-col">
        <h2 className="text-base font-semibold text-zinc-100 mb-auto">Plateau Detector</h2>
        <div className="flex flex-col items-center justify-center gap-2 text-zinc-600 py-12">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/40 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-sm text-zinc-500 text-center">No plateaus detected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-zinc-100">Plateau Detector</h2>
        <span className="text-[10px] font-medium text-zinc-600 tabular-nums">
          {plateaus.length} stalled
        </span>
      </div>

      <div className="space-y-0 flex-1 overflow-y-auto">
        {plateaus.map((p, i) => (
          <div
            key={p.exercise_template_id}
            className={`flex items-start gap-3 py-3 ${i < plateaus.length - 1 ? 'border-b border-zinc-800/60' : ''}`}
          >
            <div className={`w-0.5 h-9 rounded-full shrink-0 mt-0.5 ${p.risk === 'high' ? 'bg-red-500' : 'bg-amber-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-zinc-200 truncate">{p.exercise_title}</span>
                <DangerBadge
                  level={p.risk === 'high' ? 'danger' : 'warning'}
                  label={p.risk === 'high' ? 'High' : 'Med'}
                />
              </div>
              <div className="mt-1 text-[11px] text-zinc-600">
                {p.last_best > 0 ? fmtWeight(p.last_best, 1) : 'Bodyweight'} · {p.stall_weeks}w stall
              </div>
              <div className="mt-2 h-0.5 w-full rounded-full bg-zinc-800">
                <div
                  className={`h-0.5 rounded-full ${p.risk === 'high' ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(100, (p.stall_weeks / 8) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
