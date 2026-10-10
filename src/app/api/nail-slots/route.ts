import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Returns the already-booked times for a date so the UI can disable them.
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('nail_appointments')
    .select('appointment_time')
    .eq('appointment_date', date)
    .neq('status', 'cancelled');
  if (error) return NextResponse.json({ error: 'Could not load slots' }, { status: 500 });
  return NextResponse.json({ taken: (data ?? []).map((r) => String(r.appointment_time).slice(0, 5)) });
}
