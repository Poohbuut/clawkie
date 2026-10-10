import Link from 'next/link';
import OrderForm from '@/components/OrderForm';
import SiteHeader from '@/components/storefront/SiteHeader';
import SiteFooter from '@/components/storefront/SiteFooter';
import { listServices } from '@/lib/services';

export const revalidate = 60;
export const metadata = { title: 'Order | Cookie Cart' };

export default async function CookiesPage() {
  const cookies = await listServices('cookies');
  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <nav className="mb-2 text-xs opacity-60" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">Home</Link> / Cookies
        </nav>
        <h1 className="mb-6 font-display text-3xl font-semibold sm:text-4xl">Order cookies</h1>
        <OrderForm cookies={cookies} />
      </main>
      <SiteFooter />
    </div>
  );
}
