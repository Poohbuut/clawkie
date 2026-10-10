'use client';

import { useEffect, useRef, useState } from 'react';
import type { Service } from '@/lib/services';
import { formatTime, peso, toISODate } from '@/lib/format';
import { MAX_PHOTO_BYTES, NAIL_SLOTS } from '@/lib/slots';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function BookingForm({ services }: { services: Service[] }) {
  // "today" is set after mount so server and client timezones can't cause a hydration mismatch.
  const [today, setToday] = useState<Date | null>(null);
  const [view, setView] = useState({ y: 0, m: 0 });
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    setToday(t);
    setView({ y: t.getFullYear(), m: t.getMonth() });
  }, []);

  async function pickDate(iso: string) {
    setDate(iso);
    setTime(null);
    setTaken([]);
    try {
      const res = await fetch(`/api/nail-slots?date=${iso}`);
      if (res.ok) setTaken((await res.json()).taken);
    } catch {
      /* server still rejects double-bookings */
    }
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      alert('Please choose an image under 8MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    if (fileRef.current) fileRef.current.value = '';
    setPreview(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    if (!date || !time) return setStatus({ kind: 'error', text: 'Please pick a date and time.' });

    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      fd.set('appointment_date', date);
      fd.set('appointment_time', time);
      const res = await fetch('/api/book-nails', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

      setStatus({ kind: 'success', text: "You're booked! We'll see you then." });
      formRef.current?.reset();
      setPreview(null);
      setDate(null);
      setTime(null);
    } catch (err) {
      setStatus({ kind: 'error', text: (err as Error).message });
      if (date) pickDate(date); // refresh taken slots after a conflict
    } finally {
      setSubmitting(false);
    }
  }

  function shiftMonth(delta: number) {
    setView(({ y, m }) => {
      const next = m + delta;
      return { y: y + Math.floor(next / 12), m: ((next % 12) + 12) % 12 };
    });
  }

  const firstDay = today ? new Date(view.y, view.m, 1).getDay() : 0;
  const daysInMonth = today ? new Date(view.y, view.m + 1, 0).getDate() : 0;
  const selectedLabel = (() => {
    if (!date || !time) return '';
    const [y, m, d] = date.split('-').map(Number);
    return `${new Date(y, m - 1, d).toDateString()} at ${formatTime(time)}`;
  })();

  return (
    <form ref={formRef} onSubmit={onSubmit} className="rounded-[20px] bg-white p-6 shadow-[0_10px_40px_rgba(44,24,32,0.08)] sm:p-8" noValidate>
      <h1 className="mb-6 font-serif text-4xl font-medium">Book your appointment</h1>

      <div className="mb-5">
        <label htmlFor="service_id" className="field-label">Service</label>
        <select id="service_id" name="service_id" required defaultValue="" className="field-input focus:ring-sage">
          <option value="" disabled>Choose a service&hellip;</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} &middot; {peso(s.price)}
              {s.duration_minutes ? ` (${s.duration_minutes} min)` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar */}
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
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const cell = new Date(view.y, view.m, day);
            const iso = toISODate(view.y, view.m, day);
            const disabled = cell < today! || cell.getDay() === 0; // closed Sundays
            const selected = iso === date;
            return (
              <button
                key={iso}
                type="button"
                disabled={disabled}
                onClick={() => pickDate(iso)}
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

      {date && (
        <fieldset className="mb-5">
          <legend className="field-label">Time</legend>
          <div className="grid grid-cols-3 gap-2">
            {NAIL_SLOTS.map((t) => {
              const isTaken = taken.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  disabled={isTaken}
                  onClick={() => setTime(t)}
                  aria-pressed={time === t}
                  className={`rounded-full border border-nails/30 py-2 text-sm font-bold transition-colors
                    ${time === t ? 'bg-nails text-cream' : 'hover:bg-sage'} disabled:cursor-not-allowed disabled:line-through disabled:opacity-35 disabled:hover:bg-transparent`}
                >
                  {formatTime(t)}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <p className="mb-5 min-h-[1.2em] text-sm font-semibold" role="status">{selectedLabel && `Selected: ${selectedLabel}`}</p>

      <div className="mb-4">
        <label htmlFor="full_name" className="field-label">Your name</label>
        <input id="full_name" name="full_name" type="text" required className="field-input focus:ring-sage" />
      </div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" name="email" type="email" required className="field-input focus:ring-sage" />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">Phone</label>
          <input id="phone" name="phone" type="tel" required className="field-input focus:ring-sage" />
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="notes" className="field-label">Notes (optional)</label>
        <textarea id="notes" name="notes" rows={3} placeholder="Shape, length, colors, allergies" className="field-input focus:ring-sage" />
      </div>

      {/* Photo upload */}
      <div className="mb-2">
        <span className="field-label">Inspiration photo (optional)</span>
        <input ref={fileRef} id="inspiration_photo" name="inspiration_photo" type="file" accept="image/*" onChange={onPhoto} className="sr-only" />
        {preview ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your inspiration photo" className="h-24 w-24 rounded-xl object-cover" />
            <button type="button" onClick={removePhoto} className="rounded-full border border-nails/30 px-4 py-2 text-sm font-bold hover:bg-sage">Remove photo</button>
          </div>
        ) : (
          <label htmlFor="inspiration_photo" className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-nails/30 bg-cream px-4 py-6 text-center text-sm font-semibold opacity-100 hover:bg-sage/50">
            Tap to add a photo
            <span className="mt-1 text-xs font-medium opacity-60">JPG or PNG, up to 8MB</span>
          </label>
        )}
      </div>

      <button type="submit" disabled={submitting} className="mt-6 w-full rounded-full bg-nails py-3.5 font-bold text-white transition hover:-translate-y-px disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? 'Booking...' : 'Book my appointment'}
      </button>
      <p role="status" className={`mt-3 min-h-[1.2em] text-center text-sm font-semibold ${status?.kind === 'error' ? 'text-bad' : 'text-ok'}`}>
        {status?.text}
      </p>
    </form>
  );
}
