import Link from 'next/link';
import SiteHeader from '@/components/storefront/SiteHeader';
import SiteFooter from '@/components/storefront/SiteFooter';
import ProductCard from '@/components/storefront/ProductCard';
import { listDesignCategories, listNailDesigns } from '@/lib/designs';
import { peso } from '@/lib/format';

export const revalidate = 60;
export const metadata = { title: 'Nail designs | Clawsette' };

export default async function NailsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const [categories, designs] = await Promise.all([listDesignCategories(), listNailDesigns(category)]);
  const pill = (active: boolean) =>
    `rounded-md border px-4 py-2 text-sm font-semibold ${active ? 'border-ink bg-ink text-cream' : 'border-ink/15 hover:bg-tan'}`;

  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <nav className="mb-2 text-xs opacity-60" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">Home</Link> / Nails
        </nav>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Nail designs</h1>
          <Link href="/nails/book" className="text-sm font-semibold underline underline-offset-4">Book without a design</Link>
        </div>

        <nav className="mb-8 flex flex-wrap gap-2" aria-label="Design categories">
          <Link href="/nails" aria-current={!category ? 'page' : undefined} className={pill(!category)}>All</Link>
          {categories.map((item) => (
            <Link key={item.id} href={`/nails?category=${encodeURIComponent(item.slug)}`} aria-current={category === item.slug ? 'page' : undefined} className={pill(category === item.slug)}>
              {item.name}
            </Link>
          ))}
        </nav>

        {designs.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {designs.map((design) => (
              <ProductCard
                key={design.id}
                href={`/nails/book?design=${encodeURIComponent(design.id)}`}
                name={design.name}
                label={design.category?.name}
                price={design.starting_price != null ? `From ${peso(design.starting_price)}` : 'Price on request'}
                image={design.image_url}
                cta="Book this look"
                ctaHref={`/nails/book?design=${encodeURIComponent(design.id)}`}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-sage p-10 text-center text-sm opacity-70">No designs in this category yet.</p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
