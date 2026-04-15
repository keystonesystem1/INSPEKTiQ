import { Card } from '@/components/ui/Card';

export function StatCard({
  label,
  value,
  accent,
  trend,
}: {
  label: string;
  value: string;
  accent: string;
  trend?: string;
}) {
  return (
    <Card
      style={{
        padding: '20px',
        background: 'var(--card)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: '3px',
          background: accent,
          borderRadius: 'var(--radius-xl) 0 0 var(--radius-xl)',
        }}
      />
      <div
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: '11px',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: '8px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 900,
          fontSize: '32px',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {trend ? <div style={{ marginTop: '6px', color: 'var(--muted)', fontSize: '11px' }}>{trend}</div> : null}
    </Card>
  );
}
