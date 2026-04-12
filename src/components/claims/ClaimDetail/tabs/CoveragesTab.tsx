'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Role } from '@/lib/types';

interface Coverage {
  id: string;
  coverage_type: string;
  limit_amount: number | null;
  deductible: number | null;
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

function fmt(val: number | null) {
  if (val == null) return '—';
  return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function CoveragesTab({ claimId, role }: { claimId: string; role: Role }) {
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ coverageType: '', limitAmount: '', deductible: '' });

  const isReadOnly = CARRIER_ROLES.has(role);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/claims/${claimId}/coverages`);
        const json = await res.json() as { coverages?: Coverage[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? 'Failed to load coverages');
        setCoverages(json.coverages ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [claimId]);

  async function handleAdd() {
    if (!form.coverageType.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claimId}/coverages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverageType: form.coverageType.trim(),
          limitAmount: form.limitAmount ? parseFloat(form.limitAmount) : undefined,
          deductible: form.deductible ? parseFloat(form.deductible) : undefined,
        }),
      });
      const json = await res.json() as { coverage?: Coverage; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');
      setCoverages((prev) => [...prev, json.coverage!]);
      setForm({ coverageType: '', limitAmount: '', deductible: '' });
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
        <div style={LABEL_STYLE}>Coverages</div>
        {!isReadOnly && !adding ? (
          <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>+ Add Coverage</Button>
        ) : null}
      </div>

      {error ? <div style={{ color: 'var(--orange)', fontSize: '12px', marginBottom: '10px' }}>{error}</div> : null}

      {coverages.length === 0 && !adding ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No coverages recorded yet.</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            {['Coverage Type', 'Limit', 'Deductible'].map((h) => (
              <div key={h} style={LABEL_STYLE}>{h}</div>
            ))}
          </div>
          {coverages.map((c) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <div style={{ fontWeight: 500 }}>{c.coverage_type}</div>
              <div style={{ color: 'var(--muted)' }}>{fmt(c.limit_amount)}</div>
              <div style={{ color: 'var(--muted)' }}>{fmt(c.deductible)}</div>
            </div>
          ))}
        </>
      )}

      {adding ? (
        <div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>
          <div style={LABEL_STYLE}>New Coverage</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', gap: '10px' }}>
            <input
              placeholder="Coverage type *"
              value={form.coverageType}
              onChange={(e) => setForm((f) => ({ ...f, coverageType: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
              autoFocus
            />
            <input
              placeholder="Limit amount"
              type="number"
              value={form.limitAmount}
              onChange={(e) => setForm((f) => ({ ...f, limitAmount: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            />
            <input
              placeholder="Deductible"
              type="number"
              value={form.deductible}
              onChange={(e) => setForm((f) => ({ ...f, deductible: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="primary" onClick={() => void handleAdd()} disabled={saving || !form.coverageType.trim()}>
              {saving ? 'Saving…' : 'Add Coverage'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)} disabled={saving}>Cancel</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
