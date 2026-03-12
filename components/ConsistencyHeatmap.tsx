'use client';

import { useMemo, useState } from 'react';
import { HeatmapDay } from '@/lib/hevy';
import { useUnits } from '@/lib/units';

interface Props {
  days: HeatmapDay[];
  currentStreak: number;
  longestStreak: number;
  avgGapDays: number;
}

function getVolumeLevel(vol: number, max: number): number {
  if (vol === 0 || max === 0) return 0;
  const ratio = vol / max;
  if (ratio < 0.2) return 1;
  if (ratio < 0.4) return 2;
  if (ratio < 0.65) return 3;
  if (ratio < 0.85) return 4;
  return 5;
}

const levelColors: Record<number, string> = {
  0: 'bg-zinc-800',
  1: 'bg-emerald-900',
  2: 'bg-emerald-800',
  3: 'bg-emerald-700',
  4: 'bg-emerald-600',
  5: 'bg-emerald-500',
};

export function ConsistencyHeatmap({ days, currentStreak, longestStreak, avgGapDays }: Props) {
  const [tooltip, setTooltip] = useState<{ date: string; volume: number; x: number; y: number } | null>(null);
  const { fmtVolume } = useUnits();

  const { grid, maxVolume } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Start from 52 weeks ago (Sunday)
    const start = new Date(today);
    start.setDate(today.getDate() - 364);
    // Align to the nearest Sunday before or on start
    start.setDate(start.getDate() - start.getDay());

    const volumeMap = new Map(days.map((d) => [d.date, d.volume_kg]));
    const maxVolume = Math.max(0, ...days.map((d) => d.volume_kg));

    const grid: { date: string; volume: number; level: number; col: number; row: number }[] = [];

    const cursor = new Date(start);
    let col = 0;
    while (cursor <= today) {
      const row = cursor.getDay(); // 0=Sun, 6=Sat
      const dateStr = cursor.toISOString().slice(0, 10);
      const volume = volumeMap.get(dateStr) ?? 0;
      grid.push({
        date: dateStr,
        volume,
        level: getVolumeLevel(volume, maxVolume),
        col,
        row,
      });
      if (row === 6) col++;
      cursor.setDate(cursor.getDate() + 1);
    }

    return { grid, maxVolume };
  }, [days]);

  const totalCols = Math.max(...grid.map((c) => c.col)) + 1;

  const monthLabels = useMemo(() => {
    const seen = new Set<string>();
    const labels: { col: number; label: string }[] = [];
    for (const cell of grid) {
      if (cell.row === 0) {
        const month = cell.date.slice(0, 7);
        if (!seen.has(month)) {
          seen.add(month);
          const d = new Date(cell.date);
          labels.push({
            col: cell.col,
            label: d.toLocaleString('default', { month: 'short' }),
          });
        }
      }
    }
    return labels;
  }, [grid]);

  const CELL = 14;
  const GAP = 2;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Workout Consistency</h2>
        <div className="flex gap-6 text-sm text-zinc-400">
          <span><span className="text-zinc-200 font-medium">{currentStreak}</span> day streak</span>
          <span>Longest <span className="text-zinc-200 font-medium">{longestStreak}</span> days</span>
          <span>Avg gap <span className="text-zinc-200 font-medium">{avgGapDays}d</span></span>
        </div>
      </div>

      <div className="flex gap-1">
        {/* Day-of-week labels — fixed, does not scroll with the grid */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={{
            paddingTop: 24, // matches month-label area: h-5 (20px) + mb-1 (4px)
            gap: GAP,
            width: 28,
          }}
        >
          {/* row 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat */}
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end text-[10px] text-zinc-600 pr-1.5"
              style={{ height: CELL }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Scrollable heatmap grid */}
        <div className="overflow-x-auto flex-1">
          <div className="relative" style={{ minWidth: totalCols * (CELL + GAP) }}>
            {/* Month labels */}
            <div className="relative h-5 mb-1">
              {monthLabels.map(({ col, label }) => (
                <span
                  key={`${col}-${label}`}
                  className="absolute text-xs text-zinc-500"
                  style={{ left: col * (CELL + GAP) }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Grid */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${totalCols}, ${CELL}px)`,
                gridTemplateRows: `repeat(7, ${CELL}px)`,
                gap: GAP,
              }}
            >
              {grid.map((cell) => (
                <div
                  key={cell.date}
                  className={`rounded-sm cursor-pointer transition-opacity hover:opacity-80 ${levelColors[cell.level]}`}
                  style={{
                    gridColumn: cell.col + 1,
                    gridRow: cell.row + 1,
                    width: CELL,
                    height: CELL,
                  }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ date: cell.date, volume: cell.volume, x: rect.left, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1 mt-3 justify-end">
              <span className="text-xs text-zinc-500 mr-1">Less</span>
              {[0, 1, 2, 3, 4, 5].map((l) => (
                <div key={l} className={`w-3 h-3 rounded-sm ${levelColors[l]}`} />
              ))}
              <span className="text-xs text-zinc-500 ml-1">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl pointer-events-none"
          style={{ top: tooltip.y - 60, left: tooltip.x - 60 }}
        >
          <div className="font-medium text-zinc-200">{tooltip.date}</div>
          {tooltip.volume > 0 ? (
            <div className="text-zinc-400">{fmtVolume(tooltip.volume)} volume</div>
          ) : (
            <div className="text-zinc-500">Rest day</div>
          )}
        </div>
      )}
    </div>
  );
}
