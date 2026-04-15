'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/FormInput';
import { AddressField } from '@/components/ui/AddressField';
import type { AddressFieldSuggestion } from '@/components/ui/AddressField';
import type { Claim } from '@/lib/types';

interface ClaimFormValues {
  claimNumber: string;
  insuredName: string;
  phone: string;
  email: string;
  lossAddress: string;
  city: string;
  state: string;
  zip: string;
  carrier: string;
  lossType: string;
  claimCategory: string;
  dateOfLoss: string;
  policyNumber: string;
  lossDescription: string;
}

interface ClaimFormModalProps {
  open: boolean;
  title: string;
  subtitle: string;
  submitLabel: string;
  initialValues?: Partial<ClaimFormValues>;
  onClose: () => void;
  onSubmit: (values: ClaimFormValues) => Promise<void>;
}

export function getClaimFormValues(claim: Claim): ClaimFormValues {
  return {
    claimNumber: claim.number || '',
    insuredName: claim.insured || '',
    phone: claim.insuredPhone || '',
    email: claim.insuredEmail || '',
    lossAddress: claim.address || '',
    city: claim.city || '',
    state: claim.state || '',
    zip: claim.zip || '',
    carrier: claim.carrier || claim.client || '',
    lossType: claim.type || '',
    claimCategory: claim.category || 'Residential',
    dateOfLoss: claim.dateOfLoss ? claim.dateOfLoss.slice(0, 10) : '',
    policyNumber: claim.policyNumber || '',
    lossDescription: claim.lossCause || '',
  };
}

function createDefaultValues(initialValues?: Partial<ClaimFormValues>): ClaimFormValues {
  return {
    claimNumber: initialValues?.claimNumber ?? '',
    insuredName: initialValues?.insuredName ?? '',
    phone: initialValues?.phone ?? '',
    email: initialValues?.email ?? '',
    lossAddress: initialValues?.lossAddress ?? '',
    city: initialValues?.city ?? '',
    state: initialValues?.state ?? '',
    zip: initialValues?.zip ?? '',
    carrier: initialValues?.carrier ?? '',
    lossType: initialValues?.lossType ?? '',
    claimCategory: initialValues?.claimCategory ?? 'Residential',
    dateOfLoss: initialValues?.dateOfLoss ?? '',
    policyNumber: initialValues?.policyNumber ?? '',
    lossDescription: initialValues?.lossDescription ?? '',
  };
}

export function ClaimFormModal({
  open,
  title,
  subtitle,
  submitLabel,
  initialValues,
  onClose,
  onSubmit,
}: ClaimFormModalProps) {
  const [values, setValues] = useState<ClaimFormValues>(() => createDefaultValues(initialValues));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(createDefaultValues(initialValues));
    setSaving(false);
    setError('');
  }, [initialValues, open]);

  function setField<K extends keyof ClaimFormValues>(field: K, value: ClaimFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit() {
    if (!values.insuredName || !values.lossAddress || !values.carrier || !values.lossType || !values.dateOfLoss) {
      setError('Insured name, loss address, carrier, cause of loss, and date of loss are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSubmit(values);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save claim.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} disabled={saving}>{saving ? 'Saving...' : submitLabel}</Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormInput label="Insured Name" value={values.insuredName} onChange={(value) => setField('insuredName', value)} />
          <FormInput label="Claim Number" value={values.claimNumber} onChange={(value) => setField('claimNumber', value)} placeholder="e.g. MAN-2026-ABC123" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormInput label="Phone" value={values.phone} onChange={(value) => setField('phone', value)} />
          <FormInput label="Email" value={values.email} onChange={(value) => setField('email', value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormInput label="Carrier" value={values.carrier} onChange={(value) => setField('carrier', value)} />
          <FormInput label="Policy Number" value={values.policyNumber} onChange={(value) => setField('policyNumber', value)} />
        </div>
        <AddressField
          label="Loss Address"
          value={values.lossAddress}
          onChange={(value) => setField('lossAddress', value)}
          onSelect={(suggestion: AddressFieldSuggestion) => {
            setValues((current) => ({
              ...current,
              lossAddress: suggestion.formattedAddress.split(',')[0]?.trim() || suggestion.formattedAddress,
              city: suggestion.city || current.city,
              state: suggestion.state || current.state,
              zip: suggestion.zip || current.zip,
            }));
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px', gap: '12px' }}>
          <FormInput label="City" value={values.city} onChange={(value) => setField('city', value)} />
          <FormInput label="State" value={values.state} onChange={(value) => setField('state', value)} />
          <FormInput label="Zip" value={values.zip} onChange={(value) => setField('zip', value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <FormInput label="Cause of Loss" value={values.lossType} onChange={(value) => setField('lossType', value)} />
          <label style={{ display: 'grid', gap: '5px' }}>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Claim Category
            </span>
            <select
              value={values.claimCategory}
              onChange={(event) => setField('claimCategory', event.target.value)}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%' }}
            >
              {['Residential', 'Commercial', 'Farm/Ranch', 'Industrial'].map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </div>
        <label style={{ display: 'grid', gap: '5px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
            Date of Loss
          </span>
          <input
            type="date"
            value={values.dateOfLoss}
            onChange={(event) => setField('dateOfLoss', event.target.value)}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%' }}
          />
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Loss Description</span>
          <textarea
            value={values.lossDescription}
            onChange={(e) => setField('lossDescription', e.target.value)}
            placeholder="Describe the loss..."
            rows={4}
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '9px 12px',
              color: 'var(--white)',
              width: '100%',
              resize: 'vertical',
              minHeight: '96px',
              fontFamily: 'inherit',
              fontSize: '13px',
              lineHeight: '1.5',
              boxSizing: 'border-box',
            }}
          />
        </div>
        {error ? <div style={{ color: 'var(--red)', fontSize: '12px' }}>{error}</div> : null}
      </div>
    </Modal>
  );
}
