'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { peso } from '@/lib/format';

type Category = { id: string; name: string; slug: string; sort_order: number; is_active: boolean };
type Design = { id: string; name: string; description: string | null; category_id: string | null; starting_price: number | null; image_url: string; is_active: boolean };
type Service = { id: string; business: string; name: string; price: number; duration_minutes: number | null; is_active: boolean };

export default function AdminCatalog({ categories, designs, services }: { categories: Category[]; designs: Design[]; services: Service[] }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  async function send(url: string, method: string, body: BodyInit) {
    setMessage('');
    setBusy(url);
    try {
      const response = await fetch(url, { method, body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save changes.');
      setMessage('Saved.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save changes.');
    } finally {
      setBusy('');
    }
  }

  async function submitDesign(event: React.FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set('is_active', String(form.has('is_active')));
    await send(id ? `/api/admin/designs/${id}` : '/api/admin/designs', id ? 'PATCH' : 'POST', form);
  }

  async function submitCategory(event: React.FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await send(id ? `/api/admin/categories/${id}` : '/api/admin/categories', id ? 'PATCH' : 'POST', JSON.stringify({
      name: form.get('name'),
      sort_order: Number(form.get('sort_order') ?? 0),
      is_active: form.has('is_active'),
    }));
  }

  async function submitService(event: React.FormEvent<HTMLFormElement>, service: Service) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await send(`/api/admin/services/${service.id}`, 'PATCH', JSON.stringify({
      name: form.get('name'),
      price: form.get('price'),
      duration_minutes: form.get('duration_minutes'),
      is_active: form.has('is_active'),
    }));
  }

  async function remove(url: string) {
    if (!window.confirm('Delete this item?')) return;
    await send(url, 'DELETE', new FormData());
  }

  const inputClass = 'field-input py-2';
  const sectionClass = 'mb-10 border-b border-nails/15 pb-9 last:border-0';

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-widest opacity-55">Store setup</p><h1 className="font-serif text-3xl">Catalog & prices</h1></div>
        <p role="status" className="text-sm opacity-70">{message}</p>
      </div>

      <section className={sectionClass} aria-labelledby="designs-title">
        <h2 id="designs-title" className="mb-4 font-display text-xl font-semibold">Nail designs</h2>
        <form onSubmit={(event) => submitDesign(event)} className="mb-6 grid gap-3 rounded-lg border border-nails/15 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
          <input name="name" required placeholder="Design name" aria-label="Design name" className={inputClass} />
          <select name="category_id" aria-label="Category" defaultValue="" className={inputClass}><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
          <input name="starting_price" type="number" min="0" step="0.01" placeholder="Starting price" aria-label="Starting price" className={inputClass} />
          <input name="description" placeholder="Description" aria-label="Description" className={`${inputClass} sm:col-span-2`} />
          <input name="image" type="file" accept="image/*" required aria-label="Design image" className="field-input py-2 text-sm" />
          <button disabled={busy === '/api/admin/designs'} className="rounded-full bg-nails px-4 py-2 text-sm font-bold text-white disabled:opacity-60">Add design</button>
        </form>
        <div className="space-y-3">
          {designs.map((design) => (
            <form key={design.id} onSubmit={(event) => submitDesign(event, design.id)} className="grid gap-3 rounded-lg border border-nails/15 bg-white p-4 sm:grid-cols-[96px_1fr_1fr]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={design.image_url} alt="" className="aspect-square w-24 rounded-md object-cover" />
              <div className="grid content-start gap-2">
                <input name="name" required defaultValue={design.name} aria-label="Design name" className={inputClass} />
                <textarea name="description" defaultValue={design.description ?? ''} aria-label="Description" rows={2} className={inputClass} />
              </div>
              <div className="grid content-start gap-2">
                <select name="category_id" defaultValue={design.category_id ?? ''} aria-label="Category" className={inputClass}><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
                <input name="starting_price" type="number" min="0" step="0.01" defaultValue={design.starting_price ?? ''} aria-label="Starting price" placeholder="Starting price" className={inputClass} />
                <input name="image" type="file" accept="image/*" aria-label="Replace image" className="field-input py-2 text-xs" />
                <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={design.is_active} /> Visible in portfolio</label>
                <div className="flex gap-2">
                  <button disabled={busy === `/api/admin/designs/${design.id}`} className="rounded-full bg-nails px-4 py-2 text-sm font-bold text-white">Save</button>
                  <button type="button" onClick={() => remove(`/api/admin/designs/${design.id}`)} className="rounded-full border border-bad/40 px-4 py-2 text-sm font-bold text-bad">Delete</button>
                </div>
              </div>
            </form>
          ))}
          {!designs.length && <p className="text-sm opacity-60">No designs added yet.</p>}
        </div>
      </section>

      <section className={sectionClass} aria-labelledby="categories-title">
        <h2 id="categories-title" className="mb-4 font-display text-xl font-semibold">Design categories</h2>
        <form onSubmit={(event) => submitCategory(event)} className="mb-4 flex flex-wrap gap-2">
          <input name="name" required placeholder="New category" aria-label="New category" className={`${inputClass} min-w-48 flex-1`} />
          <input name="sort_order" type="number" step="1" defaultValue="0" aria-label="Sort order" className={`${inputClass} w-28`} />
          <button disabled={busy === '/api/admin/categories'} className="rounded-full bg-nails px-4 py-2 text-sm font-bold text-white">Add category</button>
        </form>
        <div className="space-y-2">
          {categories.map((category) => (
            <form key={category.id} onSubmit={(event) => submitCategory(event, category.id)} className="grid gap-2 rounded-lg border border-nails/15 bg-white p-3 sm:grid-cols-[1fr_8rem_auto_auto] sm:items-center">
              <input name="name" required defaultValue={category.name} aria-label="Category name" className={inputClass} />
              <input name="sort_order" type="number" step="1" defaultValue={category.sort_order} aria-label="Sort order" className={inputClass} />
              <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={category.is_active} /> Visible</label>
              <div className="flex gap-2"><button className="rounded-full border border-nails/25 px-3 py-2 text-sm font-bold">Save</button><button type="button" onClick={() => remove(`/api/admin/categories/${category.id}`)} className="rounded-full border border-bad/40 px-3 py-2 text-sm font-bold text-bad">Delete</button></div>
            </form>
          ))}
        </div>
      </section>

      <section aria-labelledby="services-title">
        <h2 id="services-title" className="mb-4 font-display text-xl font-semibold">Menu & prices</h2>
        <div className="space-y-3">
          {services.map((service) => (
            <form key={service.id} onSubmit={(event) => submitService(event, service)} className="grid gap-2 rounded-lg border border-nails/15 bg-white p-3 sm:grid-cols-[7rem_1fr_9rem_9rem_auto_auto] sm:items-center">
              <span className="text-xs font-bold uppercase tracking-wide opacity-55">{service.business}</span>
              <input name="name" required defaultValue={service.name} aria-label="Service name" className={inputClass} />
              <input name="price" type="number" min="0" step="0.01" required defaultValue={service.price} aria-label="Price" className={inputClass} />
              <input name="duration_minutes" type="number" min="1" step="1" defaultValue={service.duration_minutes ?? ''} aria-label="Duration in minutes" placeholder="Duration" className={inputClass} />
              <label className="flex items-center gap-2 text-sm"><input name="is_active" type="checkbox" defaultChecked={service.is_active} /> Active</label>
              <button className="rounded-full border border-nails/25 px-3 py-2 text-sm font-bold">Save</button>
            </form>
          ))}
          {!services.length && <p className="text-sm opacity-60">No services found.</p>}
        </div>
      </section>
    </main>
  );
}