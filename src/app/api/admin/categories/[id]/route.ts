import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';

type Context = { params: Promise<{ id: string }> };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function PATCH(req: NextRequest, { params }: Context) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const slug = slugify(typeof body?.slug === 'string' && body.slug.trim() ? body.slug : name);
  const sortOrder = Number(body?.sort_order ?? 0);
  if (!name || !slug || !Number.isInteger(sortOrder) || typeof body?.is_active !== 'boolean') {
    return NextResponse.json({ error: 'Invalid category fields.' }, { status: 400 });
  }
  const { data, error } = await supabase.from('nail_design_categories').update({ name, slug, sort_order: sortOrder, is_active: body.is_active }).eq('id', id).select().maybeSingle();
  if (error) return NextResponse.json({ error: 'Could not update category. Names and slugs must be unique.' }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
  return NextResponse.json({ success: true, category: data });
}

export async function DELETE(_req: NextRequest, { params }: Context) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { error, count } = await supabase.from('nail_design_categories').delete({ count: 'exact' }).eq('id', id);
  if (error) return NextResponse.json({ error: 'Could not delete category.' }, { status: 500 });
  if (!count) return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
  return NextResponse.json({ success: true });
}