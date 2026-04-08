'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const MAPBOX_SUGGESTION_LIMIT = 5;

interface MapboxSuggestion {
  id: string;
  label: string;
  formattedAddress: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
}

interface ParsedAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
}

function parseSuggestionContext(feature: {
  place_name?: string;
  center?: [number, number];
  context?: Array<{ id?: string; text?: string; short_code?: string }>;
}) {
  const context = feature.context ?? [];
  const place = context.find((item) => item.id?.startsWith('place'));
  const region = context.find((item) => item.id?.startsWith('region'));
  const postcode = context.find((item) => item.id?.startsWith('postcode'));
  return {
    city: place?.text ?? '',
    state: region?.short_code?.split('-')[1] ?? region?.text ?? '',
    zip: postcode?.text ?? '',
    formattedAddress: feature.place_name ?? '',
    lat: typeof feature.center?.[1] === 'number' ? feature.center[1] : null,
    lng: typeof feature.center?.[0] === 'number' ? feature.center[0] : null,
  };
}

export function AddressField({
  label,
  value,
  onChange,
  onSelect,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (parsed: ParsedAddress) => void;
}) {
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const requestSequenceRef = useRef(0);
  const justSelectedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const query = value.trim();
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!accessToken || query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
        url.searchParams.set('access_token', accessToken);
        url.searchParams.set('country', 'US');
        url.searchParams.set('types', 'address,place,postcode,locality,neighborhood');
        url.searchParams.set('limit', String(MAPBOX_SUGGESTION_LIMIT));
        url.searchParams.set('autocomplete', 'true');
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('mapbox');
        const payload = (await response.json()) as {
          features?: Array<{ id?: string; place_name?: string; text?: string; center?: [number, number]; context?: Array<{ id?: string; text?: string; short_code?: string }> }>;
        };
        if (requestSequenceRef.current !== requestId) return;
        const next = (payload.features ?? []).map((feature) => {
          const parsed = parseSuggestionContext(feature);
          return {
            id: feature.id ?? `${feature.place_name ?? feature.text ?? 'address'}-${Math.random().toString(16).slice(2)}`,
            label: feature.text ?? feature.place_name ?? 'Address',
            ...parsed,
          } satisfies MapboxSuggestion;
        });
        setSuggestions(next);
        setOpen(next.length > 0);
      } catch {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setOpen(false);
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [value]);

  return (
    <label style={{ display: 'grid', gap: '5px', position: 'relative' }}>
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Search for an address"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%' }}
      />
      {open && suggestions.length > 0 ? (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: '6px', border: '1px solid var(--border-hi)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', boxShadow: '0 12px 28px rgba(0,0,0,0.28)', overflow: 'hidden' }}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                justSelectedRef.current = true;
                onSelect({
                  address: suggestion.formattedAddress,
                  city: suggestion.city,
                  state: suggestion.state,
                  zip: suggestion.zip,
                });
                setSuggestions([]);
                setOpen(false);
                inputRef.current?.blur();
              }}
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderTop: '1px solid var(--border)', background: 'transparent', color: 'var(--white)', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{suggestion.label}</div>
              <div style={{ marginTop: '3px', fontSize: '11px', color: 'var(--muted)' }}>{suggestion.formattedAddress}</div>
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label style={{ display: 'grid', gap: '5px' }}>
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}{required ? ' *' : ''}
      </span>
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
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</span>
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
    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--white)', marginBottom: '4px' }}>
      {children}
    </div>
  );
}

export function NewClientModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (message: string) => void;
}) {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [notes, setNotes] = useState('');
  const [guidelinesUrl, setGuidelinesUrl] = useState('');
  const [guidelinesNotes, setGuidelinesNotes] = useState('');
  const [billingPreference, setBillingPreference] = useState<'desk_adjuster' | 'billing_contact'>('desk_adjuster');
  const [billingContactName, setBillingContactName] = useState('');
  const [billingContactEmail, setBillingContactEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingState, setBillingState] = useState('');
  const [billingZip, setBillingZip] = useState('');
  const [portalEnabled, setPortalEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setContactName('');
    setContactEmail('');
    setPhone('');
    setAddress('');
    setCity('');
    setState('');
    setZip('');
    setNotes('');
    setGuidelinesUrl('');
    setGuidelinesNotes('');
    setBillingPreference('desk_adjuster');
    setBillingContactName('');
    setBillingContactEmail('');
    setBillingAddress('');
    setBillingCity('');
    setBillingState('');
    setBillingZip('');
    setPortalEnabled(false);
    setError(null);
  }

  function handleCancel() {
    reset();
    onClose();
  }

  async function handleSave() {
    if (!name.trim() || !contactName.trim() || !contactEmail.trim()) {
      setError('Company name, contact name, and contact email are required.');
      return;
    }
    if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/carriers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim() || undefined,
          zip: zip.trim() || undefined,
          billingPreference,
          billingContactName: billingPreference === 'billing_contact' ? billingContactName.trim() || undefined : undefined,
          billingContactEmail: billingPreference === 'billing_contact' ? billingContactEmail.trim() || undefined : undefined,
          billingAddress: billingPreference === 'billing_contact' ? billingAddress.trim() || undefined : undefined,
          billingCity: billingPreference === 'billing_contact' ? billingCity.trim() || undefined : undefined,
          billingState: billingPreference === 'billing_contact' ? billingState.trim() || undefined : undefined,
          billingZip: billingPreference === 'billing_contact' ? billingZip.trim() || undefined : undefined,
          notes: notes.trim() || undefined,
          guidelinesUrl: guidelinesUrl.trim() || undefined,
          guidelinesNotes: guidelinesNotes.trim() || undefined,
          portalEnabled,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Unable to create client.');
      }
      const message = portalEnabled
        ? `Client added. Invitation sent to ${contactEmail.trim()}.`
        : 'Client added.';
      reset();
      onCreated(message);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create client.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="New Client"
      subtitle="Carrier company info, billing preferences, and portal access."
      onClose={handleCancel}
      footer={
        <>
          <Button variant="ghost" onClick={handleCancel} disabled={saving}>Cancel</Button>
          <Button onClick={() => void handleSave()} disabled={saving}>{saving ? 'Saving...' : 'Save Client'}</Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '20px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
        <section style={{ display: 'grid', gap: '12px' }}>
          <SectionHeader>Company Info</SectionHeader>
          <TextField label="Company Name" value={name} onChange={setName} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <TextField label="Primary Contact Name" value={contactName} onChange={setContactName} required />
            <TextField label="Primary Contact Email" value={contactEmail} onChange={setContactEmail} type="email" required />
          </div>
          <TextField label="Phone" value={phone} onChange={setPhone} />
          <AddressField
            label="Address"
            value={address}
            onChange={setAddress}
            onSelect={(parsed) => {
              setAddress(parsed.address);
              setCity(parsed.city);
              setState(parsed.state);
              setZip(parsed.zip);
            }}
          />
          <TextArea label="Notes" value={notes} onChange={setNotes} />
          <TextField label="Guidelines URL" value={guidelinesUrl} onChange={setGuidelinesUrl} placeholder="https://..." />
          <TextArea label="Guidelines Notes" value={guidelinesNotes} onChange={setGuidelinesNotes} />
        </section>

        <section style={{ display: 'grid', gap: '12px' }}>
          <SectionHeader>Billing Preferences</SectionHeader>
          <div style={{ display: 'grid', gap: '8px' }}>
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
                onSelect={(parsed) => {
                  setBillingAddress(parsed.address);
                  setBillingCity(parsed.city);
                  setBillingState(parsed.state);
                  setBillingZip(parsed.zip);
                }}
              />
            </div>
          ) : null}
        </section>

        <section style={{ display: 'grid', gap: '10px' }}>
          <SectionHeader>Portal Access</SectionHeader>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--white)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={portalEnabled}
              onChange={(event) => setPortalEnabled(event.target.checked)}
            />
            Enable client portal
          </label>
          {portalEnabled ? (
            <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '8px 12px', background: 'var(--sage-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(91,194,115,0.2)' }}>
              An invitation email will be sent to {contactEmail.trim() || '[contact email]'} when you save.
            </div>
          ) : null}
        </section>

        {error ? <div style={{ color: 'var(--red)', fontSize: '12px' }}>{error}</div> : null}
      </div>
    </Modal>
  );
}
