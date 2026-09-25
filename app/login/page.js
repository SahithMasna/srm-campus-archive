'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || 'srmap.edu.in';

export default function Login() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    const value = email.trim().toLowerCase();
    if (!new RegExp(`^[^@\\s]+@${DOMAIN.replace('.', '\\.')}$`).test(value)) {
      return setError(`Use your @${DOMAIN} address. Only SRM accounts can join.`);
    }
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({ email: value });
    setBusy(false);
    if (error) return setError(error.message);
    setEmail(value);
    setStep('code');
  }

  async function verify() {
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) return setError('That code did not work. Check it, or send a new one.');
    router.push('/');
    router.refresh();
  }

  return (
    <main className="gate">
      <div className="gate-card">
        <h1>Make SRM&rsquo;s campus searchable through its memories.</h1>

        {step === 'email' ? (
          <>
            <p>Sign in with your SRM email. Only verified accounts can post.</p>
            <label className="field" htmlFor="email">Institutional email</label>
            <input id="email" className="input" type="email" autoComplete="email"
                   placeholder={`you@${DOMAIN}`} value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && sendCode()} />
            {error && <div className="err" role="alert">{error}</div>}
            <button className="btn btn-full" onClick={sendCode} disabled={busy}>
              {busy ? 'Sending…' : 'Send me a code'}
            </button>
          </>
        ) : (
          <>
            <p>We sent a 6-digit code to <b>{email}</b>. It expires in an hour.</p>
            <label className="field" htmlFor="code">Verification code</label>
            <input id="code" className="input" inputMode="numeric" autoComplete="one-time-code"
                   placeholder="000000" value={code} maxLength={6}
                   onChange={(e) => setCode(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && verify()} />
            {error && <div className="err" role="alert">{error}</div>}
            <button className="btn btn-full" onClick={verify} disabled={busy}>
              {busy ? 'Checking…' : 'Verify and enter'}
            </button>
            <button className="linkish" onClick={() => { setStep('email'); setCode(''); setError(''); }}>
              Use a different email
            </button>
          </>
        )}
      </div>
    </main>
  );
}
