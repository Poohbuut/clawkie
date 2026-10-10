import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Context) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const price = Number(body?.price);
  const duration = body?.duration_minutes === '' || body?.duration_minutes == null ? null : Number(body.duration_minutes);
  if (!name || !Number.isFinite(price) || price < 0 || (duration !== null && (!Number.isInteger(duration) || duration <= 0)) || typeof body?.is_active !== 'boolean') {
    return NextResponse.json({ error: 'Invalid service fields.' }, { status: 400 });
  }
  const { data, error } = await supabase.from('services').update({
    name,
    price,
    duration_minutes: duration,
    is_active: body.is_active,
  }).eq('id', id).select('id, business, name, price, duration_minutes, is_active').maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not update service.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });
  return NextResponse.json({ success: true, service: data });
}