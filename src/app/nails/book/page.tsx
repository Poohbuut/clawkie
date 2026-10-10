import Link from 'next/link';
import BookingForm from '@/components/BookingForm';
import SiteHeader from '@/components/storefront/SiteHeader';
import SiteFooter from '@/components/storefront/SiteFooter';
import { getNailDesign } from '@/lib/designs';
import { listServices } from '@/lib/services';

export const revalidate = 60;
export const metadata = { title: 'Book an appointment | Clawsette' };

export default async function NailBookingPage({ searchParams }: { searchParams: Promise<{ design?: string }> }) {
  const { design: designId } = await searchParams;
  const [services, design] = await Promise.all([
    listServices('nails'),
    designId ? getNailDesign(designId) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-10">
        <nav className="mb-4 text-xs opacity-60" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/nails" className="hover:underline">Nails</Link> / Book
        </nav>
        <BookingForm services={services} design={design} />
      </main>
      <SiteFooter />
    </div>
  );
}