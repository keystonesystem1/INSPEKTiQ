'use client';

import { Button } from '@/components/ui/Button';

export function LassoFilters({
  open,
  maxClaims,
  setMaxClaims,
  onApply,
  onCancel,
}: {
  open: boolean;
  maxClaims: number;
  setMaxClaims: (value: number) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  const sections = [
    ['Loss Type', ['Wind', 'Hail', 'Wind+Hail', 'Fire', 'Flood', 'Liability']],
    ['Claim Category', ['Residential', 'Commercial', 'Farm/Ranch', 'Industrial']],
    ['Certifications Required', ['TWIA', 'Flood Cert', 'Commercial Lic']],
    ['Carrier', ['Lone Star Mutual', 'Summit Commercial', 'AgriSure']],
  ] as const;

  return (
    <div style={{ position: 'absolute', top: '14px', left: '160px', zIndex: 200, width: '300px', background: 'var(--card)', border: '1px solid var(--border-hi)', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lasso Pre-Filters</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Apply filters before polygon selection.</div>
      </div>
      {sections.map(([label, chips]) => (
        <div key={label} style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '7px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {chips.map((chip, index) => (
              <button key={chip} style={{ padding: '4px 9px', borderRadius: '4px', border: '1px solid var(--border)', background: index === 0 ? 'var(--sage-dim)' : 'transparent', color: index === 0 ? 'var(--sage)' : 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{chip}</button>
            ))}
          </div>
        </div>
      ))}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ marginBottom: '7px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Max Claims</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input type="range" min={1} max={30} value={maxClaims} onChange={(event) => setMaxClaims(Number(event.target.value))} style={{ flex: 1, accentColor: 'var(--sage)' }} />
          <strong style={{ minWidth: '28px', color: 'var(--sage)' }}>{maxClaims}</strong>
        </div>
      </div>
      <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={onApply}>Apply Filters</Button>
      </div>
    </div>
  );
}
