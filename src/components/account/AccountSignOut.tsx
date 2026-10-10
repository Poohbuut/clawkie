'use client';

import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function AccountSignOut() {
  const router = useRouter();

  async function signOut() {
    await supabaseBrowser().auth.signOut();
    router.replace('/');
    router.refresh();
  }

  return <button type="button" onClick={signOut} className="rounded-full border border-nails/25 px-4 py-2 text-sm font-bold hover:bg-sage">Log out</button>;
}