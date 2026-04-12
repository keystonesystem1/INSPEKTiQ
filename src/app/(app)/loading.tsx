export default function Loading() {
  return (
    <div style={{ display: 'grid', gap: '12px', padding: '32px 40px' }}>
      <div style={{ height: '28px', width: '220px', background: 'var(--surface)', animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ height: '120px', background: 'var(--surface)', animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ height: '200px', background: 'var(--surface)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.1s' }} />
      <div style={{ height: '160px', background: 'var(--surface)', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: '0.2s' }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
