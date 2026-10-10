import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

export async function createCookieAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const jar = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Server components cannot persist refreshed cookies.
        }
      },
    },
  });
}

export async function getSignedInUser(): Promise<User | null> {
  const client = await createCookieAuthClient();
  if (!client) return null;
  const { data: { user }, error } = await client.auth.getUser();
  return error ? null : user;
}