'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Service } from '@/types';
import { formatTime, peso } from '@/lib/format';
import { DELIVERY_SLOTS, PICKUP_SLOTS } from '@/lib/slots';
import CustomerFields from './CustomerFields';

type Method = 'pickup' | 'delivery';

export default function OrderForm({ cookies }: { cookies: Service[] }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<Method>('pickup');
  const [minDate, setMinDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [formKey, setFormKey] = useState(0); // bump to reset uncontrolled inputs

  // Local date (not UTC) so Manila evenings don't show yesterday as "today".
  useEffect(() => {
    const d = new Date();
    setMinDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }, []);

  const { count, total } = useMemo(() => {
    let count = 0, total = 0;
    for (const c of cookies) {
      const q = cart[c.id] || 0;
      count += q;
      total += q * c.price;
    }
    return { count, total };
  }, [cart, cookies]);

  const change = (id: string, delta: number) =>
    setCart((prev) => {
      const next = { ...prev, [id]: (prev[id] || 0) + delta };
      if (next[id] <= 0) delete next[id];
      return next;
    });

  const slots = method === 'delivery' ? DELIVERY_SLOTS : PICKUP_SLOTS;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    const form = e.currentTarget;
    const f = new FormData(form);
    const str = (k: string) => ((f.get(k) as string) || '').trim();

    if (count === 0) return setStatus({ kind: 'error', text: 'Please add at least one cookie to your order.' });
    if (!str('order_date') || !str('order_time')) return setStatus({ kind: 'error', text: 'Please pick a date and time.' });
    if (method === 'delivery' && !str('delivery_address')) return setStatus({ kind: 'error', text: 'Please enter a delivery address.' });
    if (!str('full_name') || !str('email') || !str('phone')) return setStatus({ kind: 'error', text: 'Please fill in your name, email and phone.' });

    setSubmitting(true);
    try {
      const res = await fetch('/api/order-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: str('full_name'),
          email: str('email'),
          phone: str('phone'),
          fulfillment_method: method,
          order_date: str('order_date'),
          order_time: str('order_time'),
          delivery_address: method === 'delivery' ? str('delivery_address') : null,
          allergies: str('allergies') || null,
          notes: str('notes') || null,
          order_items: Object.entries(cart).map(([service_id, qty]) => ({ service_id, qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

      setStatus({ kind: 'success', text: "Order placed! We'll see you soon." });
      setCart({});
      setMethod('pickup');
      setFormKey((k) => k + 1);
    } catch (err) {
      setStatus({ kind: 'error', text: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  }

  const stepTitle = 'mb-1 flex items-center gap-2.5 font-display text-[1.4rem] font-semibold';
  const stepNum = 'inline-flex h-7 w-7 items-center justify-center rounded-full bg-tan font-sans text-sm text-cookie';
  const step = 'mb-8 border-b border-cookie/10 pb-8 last-of-type:mb-0 last-of-type:border-0 last-of-type:pb-0';

  return (
    <form key={formKey} onSubmit={onSubmit} noValidate className="rounded-[20px] bg-white p-6 shadow-[0_10px_40px_rgba(58,34,24,0.08)] sm:p-8">
      <section className={step} aria-labelledby="s1">
        <h2 id="s1" className={stepTitle}><span className={stepNum}>1</span> Pick your cookies</h2>
        <p className="mb-5 text-sm opacity-65">Tap + / &minus; to add cookies to your box.</p>

        <div className="grid grid-cols-2 gap-3.5">
          {cookies.length === 0 && <p className="col-span-2 text-sm opacity-60">No cookies are on the menu right now. Check back soon.</p>}
          {cookies.map((c) => {
            const qty = cart[c.id] || 0;
            return (
              <div key={c.id} className={`flex flex-col gap-2 rounded-2xl border p-3.5 transition-colors ${qty ? 'border-tan shadow-[0_4px_16px_rgba(220,162,102,0.2)]' : 'border-cookie/10'}`}>
                <span className="text-[0.95rem] font-bold">{c.name}</span>
                <span className="text-xs opacity-70">{peso(c.price)} each</span>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <button type="button" disabled={qty === 0} onClick={() => change(c.id, -1)} aria-label={`Remove one ${c.name}`}
                    className="h-[30px] w-[30px] rounded-full border border-tan text-lg leading-none transition-colors hover:bg-tan disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent">&minus;</button>
                  <span className="min-w-6 text-center font-bold" aria-live="polite">{qty}</span>
                  <button type="button" onClick={() => change(c.id, 1)} aria-label={`Add one ${c.name}`}
                    className="h-[30px] w-[30px] rounded-full border border-tan text-lg leading-none transition-colors hover:bg-tan">+</button>
                </div>
              </div>
            );
          })}
        </div>

        {count > 0 && (
          <div className="mt-5 flex justify-between rounded-xl border border-dashed border-tan bg-cream px-4 py-3.5 text-[0.95rem] font-bold">
            <span>{count} cookie{count === 1 ? '' : 's'}</span>
            <span>{peso(total)}</span>
          </div>
        )}
      </section>

      <section className={step} aria-labelledby="s2">
        <h2 id="s2" className={stepTitle}><span className={stepNum}>2</span> Pick-up or delivery?</h2>
        <div className="my-5 flex gap-2.5" role="radiogroup" aria-label="Fulfillment method">
          {(['pickup', 'delivery'] as Method[]).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={method === m} onClick={() => setMethod(m)}
              className={`flex-1 rounded-full border border-tan py-2.5 text-sm font-bold transition-colors ${method === m ? 'bg-tan' : 'hover:bg-tan/40'}`}>
              {m === 'pickup' ? 'Pick-up' : 'Delivery'}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="order_date" className="field-label">Date</label>
            <input id="order_date" name="order_date" type="date" min={minDate} required className="field-input focus:ring-tan" />
          </div>
          <div>
            <label htmlFor="order_time" className="field-label">Time</label>
            {/* key resets the selection when switching between pick-up and delivery slots */}
            <select id="order_time" name="order_time" key={method} required defaultValue="" className="field-input focus:ring-tan">
              <option value="" disabled>Choose a time&hellip;</option>
              {slots.map((t) => <option key={t} value={t}>{formatTime(t)}</option>)}
            </select>
          </div>
        </div>

        {method === 'delivery' && (
          <div className="mt-4">
            <label htmlFor="delivery_address" className="field-label">Delivery address</label>
            <textarea id="delivery_address" name="delivery_address" rows={2} placeholder="Street, barangay, city, landmark" className="field-input focus:ring-tan" />
          </div>
        )}
      </section>

      <section className={step} aria-labelledby="s3">
        <h2 id="s3" className={`${stepTitle} mb-5`}><span className={stepNum}>3</span> Your details</h2>
        <CustomerFields ring="focus:ring-tan" />
        <div className="mb-4">
          <label htmlFor="allergies" className="field-label">Allergies or dietary notes (optional)</label>
          <input id="allergies" name="allergies" type="text" placeholder="e.g. nut allergy, no dairy" className="field-input focus:ring-tan" />
        </div>
        <div>
          <label htmlFor="notes" className="field-label">Special instructions (optional)</label>
          <textarea id="notes" name="notes" rows={3} placeholder="e.g. gift wrap, birthday message on card" className="field-input focus:ring-tan" />
        </div>
      </section>

      <button type="submit" disabled={submitting} className="mt-6 w-full rounded-full bg-cookie py-3.5 font-bold tracking-wide text-white transition hover:-translate-y-px disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60">
        {submitting ? 'Placing order...' : 'Place my order'}
      </button>
      <p role="status" className={`mt-3 min-h-[1.2em] text-center text-sm font-semibold ${status?.kind === 'error' ? 'text-bad' : 'text-ok'}`}>
        {status?.text}
      </p>
    </form>
  );
}
