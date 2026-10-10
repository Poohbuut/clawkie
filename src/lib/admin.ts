import type { User } from '@supabase/supabase-js';
import { supabase as admin } from './supabase';
import { createCookieAuthClient } from './auth-session';

export async function getRoleAdmin(): Promise<User | null> {
  const authClient = await createCookieAuthClient();
  if (!authClient) return null;
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return null;

  const { data, error: roleError } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return !roleError && data?.role === 'admin' ? user : null;
}

export async function getAdmin(): Promise<User | null> {
  const authClient = await createCookieAuthClient();
  if (!authClient) return null;
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return null;

  const { data: assurance, error: assuranceError } = await authClient.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance.currentLevel !== 'aal2') return null;

  const { data, error: roleError } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return !roleError && data?.role === 'admin' ? user : null;
}