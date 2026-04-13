import { Toggle } from '@/components/ui/Toggle';
import { REPORT_TYPE_LIST } from '@/lib/constants/workflowRegistry';
import type { MatchingRuleShell, WorkflowDraft, ReportType } from '@/lib/types/workflow';

interface MatchingTabProps {
  matching: MatchingRuleShell;
  templates: WorkflowDraft['templates'];
  onChange: (updated: MatchingRuleShell) => void;
  onTemplatesChange: (updated: WorkflowDraft['templates']) => void;
}

const CLAIM_TYPE_OPTIONS = [
  { label: 'Residential', value: 'Residential' },
  { label: 'Commercial', value: 'Commercial' },
  { label: 'Farm/Ranch', value: 'Farm/Ranch' },
  { label: 'Industrial', value: 'Industrial' },
];

const LOSS_TYPE_OPTIONS = [
  { label: 'Wind', value: 'Wind' },
  { label: 'Hail', value: 'Hail' },
  { label: 'Wind / Hail', value: 'Wind/Hail' },
  { label: 'Water', value: 'Water' },
  { label: 'Fire', value: 'Fire' },
  { label: 'Lightning', value: 'Lightning' },
  { label: 'Theft', value: 'Theft' },
  { label: 'Vandalism', value: 'Vandalism' },
];

const PROPERTY_TYPE_OPTIONS = [
  { label: 'Single Family', value: 'Single Family' },
  { label: 'Multi-Family', value: 'Multi-Family' },
  { label: 'Condo', value: 'Condo' },
  { label: 'Townhome', value: 'Townhome' },
  { label: 'Mobile Home', value: 'Mobile Home' },
  { label: 'Commercial', value: 'Commercial' },
];

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

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  color: 'var(--white)',
  fontSize: '13px',
  outline: 'none',
};

export function MatchingTab({ matching, templates, onChange, onTemplatesChange }: MatchingTabProps) {
  function set(field: keyof MatchingRuleShell, value: string) {
    onChange({ ...matching, [field]: value.trim() || null });
  }

  function toggleReportType(key: ReportType) {
    onTemplatesChange({
      ...templates,
      [key]: { ...templates[key], enabled: !templates[key].enabled },
    });
  }

  const matchPills = [
    matching.carrier,
    matching.lossType,
    matching.propertyType,
    matching.claimType ? `${matching.claimType}` : null,
  ].filter(Boolean);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
      {/* Left: form */}
      <div>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '16px', letterSpacing: '0.04em', color: 'var(--white)', marginBottom: '16px' }}>
          Match Criteria
        </div>

        <div style={{ display: 'grid', gap: '14px', marginBottom: '24px' }}>
          <div>
            <span style={LABEL}>Carrier</span>
            <input
              type="text"
              value={matching.carrier ?? ''}
              onChange={(e) => set('carrier', e.target.value)}
              placeholder="Any carrier"
              style={selectStyle}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <span style={LABEL}>Claim Type</span>
              <select value={matching.claimType ?? ''} onChange={(e) => set('claimType', e.target.value)} style={selectStyle}>
                <option value="">Any claim type</option>
                {CLAIM_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <span style={LABEL}>Loss Type</span>
              <select value={matching.lossType ?? ''} onChange={(e) => set('lossType', e.target.value)} style={selectStyle}>
                <option value="">Any loss type</option>
                {LOSS_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <span style={LABEL}>Property Type</span>
              <select value={matching.propertyType ?? ''} onChange={(e) => set('propertyType', e.target.value)} style={selectStyle}>
                <option value="">Any property type</option>
                {PROPERTY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <span style={LABEL}>State Override</span>
              <select style={{ ...selectStyle, opacity: 0.5 }} disabled>
                <option>Any / All States</option>
              </select>
              <div style={{ fontSize: '10px', color: 'var(--faint)', marginTop: '4px' }}>Coming soon</div>
            </div>
          </div>
        </div>

        {/* Report type toggles */}
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
          Supported Report Types
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {REPORT_TYPE_LIST.map((rt) => (
            <div key={rt.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
              <span style={{ fontSize: '13px', color: 'var(--white)' }}>{rt.label}</span>
              <Toggle checked={templates[rt.key].enabled} onToggle={() => toggleReportType(rt.key)} />
            </div>
          ))}
        </div>
      </div>

      {/* Right: match summary */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '16px' }}>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
          Match Summary
        </div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--white)', marginBottom: '10px' }}>
          This workflow will apply to claims matching:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {matchPills.length > 0 ? matchPills.map((pill) => (
            <span key={pill} style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 500, background: 'var(--blue-dim)', color: 'var(--blue)' }}>
              {pill}
            </span>
          )) : (
            <span style={{ fontSize: '12px', color: 'var(--faint)' }}>No criteria set — matches all claims</span>
          )}
        </div>
        <div style={{ height: '1px', background: 'var(--border)', margin: '14px 0' }} />
        <div style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.6' }}>
          {matchPills.length > 0
            ? `When a new claim is received matching ${matchPills.join(', ')}, this workflow will be automatically selected.`
            : 'This workflow will match any incoming claim. Set criteria to narrow the scope.'
          }
        </div>
      </div>
    </div>
  );
}
