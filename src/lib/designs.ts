import { supabase } from './supabase';
import type { NailDesign, NailDesignCategory } from '@/types';

export async function listDesignCategories(): Promise<NailDesignCategory[]> {
  const { data, error } = await supabase
    .from('nail_design_categories')
    .select('id, name, slug, sort_order')
    .eq('is_active', true)
    .order('sort_order')
    .order('name');
  if (error) throw error;
  return (data ?? []) as NailDesignCategory[];
}

export async function listNailDesigns(categorySlug?: string): Promise<NailDesign[]> {
  let categoryId: string | undefined;
  if (categorySlug) {
    const { data: category, error: categoryError } = await supabase
      .from('nail_design_categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .maybeSingle();
    if (categoryError) throw categoryError;
    if (!category) return [];
    categoryId = category.id;
  }

  let query = supabase
    .from('nail_designs')
    .select('id, name, description, category_id, starting_price, image_url, category:nail_design_categories(id, name, slug)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (categoryId) query = query.eq('category_id', categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((design) => ({
    ...design,
    category: Array.isArray(design.category) ? design.category[0] ?? null : design.category,
    starting_price: design.starting_price == null ? null : Number(design.starting_price),
  })) as NailDesign[];
}

export async function getNailDesign(id: string): Promise<NailDesign | null> {
  const { data, error } = await supabase
    .from('nail_designs')
    .select('id, name, description, category_id, starting_price, image_url, category:nail_design_categories(id, name, slug)')
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    category: Array.isArray(data.category) ? data.category[0] ?? null : data.category,
    starting_price: data.starting_price == null ? null : Number(data.starting_price),
  } as NailDesign;
}