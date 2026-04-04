import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}) {
  return (
    <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
      <div>
        <h1
          style={{
            margin: 0,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800,
            fontSize: '22px',
            letterSpacing: '0.04em',
          }}
        >
          {title}
        </h1>
        <p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>{subtitle}</p>
      </div>
      {actions ? <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>{actions}</div> : null}
    </header>
  );
}
