'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  loadLog,
  entryHasData,
  lastNDays,
  NutritionLog,
} from '@/lib/nutrition';

function fmt(n: number | null, decimals = 0): string {
  if (n === null) return '—';
  return decimals > 0 ? n.toFixed(decimals) : Math.round(n).toLocaleString();
}

function avg(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null);
  return nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : null;
}

function RecoveryInsight({
  avgCalories,
  avgProtein,
  trackedDays,
}: {
  avgCalories: number | null;
  avgProtein: number | null;
  trackedDays: number;
}) {
  const items: { text: string; color: string }[] = [];

  if (trackedDays < 3) {
    items.push({ text: `Only ${trackedDays}/7 days logged — more data improves accuracy`, color: 'text-zinc-500' });
  } else {
    if (avgProtein !== null) {
      if (avgProtein >= 150) {
        items.push({ text: `High protein avg (${Math.round(avgProtein)}g) — excellent for muscle repair`, color: 'text-emerald-400' });
      } else if (avgProtein >= 100) {
        items.push({ text: `Moderate protein avg (${Math.round(avgProtein)}g) — adequate for recovery`, color: 'text-amber-400' });
      } else {
        items.push({ text: `Low protein avg (${Math.round(avgProtein)}g) — increasing protein may speed recovery`, color: 'text-red-400' });
      }
    }
    if (avgCalories !== null && avgCalories < 1600) {
      items.push({ text: `Low caloric intake (${Math.round(avgCalories)} kcal avg) — under-fueling can impair adaptation`, color: 'text-amber-400' });
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="mt-4 space-y-1.5">
      {items.map((item, i) => (
        <p key={i} className={`text-xs ${item.color} flex items-start gap-1.5`}>
          <span className="mt-0.5 shrink-0">›</span>
          {item.text}
        </p>
      ))}
    </div>
  );
}

export function NutritionDashboardWidget() {
  const [log, setLog] = useState<NutritionLog | null>(null);

  useEffect(() => {
    setLog(loadLog());
  }, []);

  // Don't render during SSR or before hydration (localStorage unavailable)
  if (log === null) return null;

  const today = new Date().toISOString().slice(0, 10);
  const days = lastNDays(7);
  const hasAnyData = days.some((d) => log[d] && entryHasData(log[d]));

  const calorieVals = days.map((d) => log[d]?.calories ?? null);
  const proteinVals = days.map((d) => log[d]?.protein_g ?? null);
  const avgCalories = avg(calorieVals);
  const avgProtein = avg(proteinVals);
  const trackedDays = days.filter((d) => log[d] && entryHasData(log[d])).length;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Nutrition</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Last 7 days · {trackedDays}/7 days tracked</p>
        </div>
        <Link
          href="/nutrition"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors shrink-0"
        >
          Log nutrition →
        </Link>
      </div>

      {!hasAnyData ? (
        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <p className="text-sm text-zinc-500">No nutrition data logged yet</p>
          <p className="text-xs text-zinc-600">
            Track calories and macros to see recovery insights here
          </p>
          <Link
            href="/nutrition"
            className="mt-1 rounded-xl bg-indigo-600/20 border border-indigo-600/30 hover:bg-indigo-600/30 text-indigo-400 text-xs font-medium px-4 py-2 transition-colors"
          >
            Start logging
          </Link>
        </div>
      ) : (
        <>
          {/* 7-day day chips */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((d) => {
              const entry = log[d];
              const hasData = entry && entryHasData(entry);
              const isToday = d === today;
              const dayLabel = new Date(d + 'T12:00:00Z').toLocaleString('default', {
                weekday: 'short',
                timeZone: 'UTC',
              });
              return (
                <Link
                  key={d}
                  href="/nutrition"
                  className={`rounded-xl border px-1.5 py-2 text-center transition-colors hover:border-zinc-600 ${
                    isToday
                      ? 'border-indigo-700/50 bg-indigo-950/40'
                      : hasData
                      ? 'border-zinc-700 bg-zinc-800/40'
                      : 'border-zinc-800 bg-zinc-950/40'
                  }`}
                >
                  <div className={`text-[10px] font-medium mb-1.5 ${isToday ? 'text-indigo-400' : 'text-zinc-500'}`}>
                    {dayLabel}
                  </div>
                  {hasData ? (
                    <>
                      <div className="text-xs font-semibold text-zinc-100 tabular-nums leading-none">
                        {entry.calories !== null ? Math.round(entry.calories) : '—'}
                      </div>
                      <div className="text-[9px] text-zinc-500 mt-0.5">kcal</div>
                      <div className="text-[10px] font-medium text-blue-400 tabular-nums mt-1 leading-none">
                        {entry.protein_g !== null ? `${Math.round(entry.protein_g)}g` : '—'}
                      </div>
                      <div className="text-[9px] text-zinc-600">pro</div>
                    </>
                  ) : (
                    <div className="text-[10px] text-zinc-700 mt-1">—</div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Averages row */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Avg Calories', value: fmt(avgCalories), unit: 'kcal' },
              { label: 'Avg Protein', value: fmt(avgProtein), unit: 'g' },
              { label: 'Avg Carbs', value: fmt(avg(days.map((d) => log[d]?.carbs_g ?? null))), unit: 'g' },
              { label: 'Avg Fat', value: fmt(avg(days.map((d) => log[d]?.fat_g ?? null))), unit: 'g' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="rounded-xl bg-zinc-800/50 px-3 py-2.5">
                <div className="text-[10px] text-zinc-500">{label}</div>
                <div className="text-sm font-semibold text-zinc-100 tabular-nums mt-0.5">
                  {value} <span className="text-xs font-normal text-zinc-500">{unit}</span>
                </div>
              </div>
            ))}
          </div>

          <RecoveryInsight
            avgCalories={avgCalories}
            avgProtein={avgProtein}
            trackedDays={trackedDays}
          />
        </>
      )}
    </div>
  );
}
