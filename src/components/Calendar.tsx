'use client';

import { useEffect, useState } from 'react';
import { toISODate } from '@/lib/format';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

type Props = {
  value: string | null;
  onChange: (iso: string) => void;
  isClosed?: (d: Date) => boolean;
};

export default function Calendar({ value, onChange, isClosed }: Props) {
  const [today, setToday] = useState<Date | null>(null);
  const [view, setView] = useState({ y: 0, m: 0 });

  useEffect(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    setToday(t);
    setView({ y: t.getFullYear(), m: t.getMonth() });
  }, []);

  function shiftMonth(delta: number) {
    setView(({ y, m }) => {
      const next = m + delta;
      return { y: y + Math.floor(next / 12), m: ((next % 12) + 12) % 12 };
    });
  }

  const firstDay = today ? new Date(view.y, view.m, 1).getDay() : 0;
  const daysInMonth = today ? new Date(view.y, view.m + 1, 0).getDate() : 0;

  return (
    <fieldset className="mb-5">
      <legend className="field-label">Date</legend>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month" className="h-9 w-9 rounded-full border border-sage hover:bg-sage">&lsaquo;</button>
        <span className="font-bold" aria-live="polite">{today ? `${MONTHS[view.m]} ${view.y}` : '\u00a0'}</span>
        <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month" className="h-9 w-9 rounded-full border border-sage hover:bg-sage">&rsaquo;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold opacity-60">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}
        {today && Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const cell = new Date(view.y, view.m, day);
          const iso = toISODate(view.y, view.m, day);
          const disabled = cell < today || !!isClosed?.(cell);
          const selected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onChange(iso)}
              aria-pressed={selected}
              className={`aspect-square rounded-lg text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-nails
                ${selected ? 'bg-nails text-cream' : 'hover:bg-sage'} disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}