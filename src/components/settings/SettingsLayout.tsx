'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';

const INTAKE_EMAIL = process.env.NEXT_PUBLIC_FIRM_INTAKE_EMAIL ?? 'intake+e79f863e@parse.keystonestack.com';

function IntakeEmailRow() {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(INTAKE_EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ color: 'var(--muted)', fontSize: '11px', marginBottom: '2px' }}>Intake Email</div>
        <strong style={{ fontSize: '13px', fontFamily: 'monospace' }}>{INTAKE_EMAIL}</strong>
      </div>
      <button
        onClick={copy}
        style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--card)', border: '1px solid var(--border)', color: copied ? 'var(--sage)' : 'var(--muted)', fontSize: '11px', cursor: 'pointer' }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

const NOTIFICATION_ITEMS = ['New claim assigned', 'SLA alert', 'Report submitted', 'Invoice approved'] as const;

const sections = ['Firm Profile', 'User Profile', 'SLA Configuration', 'Notifications', 'Integrations', 'Activity Log', 'Routing Preferences'] as const;

function getInitialNotifications(firmSettings: Record<string, unknown> | null): Record<string, boolean> {
  const saved = firmSettings?.notifications as Record<string, boolean> | undefined;
  return Object.fromEntries(NOTIFICATION_ITEMS.map((item) => [item, saved?.[item] ?? true]));
}

function getInitialActivityLog(firmSettings: Record<string, unknown> | null): boolean {
  return (firmSettings?.activityLog as boolean | undefined) ?? true;
}

export function SettingsLayout({
  firmName: initialFirmName,
  firmSettings,
}: {
  firmName: string;
  firmSettings: Record<string, unknown> | null;
}) {
  const router = useRouter();
  const [active, setActive] = useState<(typeof sections)[number]>('Firm Profile');
  const [firmName, setFirmName] = useState(initialFirmName);
  const [notifications, setNotifications] = useState<Record<string, boolean>>(() => getInitialNotifications(firmSettings));
  const [activityLog, setActivityLog] = useState(() => getInitialActivityLog(firmSettings));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (active !== 'Firm Profile' && active !== 'Notifications' && active !== 'Activity Log') {
      setToast('No editable fields in this section yet.');
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (active === 'Firm Profile' && !firmName.trim()) {
      setError('Firm name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {};
    if (active === 'Firm Profile') body.firmName = firmName.trim();
    if (active === 'Notifications') body.settings = { notifications };
    if (active === 'Activity Log') body.settings = { activityLog };

    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? 'Save failed');
      }

      setToast('Settings saved.');
      setTimeout(() => setToast(null), 3000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

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
          <div style={{ display: 'grid', gap: '14px' }}>
            <FormInput label="Firm Name" value={firmName} onChange={setFirmName} />
            <IntakeEmailRow />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Portal URL</span>
              <strong>—</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>Brand Color</span>
              <strong>#5BC273</strong>
            </div>
          </div>
        ) : null}
        {active === 'Notifications' ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {NOTIFICATION_ITEMS.map((item) => (
              <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div>{item}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Email + In-app</div>
                </div>
                <Toggle
                  checked={notifications[item] ?? true}
                  onToggle={() => setNotifications((prev) => ({ ...prev, [item]: !prev[item] }))}
                />
              </div>
            ))}
          </div>
        ) : null}
        {active === 'Integrations' ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div>Xactware Intake</div>
              <div style={{ color: 'var(--muted)', fontSize: '11px' }}>Contact support to configure your intake email</div>
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
            <Toggle checked={activityLog} onToggle={() => setActivityLog((prev) => !prev)} />
          </div>
        ) : null}
        {active !== 'Firm Profile' && active !== 'Notifications' && active !== 'Integrations' && active !== 'Activity Log' ? (
          <div style={{ color: 'var(--muted)' }}>This settings section is scaffolded and ready for Supabase-backed form fields.</div>
        ) : null}
        {error ? <div style={{ color: 'var(--red, #e05252)', fontSize: '13px', marginTop: '10px' }}>{error}</div> : null}
        {toast ? <div style={{ color: 'var(--sage)', fontSize: '13px', marginTop: '10px' }}>{toast}</div> : null}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
