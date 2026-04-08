// Supabase → Authentication → URL Configuration
// Site URL: https://inspektiq.io
// Redirect URLs: https://inspektiq.io/auth/confirm, http://localhost:3000/auth/confirm
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';

type Status = 'loading' | 'ready' | 'submitting' | 'done' | 'error';

export default function AcceptInvitePage() {
  const [status, setStatus] = useState<Status>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Supabase invite links append `#access_token=...&type=invite` as a URL hash
    // fragment. The Next.js App Router does not auto-rehydrate this into the
    // Supabase client, so we parse it manually and exchange it for a session.
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (!hash) {
      setStatus('error');
      setError('No invite token found in URL.');
      return;
    }

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (!accessToken || type !== 'invite') {
      setStatus('error');
      setError('Invalid or missing invite token.');
      return;
    }

    void supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken ?? '' })
      .then(({ data, error: setError2 }) => {
        if (setError2 || !data.session?.user?.email) {
          setStatus('error');
          setError('This invite link has expired. Please ask your firm admin to resend your invitation.');
          return;
        }
        setEmail(data.session.user.email);
        setStatus('ready');
      });
  }, []);

  async function handleSubmit() {
    setError(null);
    if (status !== 'ready') {
      setError('This invite link has expired. Please ask your firm admin to resend your invitation.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setStatus('submitting');
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setStatus('ready');
      setError(updateError.message);
      return;
    }

    // Look up the user's role + id to decide where to send them.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let target = '/dashboard';
    if (user?.id) {
      const { data: firmUser } = await supabase
        .from('firm_users')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle<{ role: string }>();
      if (firmUser?.role === 'adjuster') {
        target = `/adjusters/${user.id}`;
      }
    }
    setStatus('done');
    window.location.href = target;
  }

  return (
    <main
      className="page-enter"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
      }}
    >
      <Card
        style={{
          width: 'min(560px, 100%)',
          padding: '32px',
          background: 'linear-gradient(180deg, rgba(22, 33, 48, 0.94), rgba(15, 25, 35, 0.98))',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <div
            style={{
              fontFamily: 'Orbitron, sans-serif',
              fontSize: '20px',
              fontWeight: 900,
              letterSpacing: '0.04em',
              marginBottom: '14px',
            }}
          >
            <span style={{ color: 'var(--white)' }}>INSPEKT</span>
            <span style={{ color: 'var(--sage)' }}>iQ</span>
          </div>
          <h1
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800,
              fontSize: '26px',
              letterSpacing: '0.04em',
              margin: 0,
            }}
          >
            Set Your Password
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
            Welcome to INSPEKTiQ. Choose a password to finish setting up your account.
          </p>
        </div>

        {status === 'loading' ? (
          <p style={{ margin: 0, color: 'var(--muted)' }}>Setting up your account...</p>
        ) : null}

        {status === 'error' ? (
          <p style={{ margin: 0, color: 'var(--red)', fontSize: '13px' }}>
            {error ?? 'This invite link has expired. Please ask your firm admin to resend your invitation.'}
          </p>
        ) : null}

        {status === 'ready' || status === 'submitting' ? (
          <>
            <div style={{ display: 'grid', gap: '14px' }}>
              <label style={{ display: 'grid', gap: '5px' }}>
                <span className="nav-label" style={{ color: 'var(--muted)' }}>Email</span>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="form-input"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '9px 12px',
                    color: 'var(--muted)',
                    width: '100%',
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '5px' }}>
                <span className="nav-label" style={{ color: 'var(--muted)' }}>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="form-input"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '9px 12px',
                    color: 'var(--white)',
                    width: '100%',
                  }}
                />
              </label>
              <label style={{ display: 'grid', gap: '5px' }}>
                <span className="nav-label" style={{ color: 'var(--muted)' }}>Confirm Password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="form-input"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '9px 12px',
                    color: 'var(--white)',
                    width: '100%',
                  }}
                />
              </label>
              {error ? (
                <p style={{ margin: 0, color: 'var(--red)', fontSize: '12px' }}>{error}</p>
              ) : null}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button onClick={() => void handleSubmit()} disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Saving...' : 'Set Password & Continue'}
              </Button>
            </div>
          </>
        ) : null}

        {status === 'done' ? (
          <p style={{ margin: 0, color: 'var(--sage)' }}>Redirecting...</p>
        ) : null}
      </Card>
    </main>
  );
}
