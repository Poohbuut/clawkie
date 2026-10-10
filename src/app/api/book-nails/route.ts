import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getService } from '@/lib/services';
import { getOrCreateCustomer } from '@/lib/customers';
import { NAIL_SLOTS } from '@/lib/slots';
import { notifyAppointmentCreated } from '@/lib/notify';

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
  let designName: string | null = null;
  if (designId) {
    const { data: design, error } = await supabase
      .from('nail_designs')
      .select('id, name')
      .eq('id', designId)
      .eq('is_active', true)
      .maybeSingle();
    if (error || !design) return NextResponse.json({ error: 'Selected design is not available' }, { status: 400 });
    designName = design.name;
  }

  const service = await getService(get('service_id'), 'nails');
  if (!service) return NextResponse.json({ error: 'Selected service is not available' }, { status: 400 });

  const bucket = 'inspiration-photos';
  let photoUrl: string | null = null;
  let photoPath: string | null = null;
  const rawPath = get('photo_path');
  if (rawPath) {
    if (!/^inspiration\/[0-9a-f-]{36}\.(jpg|png|webp|heic)$/.test(rawPath)) {
      return NextResponse.json({ error: 'Invalid photo reference' }, { status: 400 });
    }
    const { data: exists, error: existsError } = await supabase.storage.from(bucket).exists(rawPath);
    if (existsError || !exists) return NextResponse.json({ error: 'Photo upload not found. Please re-attach it.' }, { status: 400 });
    photoPath = rawPath;
    photoUrl = supabase.storage.from(bucket).getPublicUrl(rawPath).data.publicUrl;
  }

  const discardPhoto = async () => {
    if (photoPath) await supabase.storage.from(bucket).remove([photoPath]);
  };

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
        await discardPhoto();
        return NextResponse.json({ error: 'That time slot was just taken. Please pick another.' }, { status: 409 });
      }
      throw error;
    }
    await notifyAppointmentCreated({
      customerName: get('full_name'),
      customerEmail: get('email'),
      phone: get('phone'),
      serviceName: service.name,
      designName,
      date,
      time: get('appointment_time'),
      notes: get('notes'),
      photoUrl,
    });
    return NextResponse.json({ success: true, appointment: data }, { status: 201 });
  } catch (e) {
    await discardPhoto();
    console.error('Failed to insert nail appointment', e);
    return NextResponse.json({ error: 'Could not save your appointment. Please try again.' }, { status: 500 });
  }
}
