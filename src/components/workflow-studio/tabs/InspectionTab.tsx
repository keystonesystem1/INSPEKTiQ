const SECTIONS = [
  { name: 'Site Overview', req: 'required', gate: true },
  { name: 'Roof — Coverage A', req: 'required', gate: true },
  { name: 'Elevations / Exterior', req: 'required', gate: true },
  { name: 'Interior Rooms', req: 'optional', gate: false },
  { name: 'Detached Structures', req: 'optional', gate: false },
  { name: 'Fence & Site', req: 'optional', gate: false },
  { name: 'Pool / Outdoor', req: 'hidden', gate: false },
];

const FIELDS = [
  { name: 'Date of Inspection', field: 'inspection_date', req: 'required' },
  { name: 'Inspector Signature', field: 'inspector_sig', req: 'required' },
  { name: 'Deductible Acknowledgment', field: 'deductible_ack', req: 'optional' },
  { name: 'Carrier Contact Info', field: 'carrier_contact', req: 'hidden' },
];

const segStyle = (active: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  fontSize: '11px',
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  background: active ? 'var(--white)' : 'var(--surface)',
  color: active ? 'var(--bg)' : 'var(--muted)',
  border: 'none',
  cursor: 'default',
});

const headerCell: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  padding: '10px 14px',
  background: 'var(--surface)',
  borderBottom: '1px solid var(--border)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 14px',
  borderBottom: '1px solid var(--border)',
  gap: '10px',
  fontSize: '13px',
};

export function InspectionTab() {
  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px' }}>
        Configure what inspectors are required to complete before this workflow can generate a report. Controls are display-only in this phase.
      </div>

      {/* Required sections */}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '20px 0 10px' }}>
        Required Sections
      </div>
      <div style={{ border: '1px solid var(--border)', background: 'var(--card)', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ ...rowStyle, background: 'var(--surface)' }}>
          <div style={{ ...headerCell, flex: 1, padding: 0, background: 'transparent', borderBottom: 'none' }}>Section</div>
          <div style={{ ...headerCell, width: '200px', padding: 0, background: 'transparent', borderBottom: 'none' }}>Requirement</div>
          <div style={{ ...headerCell, width: '100px', padding: 0, background: 'transparent', borderBottom: 'none', textAlign: 'center' }}>Gate</div>
        </div>
        {SECTIONS.map((sec) => (
          <div key={sec.name} style={rowStyle}>
            <div style={{ flex: 1, color: 'var(--white)' }}>{sec.name}</div>
            <div style={{ width: '200px', display: 'flex', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {['required', 'optional', 'hidden'].map((r) => (
                <span key={r} style={segStyle(sec.req === r)}>{r}</span>
              ))}
            </div>
            <div style={{ width: '100px', textAlign: 'center' }}>
              <span style={{
                display: 'inline-block',
                width: '28px', height: '16px', borderRadius: '8px',
                background: sec.gate ? 'var(--sage)' : 'var(--border)',
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Required fields */}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '20px 0 10px' }}>
        Required Fields
      </div>
      <div style={{ border: '1px solid var(--border)', background: 'var(--card)', overflow: 'hidden', marginBottom: '16px' }}>
        {FIELDS.map((f) => (
          <div key={f.field} style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'var(--white)' }}>{f.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--faint)' }}>Field: {f.field}</div>
            </div>
            <div style={{ width: '200px', display: 'flex', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {['required', 'optional', 'hidden'].map((r) => (
                <span key={r} style={segStyle(f.req === r)}>{r}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Completion gates */}
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', margin: '20px 0 10px' }}>
        Completion Gates
      </div>
      <div style={{ border: '1px solid var(--border)', background: 'var(--card)', display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {[
          { label: 'Block report generation until all required sections complete', sub: 'Inspector cannot submit until 100% required sections are done', on: true },
          { label: 'Require minimum photo count before submission', sub: 'Configurable per section in Photos tab', on: true },
          { label: 'Require LiDAR floor plan for residential claims', sub: 'Uses INSPEKTiT RoomPlan capture', on: false },
        ].map((gate) => (
          <div key={gate.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--white)' }}>{gate.label}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{gate.sub}</div>
            </div>
            <span style={{
              display: 'inline-block',
              width: '32px', height: '18px', borderRadius: '9px',
              background: gate.on ? 'var(--sage)' : 'var(--border)',
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}
