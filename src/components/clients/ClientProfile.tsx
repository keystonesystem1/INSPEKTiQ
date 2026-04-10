'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AddressField } from '@/components/ui/AddressField';
import type { CarrierRow } from '@/lib/types';

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
      {children}
    </span>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'grid', gap: '5px' }}>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%' }}
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label style={{ display: 'grid', gap: '5px' }}>
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
      />
    </label>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--white)', marginBottom: '12px' }}>
      {children}
    </div>
  );
}

export function ClientProfile({ carrier }: { carrier: CarrierRow }) {
  const router = useRouter();

  const [name, setName] = useState(carrier.name);
  const [contactName, setContactName] = useState(carrier.contactName ?? '');
  const [contactEmail, setContactEmail] = useState(carrier.contactEmail ?? '');
  const [phone, setPhone] = useState(carrier.phone ?? '');
  const [address, setAddress] = useState(carrier.address ?? '');
  const [city, setCity] = useState(carrier.city ?? '');
  const [state, setState] = useState(carrier.state ?? '');
  const [zip, setZip] = useState(carrier.zip ?? '');
  const [isActive, setIsActive] = useState(carrier.isActive);
  const [notes, setNotes] = useState(carrier.notes ?? '');

  const [billingPreference, setBillingPreference] = useState<'desk_adjuster' | 'billing_contact'>(carrier.billingPreference);
  const [billingContactName, setBillingContactName] = useState(carrier.billingContactName ?? '');
  const [billingContactEmail, setBillingContactEmail] = useState(carrier.billingContactEmail ?? '');
  const [billingAddress, setBillingAddress] = useState(carrier.billingAddress ?? '');
  const [billingCity, setBillingCity] = useState(carrier.billingCity ?? '');
  const [billingState, setBillingState] = useState(carrier.billingState ?? '');
  const [billingZip, setBillingZip] = useState(carrier.billingZip ?? '');

  const [portalEnabled, setPortalEnabled] = useState(carrier.portalEnabled);
  const [guidelinesUrl, setGuidelinesUrl] = useState(carrier.guidelinesUrl ?? '');
  const [guidelinesNotes, setGuidelinesNotes] = useState(carrier.guidelinesNotes ?? '');

  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function handleSave() {
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (!name.trim()) {
      setError('Carrier name is required.');
      return;
    }
    if (!contactEmail.trim()) {
      setError('Contact email is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/carriers/${carrier.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          zip: zip.trim(),
          notes: notes.trim(),
          isActive,
          billingPreference,
          billingContactName: billingContactName.trim(),
          billingContactEmail: billingContactEmail.trim(),
          billingAddress: billingAddress.trim(),
          billingCity: billingCity.trim(),
          billingState: billingState.trim(),
          billingZip: billingZip.trim(),
          portalEnabled,
          guidelinesUrl: guidelinesUrl.trim(),
          guidelinesNotes: guidelinesNotes.trim(),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Unable to save changes.');
      }
      setToast('Changes saved.');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite(resendUserId?: string) {
    setInviting(true);
    setError(null);
    try {
      const response = await fetch(`/api/carriers/${carrier.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resendUserId ? { resendUserId } : {}),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Unable to send invite.');
      }
      setToast(resendUserId ? 'Invitation resent.' : 'Invitation sent.');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to send invite.');
    } finally {
      setInviting(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(0, 2fr)', gap: '20px' }}>
      {/* Left column — Identity */}
      <Card>
        <SectionHeader>Identity</SectionHeader>
        <div style={{ display: 'grid', gap: '12px' }}>
          <TextField label="Carrier Name" value={name} onChange={setName} />
          <TextField label="Contact Name" value={contactName} onChange={setContactName} />
          <TextField label="Contact Email" value={contactEmail} onChange={setContactEmail} type="email" />
          <TextField label="Phone" value={phone} onChange={setPhone} />
          <AddressField
            label="Address"
            value={address}
            onChange={setAddress}
            onSelect={(s) => {
              setAddress(s.formattedAddress);
              setCity(s.city);
              setState(s.state);
              setZip(s.zip);
            }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: '8px' }}>
            <TextField label="City" value={city} onChange={setCity} />
            <TextField label="State" value={state} onChange={setState} />
            <TextField label="Zip" value={zip} onChange={setZip} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--white)', cursor: 'pointer' }}>
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Active
          </label>
          <TextArea label="Notes" value={notes} onChange={setNotes} />
        </div>
      </Card>

      {/* Right column — Sections */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {/* Portal Access */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <SectionHeader>Portal Access</SectionHeader>
            <Button size="sm" onClick={() => void handleInvite()} disabled={inviting || !contactEmail.trim()}>
              {inviting ? 'Sending...' : 'Invite Carrier Admin'}
            </Button>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--white)', cursor: 'pointer', marginBottom: '12px' }}>
            <input type="checkbox" checked={portalEnabled} onChange={(event) => setPortalEnabled(event.target.checked)} />
            Portal enabled
          </label>
          {carrier.portalUsers.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '12px', background: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              No portal users yet. Click "Invite Carrier Admin" to send an invitation to the contact email.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              {carrier.portalUsers.map((user) => (
                <div
                  key={user.firmUserId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--white)' }}>{user.name ?? user.email}</div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{user.email}</div>
                  </div>
                  <Badge tone={user.role === 'carrier_admin' ? 'blue' : 'faint'}>
                    {user.role === 'carrier_admin' ? 'Admin' : 'Desk Adjuster'}
                  </Badge>
                  <Badge tone={user.inviteStatus === 'accepted' ? 'sage' : 'orange'}>
                    {user.inviteStatus === 'accepted' ? 'Accepted' : 'Pending'}
                  </Badge>
                  {user.inviteStatus === 'pending' ? (
                    <Button size="sm" variant="ghost" onClick={() => void handleInvite(user.userId)} disabled={inviting}>
                      Resend
                    </Button>
                  ) : <span />}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Billing Preferences */}
        <Card>
          <SectionHeader>Billing Preferences</SectionHeader>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--white)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="billing-preference"
                checked={billingPreference === 'desk_adjuster'}
                onChange={() => setBillingPreference('desk_adjuster')}
              />
              Bill to desk adjuster on the claim
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--white)', cursor: 'pointer' }}>
              <input
                type="radio"
                name="billing-preference"
                checked={billingPreference === 'billing_contact'}
                onChange={() => setBillingPreference('billing_contact')}
              />
              Bill to billing contact
            </label>
          </div>
          {billingPreference === 'billing_contact' ? (
            <div style={{ display: 'grid', gap: '12px', padding: '12px', background: 'var(--card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <TextField label="Billing Contact Name" value={billingContactName} onChange={setBillingContactName} />
                <TextField label="Billing Contact Email" value={billingContactEmail} onChange={setBillingContactEmail} type="email" />
              </div>
              <AddressField
                label="Billing Address"
                value={billingAddress}
                onChange={setBillingAddress}
                onSelect={(s) => {
                  setBillingAddress(s.formattedAddress);
                  setBillingCity(s.city);
                  setBillingState(s.state);
                  setBillingZip(s.zip);
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: '8px' }}>
                <TextField label="City" value={billingCity} onChange={setBillingCity} />
                <TextField label="State" value={billingState} onChange={setBillingState} />
                <TextField label="Zip" value={billingZip} onChange={setBillingZip} />
              </div>
            </div>
          ) : null}
        </Card>

        {/* Guidelines */}
        <Card>
          <SectionHeader>Guidelines</SectionHeader>
          <div style={{ display: 'grid', gap: '12px' }}>
            <TextField label="Guidelines URL" value={guidelinesUrl} onChange={setGuidelinesUrl} placeholder="https://..." />
            <TextArea label="Guidelines Notes" value={guidelinesNotes} onChange={setGuidelinesNotes} />
          </div>
        </Card>

        {/* Claims Summary */}
        <Card>
          <SectionHeader>Claims Summary</SectionHeader>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Claims</div>
              <div style={{ fontSize: '22px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, marginTop: '4px' }}>{carrier.totalClaims}</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active Claims</div>
              <div style={{ fontSize: '22px', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, marginTop: '4px' }}>{carrier.activeClaims}</div>
            </div>
          </div>
          <Link
            href={`/claims?carrier=${encodeURIComponent(carrier.name)}`}
            style={{ color: 'var(--sage)', fontSize: '13px', textDecoration: 'none' }}
          >
            View all claims →
          </Link>
        </Card>

        {error ? <div style={{ color: 'var(--red)', fontSize: '12px' }}>{error}</div> : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {toast ? (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 16px',
            background: 'var(--sage-dim)',
            color: 'var(--sage)',
            border: '1px solid rgba(91,194,115,0.25)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            zIndex: 300,
            boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
          }}
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
