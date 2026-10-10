import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env.local.');
}

// Service-role client: bypasses RLS. Import only from server code (route handlers, server components).
export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
