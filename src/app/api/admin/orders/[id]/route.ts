import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';

type Context = { params: Promise<{ id: string }> };
const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

export async function PATCH(req: NextRequest, { params }: Context) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!STATUSES.includes(body?.status)) return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
  const { data, error } = await supabase.from('cookie_orders').update({ status: body.status }).eq('id', id).select('id, status').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not update order.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
  return NextResponse.json({ success: true, order: data });
}