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
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Plateau Detector</h2>
        <div className="flex h-40 flex-col items-center justify-center gap-2 text-zinc-500">
          <span className="text-2xl">🟢</span>
          <span className="text-sm">No plateaus detected — keep progressing!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Plateau Detector</h2>
        <span className="text-xs text-zinc-500">{plateaus.length} exercise{plateaus.length !== 1 ? 's' : ''} stalled</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {plateaus.map((p) => (
          <div
            key={p.exercise_template_id}
            className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-zinc-200 truncate">{p.exercise_title}</div>
                <div className="mt-1 text-xs text-zinc-500">
                  Best weight: <span className="text-zinc-300">{p.last_best > 0 ? fmtWeight(p.last_best, 1) : 'bodyweight'}</span>
                  {' · '}
                  Stalled <span className="text-zinc-300">{p.stall_weeks} week{p.stall_weeks !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <DangerBadge
                level={p.risk === 'high' ? 'danger' : 'warning'}
                label={p.risk === 'high' ? 'High Risk' : 'Medium Risk'}
              />
            </div>

            <div className="mt-3">
              <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
                <span>Progress stall</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    p.risk === 'high' ? 'bg-red-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, (p.stall_weeks / 8) * 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-zinc-600">
                <span>2 weeks</span>
                <span>8+ weeks</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
