import { demoAppointments } from '@/lib/utils/demo-data';

export function RouteMap({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <aside style={{ width: open ? '320px' : 0, minWidth: open ? '320px' : 0, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', background: 'var(--surface)', borderLeft: open ? '1px solid var(--border)' : 'none', transition: 'width 0.25s ease, opacity 0.25s ease', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Route Map</div>
        <button onClick={onClose} style={{ color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ margin: '10px 14px 0', padding: '10px 12px', borderRadius: '6px', background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '6px' }}>Route Estimate</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span>Total Drive Time</span><strong>3h 12m</strong></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span>Total Miles</span><strong>128 mi</strong></div>
      </div>
      <div style={{ flex: 1, position: 'relative', background: 'var(--card)', margin: '10px 14px 14px', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'linear-gradient(transparent 49%, rgba(255,255,255,0.08) 50%, transparent 51%), linear-gradient(90deg, transparent 49%, rgba(255,255,255,0.08) 50%, transparent 51%)', backgroundSize: '100% 84px, 84px 100%' }} />
        {demoAppointments.map((appointment, index) => (
          <div key={appointment.id} style={{ position: 'absolute', left: `${24 + index * 26}%`, top: `${26 + index * 20}%`, width: '24px', height: '24px', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: index === 0 ? 'var(--sage)' : 'var(--orange)', border: '2px solid rgba(255,255,255,0.3)', display: 'grid', placeItems: 'center' }}>
            <span style={{ transform: 'rotate(45deg)', fontSize: '9px', fontWeight: 800 }}>•</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
