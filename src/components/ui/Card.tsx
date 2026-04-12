import type { CSSProperties, ReactNode } from 'react';

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <section
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </section>
  );
}
