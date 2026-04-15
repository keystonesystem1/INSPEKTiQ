'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';
import { useTheme } from '@/components/providers/ThemeProvider';
import type { DEFAULT_SLA } from '@/lib/utils/sla';

type SlaSettings = typeof DEFAULT_SLA;

// ── helpers ──────────────────────────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: '4px',
  display: 'block',
};

const ROW: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid var(--border)',
};

const NOTIFICATION_ITEMS = [
  { id: 'new_claim_assigned', label: 'New claim assigned', hint: 'Sent to the assigned adjuster' },
  { id: 'sla_alert', label: 'SLA alert', hint: 'Sent to firm admin and dispatcher when a claim goes at-risk' },
  { id: 'report_submitted', label: 'Report submitted', hint: 'Sent to examiner when adjuster submits' },
  { id: 'invoice_approved', label: 'Invoice approved', hint: 'Sent to adjuster when billing is approved' },
] as const;

const DEFAULT_SLA_VALUES: SlaSettings = {
  received_to_assigned: 24,
  assigned_to_contacted: 48,
  contacted_to_inspection: 120,
  inspection_to_report: 120,
  report_to_approval: 72,
};

const SLA_FIELDS: { key: keyof SlaSettings; label: string; hint: string }[] = [
  { key: 'received_to_assigned',   label: 'Received → Assigned',     hint: 'Hours from claim receipt to adjuster assignment' },
  { key: 'assigned_to_contacted',  label: 'Assigned → Contacted',    hint: 'Hours from assignment to insured first contact' },
  { key: 'contacted_to_inspection',label: 'Contacted → Inspection',  hint: 'Hours from first contact to scheduled inspection' },
  { key: 'inspection_to_report',   label: 'Inspection → Report',     hint: 'Hours from inspection to submitted report' },
  { key: 'report_to_approval',     label: 'Report → Approval',       hint: 'Hours from report submission to examiner approval' },
];

const sections = ['Firm Profile', 'User Profile', 'Appearance', 'SLA Configuration', 'Notifications', 'Activity Log', 'Integrations'] as const;
type Section = (typeof sections)[number];

// ── sub-components ────────────────────────────────────────────────────────────

function SaveRow({ saving, saved, error, onSave, disabled = false }: {
  saving: boolean; saved: boolean; error: string | null; onSave: () => void; disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '20px' }}>
      {saved ? <span style={{ fontSize: '12px', color: 'var(--sage)' }}>Saved</span> : null}
      {error ? <span style={{ fontSize: '12px', color: 'var(--orange)' }}>{error}</span> : null}
      <Button onClick={onSave} disabled={saving || disabled}>
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function SettingsLayout({
  firmName: initialFirmName,
  firmSettings,
  primaryColor: initialColor,
  slaSettings,
  userFullName: initialFullName,
  userEmail,
  firmUserId: _firmUserId,
  intakeToken,
}: {
  firmName: string;
  firmSettings: Record<string, unknown> | null;
  primaryColor: string;
  slaSettings: SlaSettings | null;
  userFullName: string;
  userEmail: string;
  firmUserId: string;
  intakeToken?: string;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [active, setActive] = useState<Section>('Firm Profile');
  const intakeEmail = intakeToken ? `intake+${intakeToken}@parse.keystonestack.com` : null;

  // ── Firm Profile state ───────────────────────────────────────────────────
  const [firmName, setFirmName] = useState(initialFirmName);
  const [primaryColor, setPrimaryColor] = useState(initialColor);
  const [firmSaving, setFirmSaving] = useState(false);
  const [firmSaved, setFirmSaved] = useState(false);
  const [firmError, setFirmError] = useState<string | null>(null);

  // ── User Profile state ───────────────────────────────────────────────────
  const [fullName, setFullName] = useState(initialFullName);
  const [userSaving, setUserSaving] = useState(false);
  const [userSaved, setUserSaved] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // ── SLA state ────────────────────────────────────────────────────────────
  const [sla, setSla] = useState<SlaSettings>(slaSettings ?? DEFAULT_SLA_VALUES);
  const [slaSaving, setSlaSaving] = useState(false);
  const [slaSaved, setSlaSaved] = useState(false);
  const [slaError, setSlaError] = useState<string | null>(null);

  // ── Notifications state ──────────────────────────────────────────────────
  const savedNotifs = firmSettings?.notifications as Record<string, boolean> | undefined;
  const [notifications, setNotifications] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_ITEMS.map((n) => [n.id, savedNotifs?.[n.id] ?? true])),
  );
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  // ── Activity Log state ───────────────────────────────────────────────────
  const [activityLog, setActivityLog] = useState<boolean>(
    (firmSettings?.activityLog as boolean | undefined) ?? true,
  );
  const [activitySaving, setActivitySaving] = useState(false);
  const [activitySaved, setActivitySaved] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  // ── Copied state ─────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  // ── save helpers ─────────────────────────────────────────────────────────

  async function patchSettings(body: Record<string, unknown>) {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? 'Save failed');
    }
  }

  async function saveFirmProfile() {
    if (!firmName.trim()) { setFirmError('Firm name is required'); return; }
    setFirmSaving(true); setFirmError(null);
    try {
      await patchSettings({ firmName: firmName.trim(), primaryColor });
      setFirmSaved(true); setTimeout(() => setFirmSaved(false), 3000);
      router.refresh();
    } catch (err) {
      setFirmError(err instanceof Error ? err.message : 'Save failed');
    } finally { setFirmSaving(false); }
  }

  async function saveUserProfile() {
    if (!fullName.trim()) { setUserError('Name is required'); return; }
    setUserSaving(true); setUserError(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Save failed');
      }
      setUserSaved(true); setTimeout(() => setUserSaved(false), 3000);
      router.refresh();
    } catch (err) {
      setUserError(err instanceof Error ? err.message : 'Save failed');
    } finally { setUserSaving(false); }
  }

  async function saveSla() {
    setSlaSaving(true); setSlaError(null);
    try {
      await patchSettings({ settings: { sla } });
      setSlaSaved(true); setTimeout(() => setSlaSaved(false), 3000);
    } catch (err) {
      setSlaError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSlaSaving(false); }
  }

  async function saveNotifications() {
    setNotifSaving(true); setNotifError(null);
    try {
      await patchSettings({ settings: { notifications } });
      setNotifSaved(true); setTimeout(() => setNotifSaved(false), 3000);
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : 'Save failed');
    } finally { setNotifSaving(false); }
  }

  async function saveActivityLog() {
    setActivitySaving(true); setActivityError(null);
    try {
      await patchSettings({ settings: { activityLog } });
      setActivitySaved(true); setTimeout(() => setActivitySaved(false), 3000);
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : 'Save failed');
    } finally { setActivitySaving(false); }
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '16px' }}>
      {/* Sidebar nav */}
      <Card style={{ padding: '12px', alignSelf: 'start' }}>
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => setActive(section)}
            style={{
              width: '100%', textAlign: 'left', padding: '10px 12px',
              borderRadius: '8px',
              background: active === section ? 'rgba(91,194,115,0.12)' : 'transparent',
              color: active === section ? 'var(--sage)' : 'var(--muted)',
              fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
              fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            {section}
          </button>
        ))}
      </Card>

      {/* Content panel */}
      <Card>
        <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '18px', letterSpacing: '0.04em', marginBottom: '20px' }}>
          {active}
        </div>

        {/* ── Firm Profile ── */}
        {active === 'Firm Profile' ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            <FormInput label="Firm Name" value={firmName} onChange={setFirmName} />

            {/* Color picker */}
            <div>
              <span style={LABEL}>Brand Color</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: '40px', height: '32px', padding: '2px', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--card)', cursor: 'pointer' }}
                />
                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--muted)' }}>{primaryColor}</span>
                <button
                  type="button"
                  onClick={() => setPrimaryColor('#4298CC')}
                  style={{ fontSize: '11px', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Intake email (read-only) */}
            <div style={ROW}>
              <div>
                <span style={LABEL}>Intake Email</span>
                <strong style={{ fontSize: '13px', fontFamily: 'monospace' }}>{intakeEmail ?? 'Not configured'}</strong>
              </div>
              {intakeEmail ? (
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(intakeEmail).then(() => {
                      setCopied(true); setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  style={{ padding: '4px 10px', borderRadius: '6px', background: 'var(--card)', border: '1px solid var(--border)', color: copied ? 'var(--sage)' : 'var(--muted)', fontSize: '11px', cursor: 'pointer' }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              ) : null}
            </div>

            <SaveRow saving={firmSaving} saved={firmSaved} error={firmError} onSave={() => void saveFirmProfile()} />
          </div>
        ) : null}

        {/* ── User Profile ── */}
        {active === 'User Profile' ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            <FormInput label="Display Name" value={fullName} onChange={setFullName} />
            <div style={ROW}>
              <div>
                <span style={LABEL}>Email</span>
                <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{userEmail}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Managed by authentication</span>
            </div>
            <SaveRow saving={userSaving} saved={userSaved} error={userError} onSave={() => void saveUserProfile()} />
          </div>
        ) : null}

        {/* ── Appearance ── */}
        {active === 'Appearance' ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 6px' }}>
              Choose your preferred color scheme.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['light', 'dark', 'system'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTheme(option)}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    borderRadius: '8px',
                    border: theme === option ? '2px solid var(--sage)' : '1px solid var(--border)',
                    background: theme === option ? 'var(--sage-dim)' : 'var(--card)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '28px',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      background:
                        option === 'light' ? '#f5f4f1' : option === 'dark' ? '#0a0a0a' : 'linear-gradient(135deg, #f5f4f1 50%, #0a0a0a 50%)',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: theme === option ? 'var(--sage)' : 'var(--muted)',
                    }}
                  >
                    {option}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── SLA Configuration ── */}
        {active === 'SLA Configuration' ? (
          <div style={{ display: 'grid', gap: '6px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 14px' }}>
              Configure the time windows for each stage of the claims workflow. Values are in hours.
            </p>
            {SLA_FIELDS.map(({ key, label, hint }) => (
              <div key={key} style={ROW}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{label}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{hint}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={sla[key]}
                    onChange={(e) => setSla((prev) => ({ ...prev, [key]: parseInt(e.target.value, 10) || 1 }))}
                    style={{
                      width: '72px', textAlign: 'right',
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: '6px', padding: '6px 8px',
                      color: 'var(--white)', fontSize: '13px',
                    }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--muted)', minWidth: '28px' }}>hrs</span>
                </div>
              </div>
            ))}
            <SaveRow saving={slaSaving} saved={slaSaved} error={slaError} onSave={() => void saveSla()} />
          </div>
        ) : null}

        {/* ── Notifications ── */}
        {active === 'Notifications' ? (
          <div style={{ display: 'grid', gap: '6px' }}>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: '0 0 14px' }}>
              Control which events trigger email notifications. All notifications are sent to the relevant role.
            </p>
            {NOTIFICATION_ITEMS.map((item) => (
              <div key={item.id} style={ROW}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px' }}>{item.hint}</div>
                </div>
                <Toggle
                  checked={notifications[item.id] ?? true}
                  onToggle={() => setNotifications((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                />
              </div>
            ))}
            <SaveRow saving={notifSaving} saved={notifSaved} error={notifError} onSave={() => void saveNotifications()} />
          </div>
        ) : null}

        {/* ── Activity Log ── */}
        {active === 'Activity Log' ? (
          <div>
            <div style={ROW}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>Auto-log all user actions to claim notes</div>
                <div style={{ color: 'var(--muted)', fontSize: '11px' }}>
                  Assignments, status changes, and uploads become system notes on the claim.
                </div>
              </div>
              <Toggle checked={activityLog} onToggle={() => setActivityLog((prev) => !prev)} />
            </div>
            <SaveRow saving={activitySaving} saved={activitySaved} error={activityError} onSave={() => void saveActivityLog()} />
          </div>
        ) : null}

        {/* ── Integrations ── */}
        {active === 'Integrations' ? (
          <div style={{ display: 'grid', gap: '6px' }}>
            {[
              { name: 'Xactware Email Intake', status: 'Active', detail: intakeEmail },
              { name: 'Symbility', status: 'Coming Soon', detail: null },
              { name: 'EagleView', status: 'Coming Soon', detail: null },
              { name: 'CoreLogic', status: 'Coming Soon', detail: null },
            ].map((integration) => (
              <div key={integration.name} style={ROW}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{integration.name}</div>
                  {integration.detail ? (
                    <div style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'monospace' }}>{integration.detail}</div>
                  ) : null}
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: integration.status === 'Active' ? 'var(--sage)' : 'var(--muted)',
                  fontFamily: 'Barlow Condensed, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  {integration.status}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
