'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import { ROLE_TABS, type Role } from '@/lib/utils/roles';
import { createRoleSession } from '@/hooks/useUser';

const roleOptions = Object.keys(ROLE_TABS) as Role[];

export default function SignInPage() {
  const router = useRouter();
  const [name, setName] = useState('Avery Stone');
  const [firmName, setFirmName] = useState('Keystone Claims');
  const [email, setEmail] = useState('avery@keystoneclaims.io');
  const [role, setRole] = useState<Role>('firm_admin');

  const handleSignIn = () => {
    createRoleSession({ name, email, firmName, role });
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
          <FormInput label="Name" value={name} onChange={setName} />
          <FormInput label="Email" value={email} onChange={setEmail} />
          <FormInput label="Firm Name" value={firmName} onChange={setFirmName} />
          <label style={{ display: 'grid', gap: '5px' }}>
            <span className="nav-label" style={{ color: 'var(--muted)' }}>
              Role
            </span>
            <select
              className="form-input"
              value={role}
              onChange={(event) => setRole(event.target.value as Role)}
            >
              {roleOptions.map((option) => (
                <option key={option} value={option}>
                  {option.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', gap: '12px' }}>
          <p style={{ margin: 0, color: 'var(--faint)', maxWidth: '280px' }}>
            Supabase credentials remain untouched. This screen also supports local demo sessions for role QA.
          </p>
          <Button onClick={handleSignIn}>Enter Workspace</Button>
        </div>
      </Card>
    </main>
  );
}
