'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

export default function OwnerSetupPage() {
  const router = useRouter();
  const [qr, setQr] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    async function enroll() {
      const access = await fetch('/api/admin/mfa-enrollment');
      if (!access.ok) {
        router.replace('/owner-access');
        return;
      }
      const client = supabaseBrowser();
      const { data: factors } = await client.auth.mfa.listFactors();
      if (factors?.totp.some((factor) => factor.status === 'verified')) {
        router.replace('/owner-access');
        return;
      }
      const { data, error } = await client.auth.mfa.enroll({ factorType: 'totp' });
      if (error) setMessage(error.message);
      else {
        setQr(data.totp.qr_code);
        setFactorId(data.id);
      }
      setBusy(false);
    }
    void enroll();
  }, [router]);

  async function confirm() {
    setBusy(true);
    const { error } = await supabaseBrowser().auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    if (error) {
      setMessage('Invalid authenticator code.');
      setBusy(false);
      return;
    }
    router.replace('/admin');
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 text-nails">
      <section className="w-full max-w-sm rounded-xl bg-white p-7 shadow-lg">
        <h1 className="mb-4 font-serif text-3xl">Set up authenticator</h1>
        {qr && <img src={qr} alt="Scan with an authenticator app" className="mb-4 h-48 w-48" />}
        {factorId && <>
          <label htmlFor="setup-code" className="field-label">6-digit code</label>
          <input id="setup-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} className="field-input" />
          <button type="button" disabled={busy || code.trim().length < 6} onClick={confirm} className="mt-5 w-full rounded-full bg-nails py-3 font-bold text-white disabled:opacity-60">Confirm authenticator</button>
        </>}
        <p role="status" className="mt-4 min-h-5 text-sm text-bad">{message || (busy && !qr ? 'Preparing setup...' : '')}</p>
      </section>
    </main>
  );
}