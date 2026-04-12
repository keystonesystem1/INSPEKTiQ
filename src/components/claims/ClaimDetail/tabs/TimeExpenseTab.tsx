'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Role } from '@/lib/types';

interface TEEntry {
  id: string;
  entry_date: string;
  entry_type: string;
  description: string | null;
  amount: number | null;
  unit: string | null;
  invoiced: boolean;
}

const LABEL_STYLE = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--muted)',
};

const TYPE_LABELS: Record<string, string> = {
  time: 'Time',
  drive_time: 'Drive Time',
  mileage: 'Mileage',
  expense: 'Expense',
};

function fmt(amount: number | null) {
  if (amount == null) return '—';
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function TimeExpenseTab({ claimId, role }: { claimId: string; role: Role }) {
  const [entries, setEntries] = useState<TEEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    entryType: 'time',
    description: '',
    amount: '',
  });

  // Carrier roles cannot see T&E (hidden at tab level too, but guard here)
  const isCarrier = ['carrier', 'carrier_admin', 'carrier_desk_adjuster'].includes(role);

  useEffect(() => {
    if (isCarrier) return;
    void (async () => {
      try {
        const res = await fetch(`/api/claims/${claimId}/te`);
        const json = await res.json() as { entries?: TEEntry[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? 'Failed to load entries');
        setEntries(json.entries ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [claimId, isCarrier]);

  async function handleAdd() {
    if (!form.entryDate || !form.entryType) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claimId}/te`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryDate: form.entryDate,
          entryType: form.entryType,
          description: form.description || null,
          amount: form.amount ? parseFloat(form.amount) : undefined,
        }),
      });
      const json = await res.json() as { entry?: TEEntry; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to save');
      setEntries((prev) => [json.entry!, ...prev]);
      setForm({ entryDate: new Date().toISOString().split('T')[0], entryType: 'time', description: '', amount: '' });
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const total = entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  if (isCarrier) return null;
  if (loading) return <Card><div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div></Card>;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={LABEL_STYLE}>Time &amp; Expense</div>
          {entries.length > 0 ? (
            <div style={{ marginTop: '4px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '18px', color: 'var(--white)' }}>
              {fmt(total)}
            </div>
          ) : null}
        </div>
        {!adding ? (
          <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>+ Add Entry</Button>
        ) : null}
      </div>

      {error ? <div style={{ color: 'var(--orange)', fontSize: '12px', marginBottom: '10px' }}>{error}</div> : null}

      {entries.length === 0 && !adding ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No entries yet.</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 120px 90px', gap: '10px', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            {['Date', 'Description', 'Type', 'Amount'].map((h) => (
              <div key={h} style={LABEL_STYLE}>{h}</div>
            ))}
          </div>
          {entries.map((entry) => (
            <div key={entry.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 120px 90px', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <div style={{ color: 'var(--muted)' }}>{entry.entry_date}</div>
              <div>{entry.description ?? '—'}</div>
              <div style={{ color: 'var(--muted)' }}>{TYPE_LABELS[entry.entry_type] ?? entry.entry_type}</div>
              <div style={{ fontWeight: 600 }}>{fmt(entry.amount)}</div>
            </div>
          ))}
        </>
      )}

      {adding ? (
        <div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>
          <div style={LABEL_STYLE}>New Entry</div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 120px', gap: '10px' }}>
            <input
              type="date"
              value={form.entryDate}
              onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            />
            <input
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            />
            <select
              value={form.entryType}
              onChange={(e) => setForm((f) => ({ ...f, entryType: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            >
              <option value="time">Time</option>
              <option value="drive_time">Drive Time</option>
              <option value="mileage">Mileage</option>
              <option value="expense">Expense</option>
            </select>
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
              {saving ? 'Saving…' : 'Add Entry'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)} disabled={saving}>Cancel</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
