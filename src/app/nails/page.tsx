import Link from 'next/link';
import BookingForm from '@/components/BookingForm';
import { listServices } from '@/lib/services';

export const revalidate = 60;
export const metadata = { title: 'Book | Clawsette' };

export default async function NailsPage() {
  const services = await listServices('nails');
  return (
    <div className="min-h-screen bg-cream text-nails">
      <header className="flex items-center justify-between px-8 py-5">
        <Link href="/" className="text-sm font-semibold">&larr; Home</Link>
        <span className="font-serif text-2xl">Clawsette</span>
      </header>
      <main className="mx-auto max-w-xl px-6 pb-16">
        <BookingForm services={services} />
      </main>
    </div>
  );
}
