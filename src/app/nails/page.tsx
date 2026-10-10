import Link from 'next/link';
import { listDesignCategories, listNailDesigns } from '@/lib/designs';
import { peso } from '@/lib/format';

export const revalidate = 60;
export const metadata = { title: 'Nail designs | Clawsette' };

export default async function NailsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [categories, designs] = await Promise.all([listDesignCategories(), listNailDesigns(category)]);
  return (
    <div className="min-h-screen bg-cream text-nails">
      <header className="flex items-center justify-between px-8 py-5">
        <Link href="/" className="text-sm font-semibold">&larr; Home</Link>
        <span className="font-serif text-2xl">Clawsette</span>
        <Link href="/nails/book" className="text-sm font-bold underline underline-offset-4">Book</Link>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-nails/15 pb-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest opacity-60">Nail studio</p>
            <h1 className="font-serif text-4xl">Design portfolio</h1>
          </div>
          <p className="max-w-md text-sm opacity-75">Find a look you love, then bring it to your appointment.</p>
        </div>

        <nav className="mb-7 flex flex-wrap gap-2" aria-label="Design categories">
          <Link href="/nails" aria-current={!category ? 'page' : undefined} className={`rounded-full border px-4 py-2 text-sm font-bold ${!category ? 'border-nails bg-nails text-cream' : 'border-nails/20 hover:bg-sage'}`}>All designs</Link>
          {categories.map((item) => (
            <Link key={item.id} href={`/nails?category=${encodeURIComponent(item.slug)}`} aria-current={category === item.slug ? 'page' : undefined} className={`rounded-full border px-4 py-2 text-sm font-bold ${category === item.slug ? 'border-nails bg-nails text-cream' : 'border-nails/20 hover:bg-sage'}`}>
              {item.name}
            </Link>
          ))}
        </nav>

        {designs.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((design) => (
              <article key={design.id} className="overflow-hidden rounded-lg bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={design.image_url} alt={design.name} className="aspect-[4/3] w-full object-cover" />
                <div className="flex min-h-28 items-start justify-between gap-4 p-4">
                  <div>
                    <h2 className="font-display text-xl font-semibold">{design.name}</h2>
                    {design.category && <p className="mt-1 text-xs font-semibold uppercase tracking-wide opacity-55">{design.category.name}</p>}
                    {design.description && <p className="mt-2 text-sm opacity-75">{design.description}</p>}
                  </div>
                  {design.starting_price != null && <span className="shrink-0 text-sm font-bold">From {peso(design.starting_price)}</span>}
                </div>
                <div className="px-4 pb-4">
                  <Link href={`/nails/book?design=${encodeURIComponent(design.id)}`} className="inline-flex rounded-full border border-nails/30 px-4 py-2 text-sm font-bold hover:bg-sage">Book this look</Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="border-y border-nails/15 py-12 text-center text-sm opacity-65">No designs in this category yet.</p>
        )}
      </main>
    </div>
  );
}
