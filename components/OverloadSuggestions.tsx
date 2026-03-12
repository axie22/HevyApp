'use client';

import { OverloadSuggestion } from '@/lib/hevy';
import { useUnits } from '@/lib/units';

interface Props {
  suggestions: OverloadSuggestion[];
}

const SUGGESTION_STYLES: Record<OverloadSuggestion['suggestion'], {
  label: string; badge: string; icon: string;
}> = {
  add_weight: { label: 'Add Weight', badge: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/25', icon: '+' },
  add_rep:    { label: 'Add Rep',    badge: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/25',   icon: '+' },
  deload:     { label: 'Deload',     badge: 'bg-amber-500/10 text-amber-400 ring-amber-500/25',      icon: '↓' },
  maintain:   { label: 'Maintain',   badge: 'bg-zinc-700/50 text-zinc-400 ring-zinc-600/30',         icon: '→' },
};

export function OverloadSuggestions({ suggestions }: Props) {
  const { fmtWeight } = useUnits();

  const actionable = suggestions.filter((s) => s.suggestion !== 'maintain');
  const display = actionable.length > 0 ? actionable : suggestions.slice(0, 5);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full flex flex-col">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-100">Progressive Overload</h2>
        <p className="text-xs text-zinc-500 mt-0.5">Based on your last 3–5 sessions per exercise</p>
      </div>

      {display.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-zinc-500 text-sm">
          Need 3+ sessions per exercise in the last 6 weeks
        </div>
      ) : (
        <div className="space-y-2.5 flex-1 overflow-y-auto">
          {display.slice(0, 8).map((s) => {
            const style = SUGGESTION_STYLES[s.suggestion];
            return (
              <div
                key={s.exercise_template_id}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-xs font-medium text-zinc-200 truncate flex-1">
                    {s.exercise_title}
                  </div>
                  <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ring-1 font-medium ${style.badge}`}>
                    {style.icon} {style.label}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-zinc-500 leading-relaxed">{s.rationale}</p>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-zinc-300 tabular-nums">
                      {fmtWeight(s.last_weight_kg)}
                    </div>
                    {s.suggested_weight_kg && (
                      <div className="text-[10px] text-emerald-400 tabular-nums">
                        → {fmtWeight(s.suggested_weight_kg)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
