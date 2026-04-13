import { Toggle } from '@/components/ui/Toggle';
import type { WorkflowDraft } from '@/lib/types/workflow';

interface OverviewTabProps {
  workflow: WorkflowDraft;
  onUpdate: (updates: Partial<WorkflowDraft>) => void;
}

const LABEL: React.CSSProperties = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: '4px',
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--white)',
  fontSize: '13px',
  outline: 'none',
};

export function OverviewTab({ workflow, onUpdate }: OverviewTabProps) {
  const enabledReportTypes = Object.entries(workflow.templates)
    .filter(([, config]) => config.enabled)
    .map(([key]) => key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
      {/* Left: editable fields */}
      <div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '16px', letterSpacing: '0.04em', color: 'var(--white)', marginBottom: '16px' }}>
          Workflow Details
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          <div>
            <span style={LABEL}>Workflow Name</span>
            <input
              type="text"
              value={workflow.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Untitled Workflow"
              style={inputStyle}
            />
          </div>

          <div>
            <span style={LABEL}>Description</span>
            <textarea
              placeholder="Describe this workflow's purpose and when it should be used..."
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
              disabled
            />
            <div style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '4px' }}>Coming soon</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <span style={LABEL}>Status</span>
              <select style={{ ...inputStyle, opacity: 0.5 }} disabled>
                <option>Active</option>
                <option>Draft</option>
                <option>Archived</option>
              </select>
              <div style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '4px' }}>Coming soon</div>
            </div>
            <div>
              <span style={LABEL}>Priority</span>
              <select style={{ ...inputStyle, opacity: 0.5 }} disabled>
                <option>1 — Highest</option>
                <option>2</option>
                <option>3</option>
                <option>4 — Lowest</option>
              </select>
              <div style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '4px' }}>Coming soon</div>
            </div>
          </div>

          <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--white)' }}>Set as Default Workflow</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Used when no other workflow matches a claim</div>
            </div>
            <Toggle checked={workflow.isDefault} onToggle={() => onUpdate({ isDefault: !workflow.isDefault })} />
          </div>
        </div>
      </div>

      {/* Right: metadata */}
      <div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
          Metadata
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { key: 'Workflow ID', val: workflow.id === 'new' ? '—' : workflow.id.slice(0, 12) },
            { key: 'Schema', val: 'v1.0' },
          ].map((m) => (
            <div key={m.key} style={{ background: 'var(--surface)', padding: '8px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', color: 'var(--muted)', marginBottom: '2px' }}>{m.key}</div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--dim)', fontFamily: 'monospace' }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Linked reports */}
        <div style={{ marginTop: '16px', padding: '14px', background: 'var(--sage-dim)', border: '1px solid rgba(91,194,115,0.15)' }}>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sage)', marginBottom: '8px' }}>
            Linked Report Types
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--sage)' }}>
            {enabledReportTypes.length > 0
              ? enabledReportTypes.map((rt) => <div key={rt}>✓ {rt}</div>)
              : <div style={{ color: 'var(--muted)' }}>No report types enabled</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
