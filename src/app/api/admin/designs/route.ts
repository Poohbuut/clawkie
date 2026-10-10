import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin';
import { isValidDesignImage, uploadDesignImage } from '@/lib/design-images';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const form = await req.formData();
  const name = String(form.get('name') ?? '').trim();
  const file = form.get('image');
  const priceText = String(form.get('starting_price') ?? '').trim();
  const startingPrice = priceText ? Number(priceText) : null;
  if (!name || !isValidDesignImage(file) || (startingPrice !== null && (!Number.isFinite(startingPrice) || startingPrice < 0))) {
    return NextResponse.json({ error: 'Name, a valid image under 8MB, and a valid optional price are required.' }, { status: 400 });
  }

  const image = await uploadDesignImage(file);
  if (!image) return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 });
  const categoryId = String(form.get('category_id') ?? '').trim() || null;
  const { data, error } = await supabase.from('nail_designs').insert({
    name,
    description: String(form.get('description') ?? '').trim() || null,
    category_id: categoryId,
    starting_price: startingPrice,
    image_url: image.url,
    storage_path: image.path,
  }).select().single();
  if (error) {
    await supabase.storage.from('nail-designs').remove([image.path]);
    return NextResponse.json({ error: 'Could not save design.' }, { status: 500 });
  }
  return NextResponse.json({ success: true, design: data }, { status: 201 });
}