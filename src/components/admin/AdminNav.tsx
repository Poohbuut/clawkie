'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function AdminNav({ email }: { email: string }) {
  const router = useRouter();

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace('/owner-access');
    router.refresh();
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-nails/15 px-6 py-4">
      <Link href="/admin" className="font-serif text-2xl">Clawsette Admin</Link>
      <nav className="flex items-center gap-4 text-sm font-semibold">
        <Link href="/admin" className="hover:underline">Bookings & orders</Link>
        <Link href="/admin/catalog" className="hover:underline">Catalog & prices</Link>
        <span className="hidden opacity-60 sm:inline">{email}</span>
        <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="rounded-full border border-nails/25 px-3 py-1.5 hover:bg-sage">Sign out</button>
      </nav>
    </header>
  );
}