import Link from 'next/link';
import SiteHeader from '@/components/storefront/SiteHeader';
import SiteFooter from '@/components/storefront/SiteFooter';
import ProductCard from '@/components/storefront/ProductCard';
import { listNailDesigns } from '@/lib/designs';
import { listServices } from '@/lib/services';
import { peso } from '@/lib/format';

export const revalidate = 60;

const safe = <T,>(promise: Promise<T[]>) => promise.catch(() => [] as T[]);

function SectionTitle({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h2>
      <Link href={href} className="shrink-0 text-sm font-semibold underline underline-offset-4">{cta}</Link>
    </div>
  );
}

export default async function Home() {
  const [designs, cookies] = await Promise.all([
    safe(listNailDesigns()),
    safe(listServices('cookies')),
  ]);
  const heroImage = designs[0]?.image_url;

  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden bg-tan text-ink">
          {heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImage} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40" />
          )}
          <div className="mx-auto max-w-6xl px-5 py-20 text-center sm:py-28">
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-6xl">Nails you'll love.<br />Cookies you'll crave.</h1>
            <p className="mx-auto mt-4 max-w-md font-medium opacity-80">Book a nail appointment or order fresh-baked cookies for pick-up or delivery.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/nails" className="rounded-md bg-ink px-6 py-3 text-sm font-semibold text-cream hover:opacity-90">Shop nails</Link>
              <Link href="/cookies" className="rounded-md border border-ink bg-cream px-6 py-3 text-sm font-semibold hover:bg-ink hover:text-cream">Shop cookies</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14" aria-labelledby="categories-title">
          <h2 id="categories-title" className="mb-6 text-center font-display text-2xl font-semibold sm:text-3xl">Shop by category</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/nails" className="flex aspect-[16/9] flex-col items-center justify-center rounded-md bg-sage text-ink transition hover:opacity-90">
              <span className="font-serif text-4xl">Nails</span>
              <span className="mt-2 text-sm font-semibold underline underline-offset-4">Browse designs</span>
            </Link>
            <Link href="/cookies" className="flex aspect-[16/9] flex-col items-center justify-center rounded-md bg-tan text-ink transition hover:opacity-90">
              <span className="font-display text-4xl font-semibold">Cookies</span>
              <span className="mt-2 text-sm font-semibold underline underline-offset-4">Order now</span>
            </Link>
          </div>
        </section>

        <section id="nails" className="mx-auto max-w-6xl scroll-mt-24 px-5 pb-14" aria-label="Nail designs">
          <SectionTitle title="Nail designs" href="/nails" cta="View all" />
          {designs.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
              {designs.slice(0, 8).map((design) => (
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
            <p className="rounded-md bg-sage p-10 text-center text-sm opacity-70">New designs are coming soon. <Link href="/nails/book" className="underline">Book an appointment</Link> anyway.</p>
          )}
        </section>

        <section id="cookies" className="scroll-mt-24 bg-sage py-14" aria-label="Cookie menu">
          <div className="mx-auto max-w-6xl px-5">
            <SectionTitle title="Cookie menu" href="/cookies" cta="Start an order" />
            {cookies.length ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
                {cookies.slice(0, 8).map((cookie) => (
                  <ProductCard
                    key={cookie.id}
                    href="/cookies"
                    name={cookie.name}
                    price={`${peso(cookie.price)} each`}
                    cta="Order"
                    ctaHref="/cookies"
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-md bg-tan p-10 text-center text-sm opacity-70">No cookies on the menu right now. Check back soon.</p>
            )}
          </div>
        </section>

        <section className="bg-tan">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 text-center text-sm sm:grid-cols-3">
          {[
            ['Easy booking', 'Pick a date and time in a minute.'],
            ['Pick-up or delivery', 'Fresh cookies, your choice.'],
            ['Bring your inspo', 'Upload a photo with your booking.'],
          ].map(([title, description]) => (
            <div key={title}>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 opacity-65">{description}</p>
            </div>
          ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}