import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin';
import { isValidDesignImage, uploadDesignImage } from '@/lib/design-images';
import { supabase } from '@/lib/supabase';

type Context = { params: Promise<{ id: string }> };

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: Context) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const form = await req.formData();
  const name = String(form.get('name') ?? '').trim();
  const priceText = String(form.get('starting_price') ?? '').trim();
  const startingPrice = priceText ? Number(priceText) : null;
  const isActiveValue = form.get('is_active');
  const file = form.get('image');
  if (!name || (startingPrice !== null && (!Number.isFinite(startingPrice) || startingPrice < 0)) || !['true', 'false'].includes(String(isActiveValue))) {
    return NextResponse.json({ error: 'Invalid design fields.' }, { status: 400 });
  }
  if (file && file !== 'null' && !isValidDesignImage(file)) {
    return NextResponse.json({ error: 'Choose an image under 8MB.' }, { status: 400 });
  }

  const { data: current, error: lookupError } = await supabase.from('nail_designs').select('storage_path').eq('id', id).maybeSingle();
  if (lookupError || !current) return NextResponse.json({ error: 'Design not found.' }, { status: 404 });

  const values: Record<string, unknown> = {
    name,
    description: String(form.get('description') ?? '').trim() || null,
    category_id: String(form.get('category_id') ?? '').trim() || null,
    starting_price: startingPrice,
    is_active: isActiveValue === 'true',
  };
  let newImage: { path: string; url: string } | null = null;
  if (isValidDesignImage(file)) {
    newImage = await uploadDesignImage(file);
    if (!newImage) return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 });
    values.image_url = newImage.url;
    values.storage_path = newImage.path;
  }

  const { data, error } = await supabase.from('nail_designs').update(values).eq('id', id).select().single();
  if (error) {
    if (newImage) await supabase.storage.from('nail-designs').remove([newImage.path]);
    return NextResponse.json({ error: 'Could not update design.' }, { status: 500 });
  }
  if (newImage && current.storage_path) await supabase.storage.from('nail-designs').remove([current.storage_path]);
  return NextResponse.json({ success: true, design: data });
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { data: current, error: lookupError } = await supabase.from('nail_designs').select('storage_path').eq('id', id).maybeSingle();
  if (lookupError || !current) return NextResponse.json({ error: 'Design not found.' }, { status: 404 });
  const { error } = await supabase.from('nail_designs').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'Could not delete design.' }, { status: 500 });
  if (current.storage_path) await supabase.storage.from('nail-designs').remove([current.storage_path]);
  return NextResponse.json({ success: true });
}