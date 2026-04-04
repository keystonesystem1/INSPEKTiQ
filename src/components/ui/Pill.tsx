import { Badge } from '@/components/ui/Badge';

export function Pill({
  label,
  active,
  onClick,
  dot,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  dot?: { tone: 'red' | 'orange'; value: number };
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700,
        fontSize: '11px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '6px 12px',
        borderRadius: 'var(--radius-md)',
        border: active ? '1px solid rgba(91, 194, 115, 0.30)' : '1px solid var(--border)',
        color: active ? 'var(--sage)' : 'var(--muted)',
        background: active ? 'var(--sage-dim)' : 'transparent',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        cursor: 'pointer',
      }}
    >
      {label}
      {dot ? (
        <span
          style={{
            display: 'inline-flex',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            alignItems: 'center',
            justifyContent: 'center',
            background: dot.tone === 'red' ? 'var(--red)' : 'var(--orange)',
            color: '#fff',
            fontSize: '9px',
            fontWeight: 800,
          }}
        >
          {dot.value}
        </span>
      ) : null}
    </button>
  );
}
