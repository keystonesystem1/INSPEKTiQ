import type { CSSProperties, ReactNode } from 'react';
import type { BadgeTone } from '@/lib/types';

const tones: Record<BadgeTone, CSSProperties> = {
  sage: { background: 'var(--sage-dim)', color: 'var(--sage)', border: '1px solid rgba(91,194,115,0.2)' },
  blue: { background: 'var(--blue-dim)', color: 'var(--blue)', border: '1px solid rgba(66,152,204,0.2)' },
  orange: { background: 'var(--orange-dim)', color: 'var(--orange)', border: '1px solid rgba(224,123,63,0.2)' },
  red: { background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(224,92,92,0.2)' },
  bronze: { background: 'var(--bronze-dim)', color: 'var(--bronze)', border: '1px solid rgba(201,168,76,0.2)' },
  faint: { background: 'rgba(255,255,255,0.05)', color: 'var(--muted)', border: '1px solid var(--border)' },
};

export function Badge({
  tone,
  children,
  large = false,
}: {
  tone: BadgeTone;
  children: ReactNode;
  large?: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: large ? '5px 10px' : '3px 7px',
        borderRadius: 'var(--radius-sm)',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700,
        fontSize: large ? '11px' : '9px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}
