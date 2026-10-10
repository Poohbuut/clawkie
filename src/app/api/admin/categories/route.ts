import { NextRequest, NextResponse } from 'next/server';
import { getAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export async function POST(req: NextRequest) {
  if (!(await getAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const slug = slugify(typeof body?.slug === 'string' && body.slug.trim() ? body.slug : name);
  const sortOrder = Number(body?.sort_order ?? 0);
  if (!name || !slug || !Number.isInteger(sortOrder)) return NextResponse.json({ error: 'Name and valid sort order are required.' }, { status: 400 });
  const { data, error } = await supabase.from('nail_design_categories').insert({ name, slug, sort_order: sortOrder }).select().single();
  if (error) return NextResponse.json({ error: 'Could not create category. Names and slugs must be unique.' }, { status: 400 });
  return NextResponse.json({ success: true, category: data }, { status: 201 });
}