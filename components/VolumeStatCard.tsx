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
    <div className="bg-zinc-900 px-5 py-5">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">This month</div>
      <div className="mt-2.5 text-3xl font-bold tabular-nums text-zinc-100 leading-none tracking-tight">{display}</div>
      <div className="text-xs text-zinc-500 mt-1.5">{unit} lifted</div>
    </div>
  );
}
