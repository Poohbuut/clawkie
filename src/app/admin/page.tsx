import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { getAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/owner-access');

  const [appointmentsResult, ordersResult] = await Promise.all([
    supabase.from('nail_appointments').select('id, appointment_date, appointment_time, status, notes, inspiration_photo_url, customer:users(full_name, email), service:services(name), design:nail_designs(name)').order('appointment_date', { ascending: false }).order('appointment_time', { ascending: false }),
    supabase.from('cookie_orders').select('id, status, pickup_or_delivery_date, delivery_address, special_instructions, total_amount, customer:users(full_name, email), items:cookie_order_items(quantity, service:services(name))').order('created_at', { ascending: false }),
  ]);
  if (appointmentsResult.error || ordersResult.error) throw new Error('Could not load admin records. Check the database schema and relationships.');

  const one = <T,>(value: T | T[] | null): T | null => Array.isArray(value) ? value[0] ?? null : value;
  const appointments = (appointmentsResult.data ?? []).map((item) => ({
    ...item,
    customer: one(item.customer),
    service: one(item.service),
    design: one(item.design),
  }));
  const orders = (ordersResult.data ?? []).map((item) => ({
    ...item,
    customer: one(item.customer),
    total_amount: Number(item.total_amount),
    items: (item.items ?? []).map((line) => ({ ...line, service: one(line.service) })),
  }));
  return <AdminDashboard email={admin.email ?? ''} appointments={appointments} orders={orders} />;
}