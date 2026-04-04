'use client';

export function Toggle({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={checked}
      style={{
        width: '32px',
        height: '18px',
        borderRadius: '9px',
        border: `1px solid ${checked ? 'var(--sage)' : 'var(--border)'}`,
        background: checked ? 'var(--sage)' : 'var(--bg)',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '16px' : '2px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: checked ? '#fff' : 'var(--muted)',
        }}
      />
    </button>
  );
}
