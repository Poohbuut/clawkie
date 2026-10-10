'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function OwnerAccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function step1() {
    setBusy(true);
    setMessage('');
    try {
      const client = supabaseBrowser();
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error('Invalid credentials.');
      const access = await fetch('/api/admin/mfa-enrollment');
      if (!access.ok) {
        await client.auth.signOut();
        throw new Error('This account does not have owner access.');
      }
      const { data, error: factorsError } = await client.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      const totp = data.totp.find((factor) => factor.status === 'verified');
      if (!totp) {
        router.push('/owner-access/setup');
        return;
      }
      setFactorId(totp.id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  async function step2() {
    if (!factorId) return;
    setBusy(true);
    setMessage('');
    const { error } = await supabaseBrowser().auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (error) setMessage('Invalid authenticator code.');
    else {
      router.push('/admin');
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 text-nails">
      <section className="w-full max-w-sm rounded-xl bg-white p-7 shadow-lg">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest opacity-55">Owner access</p>
        <h1 className="mb-6 font-serif text-3xl">{factorId ? 'Authenticator check' : 'Sign in'}</h1>
        {!factorId ? <>
          <label htmlFor="owner-email" className="field-label">Email</label>
          <input id="owner-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="field-input mb-4" />
          <label htmlFor="owner-password" className="field-label">Password</label>
          <input id="owner-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-input" />
          <button type="button" disabled={busy || !email || !password} onClick={step1} className="mt-6 w-full rounded-full bg-nails py-3 font-bold text-white disabled:opacity-60">Continue</button>
        </> : <>
          <label htmlFor="owner-code" className="field-label">6-digit authenticator code</label>
          <input id="owner-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} className="field-input tracking-widest" />
          <button type="button" disabled={busy || code.trim().length < 6} onClick={step2} className="mt-6 w-full rounded-full bg-nails py-3 font-bold text-white disabled:opacity-60">Verify</button>
        </>}
        <p role="status" className="mt-4 min-h-5 text-sm text-bad">{message}</p>
      </section>
    </main>
  );
}