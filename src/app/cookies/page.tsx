import Link from 'next/link';
import OrderForm from '@/components/OrderForm';
import { listServices } from '@/lib/services';

export const revalidate = 60;
export const metadata = { title: 'Order | Cookie Cart' };

export default async function CookiesPage() {
  const cookies = await listServices('cookies');
  return (
    <div className="min-h-screen bg-cream text-cookie">
      <header className="flex items-center justify-between px-8 py-5">
        <Link href="/" className="text-sm font-semibold">&larr; Home</Link>
        <span className="font-display text-xl font-semibold">Cookie Cart</span>
      </header>
      <main className="mx-auto max-w-[640px] px-6 pb-16">
        <OrderForm cookies={cookies} />
      </main>
    </div>
  );
}
