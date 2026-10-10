import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getService } from '@/lib/services';
import { getOrCreateCustomer } from '@/lib/customers';
import { MAX_PHOTO_BYTES, NAIL_SLOTS } from '@/lib/slots';

export const runtime = 'nodejs';

const REQUIRED = ['full_name', 'email', 'phone', 'service_id', 'appointment_date', 'appointment_time'] as const;

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const get = (k: string) => (form.get(k) as string | null)?.trim() || '';

  const missing = REQUIRED.filter((f) => !get(f));
  if (missing.length) {
    return NextResponse.json({ error: `Missing required field(s): ${missing.join(', ')}` }, { status: 400 });
  }

  const date = get('appointment_date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return NextResponse.json({ error: 'appointment_date must be in YYYY-MM-DD format' }, { status: 400 });
  }
  if (!NAIL_SLOTS.includes(get('appointment_time'))) {
    return NextResponse.json({ error: 'Invalid appointment time' }, { status: 400 });
  }

  const designId = get('design_id') || null;
  if (designId) {
    const { data: design, error } = await supabase
      .from('nail_designs')
      .select('id')
      .eq('id', designId)
      .eq('is_active', true)
      .maybeSingle();
    if (error || !design) return NextResponse.json({ error: 'Selected design is not available' }, { status: 400 });
  }

  const service = await getService(get('service_id'), 'nails');
  if (!service) return NextResponse.json({ error: 'Selected service is not available' }, { status: 400 });

  let photoUrl: string | null = null;
  const photo = form.get('inspiration_photo');
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) return NextResponse.json({ error: 'Photo must be under 8MB' }, { status: 400 });
    if (!photo.type.startsWith('image/')) return NextResponse.json({ error: 'Photo must be an image' }, { status: 400 });

    const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
    const path = `inspiration/${Date.now()}_${safeName}`;
    const { error: upErr } = await supabase.storage
      .from('inspiration-photos')
      .upload(path, Buffer.from(await photo.arrayBuffer()), { contentType: photo.type });
    if (upErr) {
      console.error(upErr);
      return NextResponse.json({ error: 'Could not upload your photo. Please try again.' }, { status: 500 });
    }
    photoUrl = supabase.storage.from('inspiration-photos').getPublicUrl(path).data.publicUrl;
  }

  try {
    const customerId = await getOrCreateCustomer(get('email'), get('full_name'), get('phone'));
    const { data, error } = await supabase
      .from('nail_appointments')
      .insert({
        customer_id: customerId,
        service_id: service.id,
        appointment_date: date,
        appointment_time: get('appointment_time'),
        design_id: designId,
        status: 'pending',
        notes: get('notes') || null,
        inspiration_photo_url: photoUrl,
        price_at_booking: service.price,
      })
      .select()
      .single();

    if (error) {
      // unique violation on (appointment_date, appointment_time)
      if (error.code === '23505' || error.message.includes('uq_appointment_slot')) {
        return NextResponse.json({ error: 'That time slot was just taken. Please pick another.' }, { status: 409 });
      }
      throw error;
    }
    return NextResponse.json({ success: true, appointment: data }, { status: 201 });
  } catch (e) {
    console.error('Failed to insert nail appointment', e);
    return NextResponse.json({ error: 'Could not save your appointment. Please try again.' }, { status: 500 });
  }
}
