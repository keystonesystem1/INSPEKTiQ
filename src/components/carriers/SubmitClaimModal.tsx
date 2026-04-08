'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AddressField } from '@/components/clients/NewClientModal';

const LOSS_TYPES = ['Wind', 'Hail', 'Wind/Hail', 'Fire', 'Flood', 'Liability', 'Other'] as const;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label style={{ display: 'grid', gap: '5px' }}>
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}{required ? ' *' : ''}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%' }}
      />
    </label>
  );
}

export function SubmitClaimModal({
  open,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}) {
  const [insuredName, setInsuredName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [dateOfLoss, setDateOfLoss] = useState('');
  const [lossType, setLossType] = useState<string>('Wind');
  const [lossAddress, setLossAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setInsuredName('');
    setPolicyNumber('');
    setDateOfLoss('');
    setLossType('Wind');
    setLossAddress('');
    setCity('');
    setState('');
    setZip('');
    setDescription('');
    setFiles([]);
    setError(null);
  }

  function handleCancel() {
    reset();
    onClose();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    const oversized = selected.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`File "${oversized.name}" exceeds the 50MB limit.`);
      return;
    }
    setError(null);
    setFiles((current) => [...current, ...selected]);
    event.target.value = '';
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!insuredName.trim() || !policyNumber.trim() || !dateOfLoss.trim()) {
      setError('Insured name, policy number, and date of loss are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('insuredName', insuredName.trim());
      formData.append('policyNumber', policyNumber.trim());
      formData.append('dateOfLoss', dateOfLoss);
      formData.append('lossType', lossType);
      formData.append('lossAddress', lossAddress.trim());
      formData.append('city', city.trim());
      formData.append('state', state.trim());
      formData.append('zip', zip.trim());
      formData.append('description', description.trim());
      files.forEach((file) => formData.append('files', file, file.name));

      const response = await fetch('/api/carriers/submit-claim', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Unable to submit claim.');
      }
      reset();
      onSubmitted('Claim submitted. Your firm will review it shortly.');
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit claim.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Submit a Claim"
      subtitle="File a new claim for your firm to review."
      onClose={handleCancel}
      footer={
        <>
          <Button variant="ghost" onClick={handleCancel} disabled={saving}>Cancel</Button>
          <Button onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? 'Submitting...' : 'Submit Claim'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '14px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
        <Field label="Insured Name" value={insuredName} onChange={setInsuredName} required />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="Policy Number" value={policyNumber} onChange={setPolicyNumber} required />
          <Field label="Date of Loss" value={dateOfLoss} onChange={setDateOfLoss} type="date" required />
        </div>
        <label style={{ display: 'grid', gap: '5px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Loss Type</span>
          <select
            value={lossType}
            onChange={(event) => setLossType(event.target.value)}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%' }}
          >
            {LOSS_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <AddressField
          label="Loss Address"
          value={lossAddress}
          onChange={setLossAddress}
          onSelect={(parsed) => {
            setLossAddress(parsed.address);
            setCity(parsed.city);
            setState(parsed.state);
            setZip(parsed.zip);
          }}
        />
        <label style={{ display: 'grid', gap: '5px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
          />
        </label>
        <label style={{ display: 'grid', gap: '5px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>File Attachments (max 50MB each)</span>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ color: 'var(--muted)', fontSize: '12px' }}
          />
        </label>
        {files.length > 0 ? (
          <div style={{ display: 'grid', gap: '6px' }}>
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
              >
                <div style={{ fontSize: '12px', color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name} <span style={{ color: 'var(--muted)' }}>({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--red)', fontSize: '11px', cursor: 'pointer' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {error ? <div style={{ color: 'var(--red)', fontSize: '12px' }}>{error}</div> : null}
      </div>
    </Modal>
  );
}
