import { supabase } from './supabase';

/**
 * Guest checkout: public.users.id references auth.users, so each customer
 * needs a real Supabase Auth account even if they never set a password.
 * Note: generateLink only creates the link; it does not email it. Configure
 * custom SMTP in Supabase or send it with Resend/Postmark to deliver it.
 */
export async function getOrCreateCustomer(emailRaw: string, fullName: string, phone?: string | null): Promise<string> {
  const email = emailRaw.trim().toLowerCase();

  const { data: existing } = await supabase.from('users').select('id').eq('email', email).limit(1).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone: phone ?? null },
  });
  if (error || !created.user) throw error ?? new Error('Failed to create auth user');

  const { error: profileError } = await supabase.from('users').insert({
    id: created.user.id,
    role: 'customer',
    full_name: fullName.trim(),
    email,
    phone: phone?.trim() || null,
  });
  if (profileError) throw profileError;

  try {
    await supabase.auth.admin.generateLink({ type: 'magiclink', email });
  } catch (e) {
    console.error('Could not generate magic link for', email, e);
  }

  return created.user.id;
}
