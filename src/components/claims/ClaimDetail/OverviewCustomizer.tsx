'use client';

import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';

const cards = [
  'Claim Status + SLA',
  'Key Contacts',
  'Reserves Total',
  'Recent Documents',
  'Open Tasks',
  'Time & Expense Summary',
  'Recent Note',
  'Inspection Status',
];

export function OverviewCustomizer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: '0 0 0 auto', width: '320px', background: 'rgba(10,10,10,0.8)', padding: '24px', zIndex: 120 }}>
      <Card style={{ height: '100%', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '18px', letterSpacing: '0.04em' }}>Overview Cards</div>
          <button onClick={onClose} style={{ color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
        </div>
        {cards.map((card, index) => (
          <div key={card} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: 500 }}>{card}</div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{index < 4 ? 'Default on' : 'Optional'}</div>
            </div>
            <Toggle checked={index < 4} />
          </div>
        ))}
      </Card>
    </div>
  );
}
