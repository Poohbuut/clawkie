import Link from 'next/link';
import BookingForm from '@/components/BookingForm';
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
    <div className="min-h-screen bg-cream text-nails">
      <header className="flex items-center justify-between px-8 py-5">
        <Link href="/nails" className="text-sm font-semibold">&larr; Designs</Link>
        <span className="font-serif text-2xl">Clawsette</span>
        <span className="w-14" aria-hidden="true" />
      </header>
      <main className="mx-auto max-w-xl px-6 pb-16">
        <BookingForm services={services} design={design} />
      </main>
    </div>
  );
}