import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getServicesByIds } from '@/lib/services';
import { getOrCreateCustomer } from '@/lib/customers';
import { DELIVERY_SLOTS, PICKUP_SLOTS } from '@/lib/slots';

type Body = {
  full_name?: string;
  email?: string;
  phone?: string;
  fulfillment_method?: 'pickup' | 'delivery';
  order_date?: string;
  order_time?: string;
  delivery_address?: string | null;
  allergies?: string | null;
  notes?: string | null;
  order_items?: { service_id: string; qty: number }[];
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body) return NextResponse.json({ error: 'Invalid or missing JSON body' }, { status: 400 });

  const { full_name, email, phone, fulfillment_method, order_date, order_time, order_items } = body;

  if (!full_name || !email || !phone || !fulfillment_method || !order_date || !order_time) {
    return NextResponse.json({ error: 'Please fill in all required fields' }, { status: 400 });
  }
  if (fulfillment_method !== 'pickup' && fulfillment_method !== 'delivery') {
    return NextResponse.json({ error: "fulfillment_method must be 'pickup' or 'delivery'" }, { status: 400 });
  }
  if (fulfillment_method === 'delivery' && !body.delivery_address?.trim()) {
    return NextResponse.json({ error: 'A delivery address is required for delivery orders' }, { status: 400 });
  }
  const validSlots = fulfillment_method === 'delivery' ? DELIVERY_SLOTS : PICKUP_SLOTS;
  if (!validSlots.includes(order_time)) {
    return NextResponse.json({ error: 'Invalid time for this fulfillment method' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(order_date) || Number.isNaN(Date.parse(order_date))) {
    return NextResponse.json({ error: 'order_date must be in YYYY-MM-DD format' }, { status: 400 });
  }
  if (!Array.isArray(order_items) || order_items.length === 0) {
    return NextResponse.json({ error: 'Add at least one cookie to your order' }, { status: 400 });
  }
  if (!order_items.every((i) => i?.service_id && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 100)) {
    return NextResponse.json({ error: 'Each item needs a service_id and a whole-number quantity' }, { status: 400 });
  }

  // Merge duplicates, then price everything from the database.
  const qtyById = new Map<string, number>();
  for (const i of order_items) qtyById.set(i.service_id, (qtyById.get(i.service_id) ?? 0) + i.qty);

  const services = await getServicesByIds([...qtyById.keys()], 'cookies');
  if (services.length !== qtyById.size) {
    return NextResponse.json({ error: 'One or more items are no longer available' }, { status: 400 });
  }

  let total = 0;
  const lineItems = services.map((s) => {
    const quantity = qtyById.get(s.id)!;
    total += s.price * quantity;
    return { service_id: s.id, quantity, price_at_order: s.price };
  });

  // cookie_orders has no columns for time or fulfillment method yet,
  // so they are recorded in special_instructions. Add columns later if you want to query them.
  const instructions = [
    `${fulfillment_method === 'delivery' ? 'Delivery' : 'Pick-up'} at ${order_time}`,
    body.allergies ? `Allergies: ${body.allergies}` : null,
    body.notes || null,
  ].filter(Boolean).join('\n');

  try {
    const customerId = await getOrCreateCustomer(email, full_name, phone);

    const { data: order, error } = await supabase
      .from('cookie_orders')
      .insert({
        customer_id: customerId,
        status: 'pending',
        pickup_or_delivery_date: order_date,
        delivery_address: fulfillment_method === 'delivery' ? body.delivery_address!.trim() : null,
        special_instructions: instructions,
        total_amount: Math.round(total * 100) / 100,
      })
      .select()
      .single();
    if (error) throw error;

    const { error: itemsError } = await supabase
      .from('cookie_order_items')
      .insert(lineItems.map((li) => ({ ...li, order_id: order.id })));
    if (itemsError) {
      await supabase.from('cookie_orders').delete().eq('id', order.id); // don't leave an empty order behind
      throw itemsError;
    }

    return NextResponse.json({ success: true, order: { ...order, items: lineItems } }, { status: 201 });
  } catch (e) {
    console.error('Failed to insert cookie order', e);
    return NextResponse.json({ error: 'Could not save your order. Please try again.' }, { status: 500 });
  }
}
