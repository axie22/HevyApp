'use client';

import { useUnits } from '@/lib/units';

interface Props {
  volumeKg: number;
}

export function VolumeStatCard({ volumeKg }: Props) {
  const { toDisplay, unit } = useUnits();
  const v = toDisplay(volumeKg);
  const display = v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1000
    ? `${(v / 1000).toFixed(1)}k`
    : Math.round(v).toLocaleString();

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4">
      <div className="text-xs text-zinc-500 font-medium uppercase tracking-wide">This month</div>
      <div className="mt-1 text-2xl font-bold text-zinc-100 tabular-nums">{display}</div>
      <div className="text-xs text-zinc-400 mt-0.5">{unit} lifted</div>
    </div>
  );
}
