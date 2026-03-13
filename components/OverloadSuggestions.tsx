'use client';

import { OverloadSuggestion } from '@/lib/hevy';
import { useUnits } from '@/lib/units';

interface Props {
  suggestions: OverloadSuggestion[];
}

const SUGGESTION_CONFIG: Record<OverloadSuggestion['suggestion'], {
  label: string; accent: string; text: string;
}> = {
  add_weight: { label: 'Add weight', accent: 'bg-emerald-500', text: 'text-emerald-400' },
  add_rep:    { label: 'Add rep',    accent: 'bg-indigo-500',  text: 'text-indigo-400'  },
  deload:     { label: 'Deload',     accent: 'bg-amber-500',   text: 'text-amber-400'   },
  maintain:   { label: 'Maintain',   accent: 'bg-zinc-600',    text: 'text-zinc-500'    },
};

export function OverloadSuggestions({ suggestions }: Props) {
  const { fmtWeight } = useUnits();

  const actionable = suggestions.filter((s) => s.suggestion !== 'maintain');
  const display = (actionable.length > 0 ? actionable : suggestions).slice(0, 8);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full flex flex-col">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-zinc-100">Progressive Overload</h2>
        <p className="text-xs text-zinc-600 mt-0.5">Based on last 3–5 sessions</p>
      </div>

      {display.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-zinc-600 text-sm">
          Need 3+ sessions per exercise in the last 6 weeks
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {display.map((s, i) => {
            const { label, accent, text } = SUGGESTION_CONFIG[s.suggestion];
            return (
              <div
                key={s.exercise_template_id}
                className={`flex items-start gap-3 py-3 ${i < display.length - 1 ? 'border-b border-zinc-800/60' : ''}`}
              >
                <div className={`w-0.5 h-9 rounded-full shrink-0 mt-0.5 ${accent}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-medium text-zinc-200 leading-tight">{s.exercise_title}</span>
                    <span className={`text-[10px] font-medium shrink-0 ${text}`}>{label}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className="text-[11px] text-zinc-600 leading-relaxed">{s.rationale}</p>
                    {s.suggested_weight_kg ? (
                      <span className="text-[10px] text-emerald-400 tabular-nums shrink-0">
                        {fmtWeight(s.last_weight_kg)} → {fmtWeight(s.suggested_weight_kg)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 tabular-nums shrink-0">
                        {fmtWeight(s.last_weight_kg)}
                      </span>
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
