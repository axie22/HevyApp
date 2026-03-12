'use client';

import { useState } from 'react';
import { PersonalRecord } from '@/lib/hevy';

interface Props {
  records: PersonalRecord[];
}

type SortMode = 'weight' | 'recent';

const PAGE_SIZE = 5;

export function PersonalRecords({ records }: Props) {
  const [sort, setSort] = useState<SortMode>('weight');
  const [page, setPage] = useState(0);

  const recentCount = records.filter((r) => r.is_recent).length;

  const sorted =
    sort === 'weight'
      ? [...records].sort((a, b) => b.best_weight_kg - a.best_weight_kg)
      : [...records].sort((a, b) => b.best_date.localeCompare(a.best_date));

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(mode: SortMode) {
    setSort(mode);
    setPage(0);
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 h-full flex flex-col">
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-zinc-100">Personal Records</h2>
            {recentCount > 0 && (
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                {recentCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">Best weight lifted per exercise</p>
        </div>
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden text-xs shrink-0">
          {(['weight', 'recent'] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleSort(mode)}
              className={`px-3 py-1.5 transition-colors ${
                sort === mode
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              {mode === 'weight' ? 'Heaviest' : 'Recent'}
            </button>
          ))}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-zinc-500 text-sm">
          No weighted exercises found
        </div>
      ) : (
        <>
          <div className="space-y-2 flex-1">
            {paginated.map((pr) => (
              <div
                key={pr.exercise_template_id}
                className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-200 truncate">
                    {pr.exercise_title}
                  </div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{pr.best_date}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {pr.is_recent && (
                    <span className="text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20 px-1.5 py-0.5 rounded">
                      PR
                    </span>
                  )}
                  <span className="text-sm font-bold text-zinc-100 tabular-nums">
                    {pr.best_weight_kg.toFixed(1)} kg
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
            <span className="tabular-nums">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="px-2.5 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="px-2.5 py-1 rounded-lg border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
