'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface Claimant {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  address: string | null;
}

const LABEL_STYLE = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--muted)',
};

const ROLE_TONE: Record<string, 'blue' | 'sage' | 'faint'> = {
  primary: 'blue',
  secondary: 'sage',
  other: 'faint',
};

export function ClaimantsTab({ claimId }: { claimId: string }) {
  const [claimants, setClaimants] = useState<Claimant[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', role: 'primary', phone: '', email: '', address: '' });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/claims/${claimId}/claimants`);
        const json = await res.json() as { claimants?: Claimant[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? 'Failed to load claimants');
        setClaimants(json.claimants ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [claimId]);

  async function handleAdd() {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claimId}/claimants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json() as { claimant?: Claimant; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');
      setClaimants((prev) => [...prev, json.claimant!]);
      setForm({ name: '', role: 'primary', phone: '', email: '', address: '' });
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card><div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div></Card>;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={LABEL_STYLE}>Claimants</div>
        {!adding ? (
          <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>+ Add Claimant</Button>
        ) : null}
      </div>

      {error ? <div style={{ color: 'var(--orange)', fontSize: '12px', marginBottom: '10px' }}>{error}</div> : null}

      {claimants.length === 0 && !adding ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No claimants added yet.</div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {claimants.map((c) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--white)', marginBottom: '4px' }}>{c.name}</div>
                {c.phone ? <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{c.phone}</div> : null}
                {c.email ? <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{c.email}</div> : null}
                {c.address ? <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>{c.address}</div> : null}
              </div>
              <Badge tone={ROLE_TONE[c.role] ?? 'faint'}>{c.role}</Badge>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>
          <div style={LABEL_STYLE}>New Claimant</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input
              placeholder="Full name *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
              autoFocus
            />
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="other">Other</option>
            </select>
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            />
          </div>
          <input
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="primary" onClick={() => void handleAdd()} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Add Claimant'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)} disabled={saving}>Cancel</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
