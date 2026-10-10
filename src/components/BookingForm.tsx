'use client';

import { useRef, useState } from 'react';
import type { Service } from '@/types';
import { formatTime, peso } from '@/lib/format';
import { MAX_PHOTO_BYTES, NAIL_SLOTS } from '@/lib/slots';
import { supabaseBrowser } from '@/lib/supabase-browser';
import type { NailDesign } from '@/types';
import Calendar from './Calendar';
import CustomerFields from './CustomerFields';

const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export default function BookingForm({ services, design }: { services: Service[]; design?: NailDesign | null }) {
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [taken, setTaken] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!OK_TYPES.includes(file.type)) {
      alert('Please choose a JPG, PNG, WebP or HEIC image.');
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
      if (design) fd.set('design_id', design.id);

      const file = fileRef.current?.files?.[0];
      fd.delete('inspiration_photo');

      if (file) {
        const prep = await fetch('/api/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: file.type, size: file.size }),
        });
        const prepData = await prep.json();
        if (!prep.ok) throw new Error(prepData.error || 'Could not upload your photo.');

        const { error: uploadError } = await supabaseBrowser()
          .storage.from('inspiration-photos')
          .uploadToSignedUrl(prepData.path, prepData.token, file, { contentType: file.type });
        if (uploadError) throw new Error('Photo upload failed. Please try again.');
        fd.set('photo_path', prepData.path);
      }

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

  const selectedLabel = (() => {
    if (!date || !time) return '';
    const [y, m, d] = date.split('-').map(Number);
    return `${new Date(y, m - 1, d).toDateString()} at ${formatTime(time)}`;
  })();

  return (
    <form ref={formRef} onSubmit={onSubmit} className="rounded-md border border-ink/15 bg-cream p-6 sm:p-8" noValidate>
      <h1 className="mb-6 font-display text-2xl font-semibold">Book your appointment</h1>

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

      <Calendar value={date} onChange={pickDate} isClosed={(d) => d.getDay() === 0} />

      {design && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-nails/15 bg-cream p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={design.image_url} alt="" className="h-16 w-16 rounded-md object-cover" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide opacity-55">Selected design</p>
            <p className="font-bold">{design.name}</p>
          </div>
        </div>
      )}

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
                  className={`rounded-md border border-nails/30 py-2 text-sm font-semibold transition-colors
                    ${time === t ? 'bg-ink text-cream' : 'hover:bg-sage'} disabled:cursor-not-allowed disabled:line-through disabled:opacity-35 disabled:hover:bg-transparent`}
                >
                  {formatTime(t)}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <p className="mb-5 min-h-[1.2em] text-sm font-semibold" role="status">{selectedLabel && `Selected: ${selectedLabel}`}</p>

      <CustomerFields ring="focus:ring-sage" />
      <div className="mb-4">
        <label htmlFor="notes" className="field-label">Notes (optional)</label>
        <textarea id="notes" name="notes" rows={3} placeholder="Shape, length, colors, allergies" className="field-input focus:ring-sage" />
      </div>

      {/* Photo upload */}
      <div className="mb-2">
        <span className="field-label">Inspiration photo (optional)</span>
        <input ref={fileRef} id="inspiration_photo" name="inspiration_photo" type="file" accept="image/jpeg,image/png,image/webp,image/heic" onChange={onPhoto} className="sr-only" />
        {preview ? (
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Your inspiration photo" className="h-24 w-24 rounded-xl object-cover" />
            <button type="button" onClick={removePhoto} className="rounded-full border border-nails/30 px-4 py-2 text-sm font-bold hover:bg-sage">Remove photo</button>
          </div>
        ) : (
          <label htmlFor="inspiration_photo" className="flex cursor-pointer flex-col items-center rounded-xl border border-dashed border-nails/30 bg-cream px-4 py-6 text-center text-sm font-semibold opacity-100 hover:bg-sage/50">
            Tap to add a photo
            <span className="mt-1 text-xs font-medium opacity-60">JPG, PNG, WebP or HEIC, up to 8MB</span>
          </label>
        )}
      </div>

      <button type="submit" disabled={submitting} className="mt-6 w-full rounded-md bg-ink py-3.5 font-semibold text-cream transition hover:-translate-y-px disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? 'Booking...' : 'Book my appointment'}
      </button>
      <p role="status" className={`mt-3 min-h-[1.2em] text-center text-sm font-semibold ${status?.kind === 'error' ? 'text-bad' : 'text-ok'}`}>
        {status?.text}
      </p>
    </form>
  );
}
