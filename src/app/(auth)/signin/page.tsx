'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('avery@keystoneclaims.io');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    const supabase = createClient();
    setSubmitting(true);
    setError('');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

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
            Sign In
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
            Phase 2 shell wired for role-based navigation and protected routes.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          <FormInput label="Email" value={email} onChange={setEmail} />
          <label style={{ display: 'grid', gap: '5px' }}>
            <span className="nav-label" style={{ color: 'var(--muted)' }}>
              Password
            </span>
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
          {error ? (
            <p style={{ margin: 0, color: 'var(--red)', fontSize: '12px' }}>
              {error}
            </p>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', gap: '12px' }}>
          <p style={{ margin: 0, color: 'var(--faint)', maxWidth: '280px' }}>
            Supabase credentials remain untouched. Sign in now uses the live auth session instead of the demo cookie path.
          </p>
          <Button onClick={handleSignIn} disabled={submitting}>
            {submitting ? 'Signing In' : 'Enter Workspace'}
          </Button>
        </div>
      </Card>
    </main>
  );
}
