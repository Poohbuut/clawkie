import Link from 'next/link';
import { redirect } from 'next/navigation';
import AccountSignOut from '@/components/account/AccountSignOut';
import { getSignedInUser } from '@/lib/auth-session';
import { formatTime, peso } from '@/lib/format';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getSignedInUser();
  if (!user) redirect('/login');

  const email = user.email ?? '';
  const { error: profileError } = await supabase.from('users').upsert({
    id: user.id,
    role: 'customer',
    full_name: String(user.user_metadata?.full_name ?? email.split('@')[0] ?? 'Customer'),
    email,
    phone: typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : null,
  }, { onConflict: 'id', ignoreDuplicates: true });
  if (profileError) throw new Error('Could not load your account profile.');

  const [profileResult, appointmentsResult, ordersResult] = await Promise.all([
    supabase.from('users').select('full_name, phone').eq('id', user.id).maybeSingle(),
    supabase.from('nail_appointments').select('id, appointment_date, appointment_time, status, price_at_booking, service:services(name), design:nail_designs(name)').eq('customer_id', user.id).order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false }),
    supabase.from('cookie_orders').select('id, pickup_or_delivery_date, status, total_amount, special_instructions, cookie_order_items(quantity, price_at_order, service:services(name))').eq('customer_id', user.id).order('created_at', { ascending: false }),
  ]);
  if (appointmentsResult.error || ordersResult.error) throw new Error('Could not load your account history.');

  const one = <T,>(value: T | T[] | null): T | null => Array.isArray(value) ? value[0] ?? null : value;
  const appointments = (appointmentsResult.data ?? []).map((appointment) => ({
    ...appointment,
    service: one(appointment.service),
    design: one(appointment.design),
  }));
  const orders = (ordersResult.data ?? []).map((order) => ({
    ...order,
    cookie_order_items: order.cookie_order_items.map((item) => ({
      ...item,
      service: one(item.service),
    })),
  }));

  return (
    <main className="min-h-screen bg-cream px-5 py-8 text-nails">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between border-b border-nails/15 pb-5">
          <div><Link href="/" className="text-sm font-semibold">&larr; Home</Link><h1 className="mt-2 font-serif text-4xl">Your account</h1><p className="mt-1 text-sm opacity-70">{profileResult.data?.full_name ?? user.email}</p></div>
          <AccountSignOut />
        </header>

        <section className="mb-10" aria-labelledby="appointments-heading">
          <h2 id="appointments-heading" className="mb-3 font-display text-2xl font-semibold">Nail appointments</h2>
          <div className="divide-y divide-nails/10 rounded-lg border border-nails/15 bg-white">
            {appointments.map((appointment) => (
              <article key={appointment.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div><h3 className="font-bold">{appointment.design?.name ?? appointment.service?.name ?? 'Nail appointment'}</h3><p className="mt-1 text-sm opacity-70">{appointment.appointment_date} at {formatTime(appointment.appointment_time)}</p></div>
                <div className="text-right"><p className="font-semibold">{peso(Number(appointment.price_at_booking))}</p><p className="text-xs capitalize opacity-65">{appointment.status}</p></div>
              </article>
            ))}
            {!appointments.length && <p className="p-6 text-sm opacity-65">No appointments yet. <Link href="/nails" className="underline">Browse nail designs</Link>.</p>}
          </div>
        </section>

        <section aria-labelledby="orders-heading">
          <h2 id="orders-heading" className="mb-3 font-display text-2xl font-semibold">Cookie orders</h2>
          <div className="divide-y divide-nails/10 rounded-lg border border-nails/15 bg-white">
            {orders.map((order) => (
              <article key={order.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div><h3 className="font-bold">Order for {order.pickup_or_delivery_date}</h3><ul className="mt-1 text-sm opacity-75">{order.cookie_order_items.map((item, index) => <li key={`${item.service?.name}-${index}`}>{item.quantity} × {item.service?.name ?? 'Cookie'}</li>)}</ul>{order.special_instructions && <p className="mt-2 whitespace-pre-wrap text-xs opacity-65">{order.special_instructions}</p>}</div>
                <div className="text-right"><p className="font-semibold">{peso(Number(order.total_amount))}</p><p className="text-xs capitalize opacity-65">{order.status}</p></div>
              </article>
            ))}
            {!orders.length && <p className="p-6 text-sm opacity-65">No cookie orders yet. <Link href="/cookies" className="underline">Browse the menu</Link>.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}