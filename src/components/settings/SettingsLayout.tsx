'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';

const sections = ['Firm Profile', 'User Profile', 'SLA Configuration', 'Notifications', 'Integrations', 'Activity Log', 'Routing Preferences'] as const;

export function SettingsLayout() {
  const [active, setActive] = useState<(typeof sections)[number]>('Firm Profile');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px' }}>
      <Card style={{ padding: '12px' }}>
        {sections.map((section) => (
          <button key={section} onClick={() => setActive(section)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', background: active === section ? 'var(--sage-dim)' : 'transparent', color: active === section ? 'var(--sage)' : 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer' }}>
            {section}
          </button>
        ))}
      </Card>
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '18px', letterSpacing: '0.04em', marginBottom: '14px' }}>{active}</div>
        {active === 'Firm Profile' ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            {['Firm Name', 'Portal URL', 'Brand Color'].map((label) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--muted)' }}>{label}</span>
                <strong>{label === 'Brand Color' ? '#5BC273' : 'Keystone Claims'}</strong>
              </div>
            ))}
          </div>
        ) : null}
        {active === 'Notifications' ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {['New claim assigned', 'SLA alert', 'Report submitted', 'Invoice approved'].map((item) => (
              <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div>{item}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Email + In-app</div>
                </div>
                <Toggle checked />
              </div>
            ))}
          </div>
        ) : null}
        {active === 'Integrations' ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>Xactware Intake</div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>keystone-claims@intake.inspektiq.io · Active · Last sync 8m ago</div>
            </div>
            <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>Symbility</div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Coming Soon</div>
            </div>
          </div>
        ) : null}
        {active === 'Activity Log' ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div>Auto-log all user actions to claim notes</div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Assignments, status changes, and uploads become system notes.</div>
            </div>
            <Toggle checked />
          </div>
        ) : null}
        {active !== 'Firm Profile' && active !== 'Notifications' && active !== 'Integrations' && active !== 'Activity Log' ? (
          <div style={{ color: 'var(--muted)' }}>This settings section is scaffolded and ready for Supabase-backed form fields.</div>
        ) : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button>Save Changes</Button>
        </div>
      </Card>
    </div>
  );
}
