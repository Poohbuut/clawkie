import { supabase } from './supabase';

export type Service = {
  id: string;
  business: 'nails' | 'cookies';
  name: string;
  price: number;
  duration_minutes: number | null;
};

export async function listServices(business: 'nails' | 'cookies'): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, business, name, price, duration_minutes')
    .eq('business', business)
    .eq('is_active', true)
    .order('price');
  if (error) throw error;
  return (data ?? []).map((s) => ({ ...s, price: Number(s.price) })) as Service[];
}

// Prices always come from the database, never from the client.
export async function getService(id: string, business: 'nails' | 'cookies'): Promise<Service | null> {
  const { data } = await supabase
    .from('services')
    .select('id, business, name, price, duration_minutes')
    .eq('id', id)
    .eq('business', business)
    .eq('is_active', true)
    .maybeSingle();
  return data ? ({ ...data, price: Number(data.price) } as Service) : null;
}

export async function getServicesByIds(ids: string[], business: 'nails' | 'cookies'): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, business, name, price, duration_minutes')
    .in('id', ids)
    .eq('business', business)
    .eq('is_active', true);
  if (error) throw error;
  return (data ?? []).map((s) => ({ ...s, price: Number(s.price) })) as Service[];
}
