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
        padding: '16px 18px',
        background:
          'linear-gradient(180deg, rgba(22,33,48,0.98), rgba(22,33,48,0.78))',
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
          fontSize: '10px',
          letterSpacing: '0.12em',
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
