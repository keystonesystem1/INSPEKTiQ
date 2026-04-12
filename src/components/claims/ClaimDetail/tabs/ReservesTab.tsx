'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Role } from '@/lib/types';

interface Reserve {
  id: string;
  location: string | null;
  description: string | null;
  coverage_type: string | null;
  amount: number | null;
  created_at: string | null;
}

const LABEL_STYLE = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--muted)',
};

const CARRIER_ROLES = new Set<Role>(['carrier', 'carrier_admin', 'carrier_desk_adjuster']);

export function ReservesTab({ claimId, role }: { claimId: string; role: Role }) {
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ location: '', description: '', coverageType: '', amount: '' });

  const isReadOnly = CARRIER_ROLES.has(role);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/claims/${claimId}/reserves`);
        const json = await res.json() as { reserves?: Reserve[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? 'Failed to load reserves');
        setReserves(json.reserves ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reserves');
      } finally {
        setLoading(false);
      }
    })();
  }, [claimId]);

  const total = reserves.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  async function handleAdd() {
    if (!form.description && !form.coverageType) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claimId}/reserves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: form.location || null,
          description: form.description || null,
          coverageType: form.coverageType || null,
          amount: form.amount ? parseFloat(form.amount) : null,
        }),
      });
      const json = await res.json() as { reserve?: Reserve; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to save reserve');
      setReserves((prev) => [...prev, json.reserve!]);
      setForm({ location: '', description: '', coverageType: '', amount: '' });
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
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={LABEL_STYLE}>Total Reserves</div>
          <div style={{ marginTop: '6px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: '28px' }}>
            ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        {!isReadOnly && !adding ? (
          <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>+ Add Reserve</Button>
        ) : null}
      </div>

      {error ? <div style={{ color: 'var(--orange)', fontSize: '12px', marginBottom: '10px' }}>{error}</div> : null}

      {reserves.length === 0 && !adding ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No reserves recorded yet.</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 110px', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            {['Location', 'Description', 'Coverage', 'Amount'].map((h) => (
              <div key={h} style={LABEL_STYLE}>{h}</div>
            ))}
          </div>
          {reserves.map((r) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 160px 110px', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <div style={{ color: 'var(--muted)' }}>{r.location ?? '—'}</div>
              <div>{r.description ?? '—'}</div>
              <div style={{ color: 'var(--muted)' }}>{r.coverage_type ?? '—'}</div>
              <div style={{ fontWeight: 600 }}>
                {r.amount != null ? `$${r.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
              </div>
            </div>
          ))}
        </>
      )}

      {adding ? (
        <div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>
          <div style={LABEL_STYLE}>New Reserve</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            <input
              placeholder="Location (e.g. Loc 1)"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            />
            <input
              placeholder="Coverage type"
              value={form.coverageType}
              onChange={(e) => setForm((f) => ({ ...f, coverageType: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            />
            <input
              placeholder="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="primary" onClick={() => void handleAdd()} disabled={saving}>
              {saving ? 'Saving…' : 'Save Reserve'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)} disabled={saving}>Cancel</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
