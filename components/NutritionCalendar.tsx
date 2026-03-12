'use client';

import { NutritionLog, entryHasData, entryIsComplete } from '@/lib/nutrition';

interface Props {
  log: NutritionLog;
  selectedDate: string;
  currentMonth: Date;
  today: string;
  onSelectDate: (date: string) => void;
  onMonthChange: (month: Date) => void;
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function NutritionCalendar({
  log,
  selectedDate,
  currentMonth,
  today,
  onSelectDate,
  onMonthChange,
}: Props) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthLabel = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  function prevMonth() {
    onMonthChange(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    onMonthChange(new Date(year, month + 1, 1));
  }

  // Count days with data in this month
  const loggedDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
    return log[d] && entryHasData(log[d]);
  }).filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-1">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-zinc-100">{monthLabel}</div>
          <div className="text-[10px] text-zinc-600 mt-0.5">
            {loggedDays} day{loggedDays !== 1 ? 's' : ''} logged
          </div>
        </div>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mt-3 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-zinc-600 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const entry = log[dateStr];
          const hasAny = entry ? entryHasData(entry) : false;
          const complete = entry ? entryIsComplete(entry) : false;
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const isFuture = dateStr > today;

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onSelectDate(dateStr)}
              disabled={isFuture}
              className={`relative flex flex-col items-center justify-center rounded-lg aspect-square text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : isToday
                  ? 'ring-1 ring-zinc-500 text-zinc-100 hover:bg-zinc-800'
                  : isFuture
                  ? 'text-zinc-700 cursor-default'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <span className="leading-none">{day}</span>
              {/* Data dot */}
              {hasAny && (
                <span
                  className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                    isSelected
                      ? 'bg-white/70'
                      : complete
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-zinc-800 flex gap-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Complete
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          Partial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 inline-block" />
          No data
        </span>
      </div>
    </div>
  );
}
