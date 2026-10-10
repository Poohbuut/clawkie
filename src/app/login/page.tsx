'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase-browser';

type Mode = 'code' | 'password' | 'forgot';
type Step = 'email' | 'verify' | 'newpass';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('code');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  function sendCode() {
    return run(async () => {
      const client = supabaseBrowser();
      const { error } = mode === 'forgot'
        ? await client.auth.resetPasswordForEmail(email.trim())
        : await client.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
      if (error) throw error;
      setStep('verify');
      setMessage('We emailed you a code.');
    });
  }

  function verifyCode() {
    return run(async () => {
      const { error } = await supabaseBrowser().auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: mode === 'forgot' ? 'recovery' : 'email',
      });
      if (error) throw error;
      if (mode === 'forgot') setStep('newpass');
      else {
        router.push('/account');
        router.refresh();
      }
    });
  }

  function savePassword() {
    return run(async () => {
      if (password.length < 8) throw new Error('Use at least 8 characters.');
      const { error } = await supabaseBrowser().auth.updateUser({ password });
      if (error) throw error;
      router.push('/account');
      router.refresh();
    });
  }

  function passwordLogin() {
    return run(async () => {
      const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      router.push('/account');
      router.refresh();
    });
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setStep('email');
    setMessage('');
    setCode('');
    setPassword('');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 text-nails">
      <section className="w-full max-w-sm rounded-xl bg-white p-7 shadow-lg">
        <h1 className="mb-6 font-serif text-4xl">{mode === 'forgot' ? 'Reset password' : 'Log in'}</h1>
        {step === 'email' && <>
          <label className="field-label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="field-input mb-4 focus:ring-sage" />
          {mode === 'password' && <>
            <label className="field-label" htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-input mb-4 focus:ring-sage" />
          </>}
          <button type="button" disabled={busy || !email || (mode === 'password' && !password)} onClick={mode === 'password' ? passwordLogin : sendCode} className="w-full rounded-full bg-nails py-3 font-bold text-white disabled:opacity-60">
            {busy ? 'Please wait...' : mode === 'password' ? 'Log in' : mode === 'forgot' ? 'Email reset code' : 'Email me a code'}
          </button>
        </>}
        {step === 'verify' && <>
          <label className="field-label" htmlFor="code">6-digit code sent to {email}</label>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} className="field-input mb-4 tracking-widest focus:ring-sage" />
          <button type="button" disabled={busy || code.trim().length < 6} onClick={verifyCode} className="w-full rounded-full bg-nails py-3 font-bold text-white disabled:opacity-60">Verify</button>
        </>}
        {step === 'newpass' && <>
          <label className="field-label" htmlFor="new-password">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="field-input mb-4 focus:ring-sage" />
          <button type="button" disabled={busy} onClick={savePassword} className="w-full rounded-full bg-nails py-3 font-bold text-white disabled:opacity-60">Save password</button>
        </>}
        <p role="status" className="mt-3 min-h-5 text-sm font-semibold">{message}</p>
        {step === 'email' && <div className="mt-5 flex flex-col items-start gap-2 text-sm font-semibold underline underline-offset-4">
          {mode !== 'code' && <button type="button" onClick={() => switchMode('code')}>Use an emailed code instead</button>}
          {mode !== 'password' && <button type="button" onClick={() => switchMode('password')}>Use my password</button>}
          {mode !== 'forgot' && <button type="button" onClick={() => switchMode('forgot')}>Forgot password?</button>}
        </div>}
      </section>
    </main>
  );
}