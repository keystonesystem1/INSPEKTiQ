export function Avatar({
  initials,
  tone = 'sage',
}: {
  initials: string;
  tone?: 'sage' | 'blue';
}) {
  const color = tone === 'sage' ? 'var(--sage)' : 'var(--blue)';
  const background = tone === 'sage' ? 'var(--sage-dim)' : 'var(--blue-dim)';

  return (
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 800,
        fontSize: '11px',
        background,
        color,
        border: `1.5px solid ${color}`,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}
