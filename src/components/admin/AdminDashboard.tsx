'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from './AdminNav';
import { formatTime, peso } from '@/lib/format';

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  inspiration_photo_url: string | null;
  customer: { full_name: string; email: string } | null;
  service: { name: string } | null;
  design: { name: string } | null;
};

type Order = {
  id: string;
  status: string;
  pickup_or_delivery_date: string;
  delivery_address: string | null;
  special_instructions: string | null;
  total_amount: number;
  customer: { full_name: string; email: string } | null;
  items: { quantity: number; service: { name: string } | null }[];
};

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

export default function AdminDashboard({ email, appointments, orders }: { email: string; appointments: Appointment[]; orders: Order[] }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  async function updateStatus(kind: 'appointments' | 'orders', id: string, status: string) {
    setBusy(id);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/${kind}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Update failed.');
      setMessage('Status updated.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Update failed.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="min-h-screen bg-cream text-nails">
      <AdminNav email={email} />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-55">Operations</p>
            <h1 className="font-serif text-3xl">Bookings & orders</h1>
          </div>
          <p role="status" className="text-sm opacity-70">{message}</p>
        </div>

        <section className="mb-10" aria-labelledby="appointments-title">
          <h2 id="appointments-title" className="mb-3 font-display text-xl font-semibold">Nail appointments</h2>
          <div className="overflow-x-auto rounded-lg border border-nails/15 bg-white">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-nails/10 bg-sage/40 text-xs uppercase tracking-wide">
                <tr><th className="p-3">Date / time</th><th className="p-3">Customer</th><th className="p-3">Service / design</th><th className="p-3">Notes / photo</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {appointments.map((appointment) => (
                  <tr key={appointment.id} className="border-b border-nails/10 align-top last:border-0">
                    <td className="whitespace-nowrap p-3 font-semibold">{appointment.appointment_date}<br />{formatTime(appointment.appointment_time)}</td>
                    <td className="p-3">{appointment.customer?.full_name ?? 'Unknown'}<br /><span className="text-xs opacity-60">{appointment.customer?.email}</span></td>
                    <td className="p-3">{appointment.service?.name ?? 'Service unavailable'}<br /><span className="text-xs opacity-60">{appointment.design?.name ?? 'No design selected'}</span></td>
                    <td className="max-w-64 p-3">{appointment.notes || '—'}{appointment.inspiration_photo_url && <a href={appointment.inspiration_photo_url} target="_blank" rel="noreferrer" className="mt-1 block underline">View photo</a>}</td>
                    <td className="p-3"><select value={appointment.status} disabled={busy === appointment.id} onChange={(event) => updateStatus('appointments', appointment.id, event.target.value)} className="field-input min-w-32 py-2">
                      {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select></td>
                  </tr>
                ))}
                {!appointments.length && <tr><td colSpan={5} className="p-8 text-center opacity-60">No appointments yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="orders-title">
          <h2 id="orders-title" className="mb-3 font-display text-xl font-semibold">Cookie orders</h2>
          <div className="overflow-x-auto rounded-lg border border-nails/15 bg-white">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="border-b border-nails/10 bg-sage/40 text-xs uppercase tracking-wide">
                <tr><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3">Items</th><th className="p-3">Fulfillment details</th><th className="p-3">Total</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-nails/10 align-top last:border-0">
                    <td className="whitespace-nowrap p-3">{order.pickup_or_delivery_date}</td>
                    <td className="p-3">{order.customer?.full_name ?? 'Unknown'}<br /><span className="text-xs opacity-60">{order.customer?.email}</span></td>
                    <td className="p-3">{order.items.map((item, index) => <div key={`${item.service?.name}-${index}`}>{item.quantity} × {item.service?.name ?? 'Item'}</div>)}</td>
                    <td className="max-w-64 whitespace-pre-wrap p-3">{order.special_instructions || '—'}{order.delivery_address && <div className="mt-1">{order.delivery_address}</div>}</td>
                    <td className="whitespace-nowrap p-3 font-semibold">{peso(Number(order.total_amount))}</td>
                    <td className="p-3"><select value={order.status} disabled={busy === order.id} onChange={(event) => updateStatus('orders', order.id, event.target.value)} className="field-input min-w-32 py-2">
                      {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select></td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan={6} className="p-8 text-center opacity-60">No cookie orders yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}