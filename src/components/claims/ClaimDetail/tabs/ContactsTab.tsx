'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { ClaimContactEntry, ClaimContactKind, ClaimContactsData } from '@/lib/types';

const KIND_LABELS: Record<ClaimContactKind, string> = {
  contractor: 'Contractor',
  public_adjuster: 'Public Adjuster',
  other: 'Other',
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
      {children}
    </div>
  );
}

function CopyButton({ value, onCopied }: { value: string; onCopied: () => void }) {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          onCopied();
        } catch {
          /* ignore */
        }
      }}
      style={{
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '2px 6px',
        color: 'var(--muted)',
        fontSize: '10px',
        fontFamily: 'Barlow Condensed, sans-serif',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: 'pointer',
      }}
    >
      Copy
    </button>
  );
}

interface ContactCardProps {
  name: string;
  roleLabel: string;
  company?: string;
  phone?: string | null;
  email?: string | null;
  onEdit?: () => void;
  onCopied: (message: string) => void;
}

function ContactCard({ name, roleLabel, company, phone, email, onEdit, onCopied }: ContactCardProps) {
  const initials = getInitials(name || roleLabel);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr auto',
        gap: '12px',
        alignItems: 'center',
        padding: '12px 14px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '999px',
          background: 'var(--blue-dim)',
          color: 'var(--blue)',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 800,
          fontSize: '14px',
        }}
      >
        {initials}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--white)' }}>{name || '—'}</div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
          {roleLabel}{company ? ` · ${company}` : ''}
        </div>
        <div style={{ display: 'grid', gap: '4px' }}>
          {phone ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <a href={`tel:${phone}`} style={{ color: 'var(--sage)', textDecoration: 'none' }}>{phone}</a>
              <CopyButton value={phone} onCopied={() => onCopied('Phone copied')} />
            </div>
          ) : null}
          {email ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <a href={`mailto:${email}`} style={{ color: 'var(--sage)', textDecoration: 'none' }}>{email}</a>
              <CopyButton value={email} onCopied={() => onCopied('Email copied')} />
            </div>
          ) : null}
          {!phone && !email ? (
            <div style={{ fontSize: '11px', color: 'var(--faint)' }}>No phone or email on file.</div>
          ) : null}
        </div>
      </div>
      {onEdit ? (
        <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
      ) : null}
    </div>
  );
}

interface ContactFormState {
  kind: ClaimContactKind;
  label: string;
  name: string;
  company: string;
  phone: string;
  email: string;
}

function emptyForm(): ContactFormState {
  return { kind: 'contractor', label: '', name: '', company: '', phone: '', email: '' };
}

function ContactForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: ContactFormState;
  onCancel: () => void;
  onSave: (form: ContactFormState) => void;
}) {
  const [form, setForm] = useState(initial);

  function update<K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div
      style={{
        display: 'grid',
        gap: '10px',
        padding: '14px',
        background: 'var(--card)',
        border: '1px solid var(--border-hi)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <label style={{ display: 'grid', gap: '4px' }}>
        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>Type</span>
        <select
          value={form.kind}
          onChange={(event) => update('kind', event.target.value as ClaimContactKind)}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--white)' }}
        >
          <option value="contractor">Contractor</option>
          <option value="public_adjuster">Public Adjuster</option>
          <option value="other">Other</option>
        </select>
      </label>
      {form.kind === 'other' ? (
        <label style={{ display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>Label</span>
          <input value={form.label} onChange={(event) => update('label', event.target.value)} placeholder="e.g. Neighbor, Mitigation Company" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--white)' }} />
        </label>
      ) : null}
      <label style={{ display: 'grid', gap: '4px' }}>
        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>Name</span>
        <input value={form.name} onChange={(event) => update('name', event.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--white)' }} />
      </label>
      {form.kind !== 'other' ? (
        <label style={{ display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>Company</span>
          <input value={form.company} onChange={(event) => update('company', event.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--white)' }} />
        </label>
      ) : null}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <label style={{ display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>Phone</span>
          <input type="tel" value={form.phone} onChange={(event) => update('phone', event.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--white)' }} />
        </label>
        <label style={{ display: 'grid', gap: '4px' }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700 }}>Email</span>
          <input type="email" value={form.email} onChange={(event) => update('email', event.target.value)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--white)' }} />
        </label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={() => onSave(form)} disabled={!form.name.trim()}>Save Contact</Button>
      </div>
    </div>
  );
}

export function ContactsTab({ claimId, contacts }: { claimId: string; contacts: ClaimContactsData }) {
  const router = useRouter();
  const [editable, setEditable] = useState<ClaimContactEntry[]>(contacts.editableContacts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(id);
  }, [toast]);

  async function persist(next: ClaimContactEntry[]) {
    setSaving(true);
    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimContacts: next }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Unable to save contact.');
      }
      setEditable(next);
      setToast('Contact saved');
      router.refresh();
    } catch (caught) {
      setToast(caught instanceof Error ? caught.message : 'Unable to save contact.');
    } finally {
      setSaving(false);
    }
  }

  function handleAddSave(form: ContactFormState) {
    const entry: ClaimContactEntry = {
      id: crypto.randomUUID(),
      kind: form.kind,
      label: form.kind === 'other' ? form.label.trim() || undefined : undefined,
      name: form.name.trim(),
      company: form.kind !== 'other' ? form.company.trim() || undefined : undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
    };
    setAdding(false);
    void persist([...editable, entry]);
  }

  function handleEditSave(id: string, form: ContactFormState) {
    const next = editable.map((entry) =>
      entry.id === id
        ? {
            ...entry,
            kind: form.kind,
            label: form.kind === 'other' ? form.label.trim() || undefined : undefined,
            name: form.name.trim(),
            company: form.kind !== 'other' ? form.company.trim() || undefined : undefined,
            phone: form.phone.trim() || undefined,
            email: form.email.trim() || undefined,
          }
        : entry,
    );
    setEditingId(null);
    void persist(next);
  }

  function handleDelete(id: string) {
    setEditingId(null);
    void persist(editable.filter((entry) => entry.id !== id));
  }

  function onCopied(message: string) {
    setToast(message);
  }

  function formFromEntry(entry: ClaimContactEntry): ContactFormState {
    return {
      kind: entry.kind,
      label: entry.label ?? '',
      name: entry.name,
      company: entry.company ?? '',
      phone: entry.phone ?? '',
      email: entry.email ?? '',
    };
  }

  return (
    <Card>
      <div style={{ display: 'grid', gap: '20px' }}>
        <section>
          <SectionHeader>Firm</SectionHeader>
          <div style={{ display: 'grid', gap: '8px' }}>
            {contacts.adjuster ? (
              <ContactCard
                name={contacts.adjuster.name}
                roleLabel="Adjuster"
                phone={contacts.adjuster.phone}
                email={contacts.adjuster.email}
                onCopied={onCopied}
              />
            ) : (
              <div style={{ padding: '12px 14px', color: 'var(--muted)', fontSize: '12px' }}>
                No adjuster assigned.
              </div>
            )}
            {contacts.examiner ? (
              <ContactCard
                name={contacts.examiner.name}
                roleLabel="Examiner"
                email={contacts.examiner.email}
                onCopied={onCopied}
              />
            ) : null}
          </div>
        </section>

        {contacts.carrierDeskAdjusters.length > 0 ? (
          <section>
            <SectionHeader>Carrier</SectionHeader>
            <div style={{ display: 'grid', gap: '8px' }}>
              {contacts.carrierDeskAdjusters.map((desk) => (
                <ContactCard
                  key={desk.firmUserId}
                  name={desk.name}
                  roleLabel="Desk Adjuster"
                  email={desk.email}
                  onCopied={onCopied}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <SectionHeader>External</SectionHeader>
          <div style={{ display: 'grid', gap: '8px' }}>
            <ContactCard
              name={contacts.insured.name}
              roleLabel="Insured"
              phone={contacts.insured.phone}
              email={contacts.insured.email}
              onCopied={onCopied}
            />
            {editable.map((entry) =>
              editingId === entry.id ? (
                <ContactForm
                  key={entry.id}
                  initial={formFromEntry(entry)}
                  onCancel={() => setEditingId(null)}
                  onSave={(form) => handleEditSave(entry.id, form)}
                />
              ) : (
                <div key={entry.id} style={{ display: 'grid', gap: '6px' }}>
                  <ContactCard
                    name={entry.name}
                    roleLabel={entry.label?.trim() || KIND_LABELS[entry.kind]}
                    company={entry.company}
                    phone={entry.phone}
                    email={entry.email}
                    onEdit={() => setEditingId(entry.id)}
                    onCopied={onCopied}
                  />
                  {editingId === entry.id ? null : (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--red)', fontSize: '11px', cursor: 'pointer' }}
                        disabled={saving}
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ),
            )}
            {adding ? (
              <ContactForm
                initial={emptyForm()}
                onCancel={() => setAdding(false)}
                onSave={handleAddSave}
              />
            ) : null}
            {!adding ? (
              <div>
                <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>+ Add Contact</Button>
              </div>
            ) : null}
          </div>
        </section>
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
    </Card>
  );
}
