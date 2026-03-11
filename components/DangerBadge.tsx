interface DangerBadgeProps {
  level: 'danger' | 'warning' | 'ok' | 'info';
  label: string;
}

const styles: Record<DangerBadgeProps['level'], string> = {
  danger: 'bg-red-900/60 text-red-300 border-red-700',
  warning: 'bg-amber-900/60 text-amber-300 border-amber-700',
  ok: 'bg-emerald-900/60 text-emerald-300 border-emerald-700',
  info: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

export function DangerBadge({ level, label }: DangerBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${styles[level]}`}
    >
      {label}
    </span>
  );
}
