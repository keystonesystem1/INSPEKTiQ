const PHOTO_LABELS = [
  { label: 'Overview / Exterior', source: 'Auto-tagged', required: true, min: 4 },
  { label: 'Roof — Field', source: 'Auto-tagged', required: true, min: 8 },
  { label: 'Roof — Ridge & Hips', source: 'Auto-tagged', required: true, min: 2 },
  { label: 'Roof — Vents & Penetrations', source: 'Manual label', required: false, min: 0 },
  { label: 'Gutters & Downspouts', source: 'Manual label', required: false, min: 0 },
  { label: 'Elevation — Front', source: 'Auto-tagged', required: true, min: 1 },
  { label: 'Elevation — Rear', source: 'Auto-tagged', required: true, min: 1 },
  { label: 'Interior — Affected Rooms', source: 'Manual label', required: false, min: 0 },
  { label: 'Damage Close-up', source: 'Manual label', required: false, min: 2 },
];

const headerCell: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
  fontSize: '13px',
};

export function PhotosTab() {
  return (
    <div style={{ maxWidth: '760px' }}>
      {/* Label rules */}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 10px' }}>
        Label Rules
      </div>
      <div style={{ border: '1px solid var(--border)', background: 'var(--card)', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{ ...rowStyle, background: 'var(--surface)' }}>
          <div style={{ width: '32px' }} />
          <div style={{ ...headerCell, flex: 1 }}>Label</div>
          <div style={{ ...headerCell, width: '120px' }}>Source</div>
          <div style={{ ...headerCell, width: '80px' }}>Required</div>
          <div style={{ ...headerCell, width: '70px' }}>Min Count</div>
        </div>
        {PHOTO_LABELS.map((pl) => (
          <div key={pl.label} style={rowStyle}>
            <div style={{ width: '32px', height: '28px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: 'var(--faint)' }}>
              IMG
            </div>
            <div style={{ flex: 1, color: 'var(--white)' }}>{pl.label}</div>
            <div style={{ width: '120px', fontSize: '12px', color: 'var(--muted)' }}>{pl.source}</div>
            <div style={{ width: '80px' }}>
              <span style={{
                display: 'inline-block', width: '28px', height: '16px', borderRadius: '8px',
                background: pl.required ? 'var(--sage)' : 'var(--border)',
              }} />
            </div>
            <div style={{ width: '70px', fontSize: '12px', color: 'var(--muted)', fontFamily: 'monospace' }}>
              {pl.min}
            </div>
          </div>
        ))}
      </div>

      {/* Grouping */}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 10px' }}>
        Grouping Behavior
      </div>
      <div style={{ border: '1px solid var(--border)', background: 'var(--card)', marginBottom: '20px' }}>
        {[
          { label: 'Group photos by section', sub: 'Photos appear under their labeled section in the report', on: true },
          { label: 'Auto-sort by capture timestamp', on: true },
          { label: 'Allow manual reorder before report generation', on: true },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--white)' }}>{item.label}</div>
              {'sub' in item && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{item.sub}</div>}
            </div>
            <span style={{ display: 'inline-block', width: '32px', height: '18px', borderRadius: '9px', background: item.on ? 'var(--sage)' : 'var(--border)' }} />
          </div>
        ))}
      </div>

      {/* Thumbnail display */}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 10px' }}>
        Thumbnail Display
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'Layout', options: ['2-column grid', '3-column grid', '1-column list'], selected: '2-column grid' },
          { label: 'Caption style', options: ['Label + timestamp', 'Label only', 'None'], selected: 'Label + timestamp' },
          { label: 'Max per page', options: ['4', '6', '8', '12'], selected: '6' },
        ].map((field) => (
          <div key={field.label}>
            <span style={{ ...headerCell, display: 'block', marginBottom: '4px' }}>{field.label}</span>
            <select style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--white)', fontSize: '13px', opacity: 0.5 }} disabled>
              {field.options.map((o) => <option key={o} selected={o === field.selected}>{o}</option>)}
            </select>
          </div>
        ))}
      </div>

      {/* Merge behavior */}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 10px' }}>
        Merge Behavior
      </div>
      <div style={{ border: '1px solid var(--border)', background: 'var(--card)' }}>
        {[
          { label: 'Merge supplement photos with original inspection', sub: 'Supplement photos added to original section groups', on: true },
          { label: 'Show side-by-side before/after for supplement', on: false },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--white)' }}>{item.label}</div>
              {'sub' in item && item.sub && <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{item.sub}</div>}
            </div>
            <span style={{ display: 'inline-block', width: '32px', height: '18px', borderRadius: '9px', background: item.on ? 'var(--sage)' : 'var(--border)' }} />
          </div>
        ))}
      </div>

      <div style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '16px', textAlign: 'center' }}>
        Photo configuration controls are display-only. Interactive editing coming in a future phase.
      </div>
    </div>
  );
}
