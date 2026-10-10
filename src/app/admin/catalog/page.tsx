import { redirect } from 'next/navigation';
import AdminNav from '@/components/admin/AdminNav';
import AdminCatalog from '@/components/admin/AdminCatalog';
import { getAdmin } from '@/lib/admin';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function AdminCatalogPage() {
  const admin = await getAdmin();
  if (!admin) redirect('/owner-access');

  const [categoriesResult, designsResult, servicesResult] = await Promise.all([
    supabase.from('nail_design_categories').select('id, name, slug, sort_order, is_active').order('sort_order').order('name'),
    supabase.from('nail_designs').select('id, name, description, category_id, starting_price, image_url, is_active').order('created_at', { ascending: false }),
    supabase.from('services').select('id, business, name, price, duration_minutes, is_active').order('business').order('price'),
  ]);
  if (categoriesResult.error || designsResult.error || servicesResult.error) throw new Error('Could not load the admin catalog. Apply the Supabase schema migration and check table access.');

  return (
    <div className="min-h-screen bg-cream text-nails">
      <AdminNav email={admin.email ?? ''} />
      <AdminCatalog
        categories={categoriesResult.data ?? []}
        designs={(designsResult.data ?? []).map((design) => ({ ...design, starting_price: design.starting_price == null ? null : Number(design.starting_price) }))}
        services={(servicesResult.data ?? []).map((service) => ({ ...service, price: Number(service.price) }))}
      />
    </div>
  );
}