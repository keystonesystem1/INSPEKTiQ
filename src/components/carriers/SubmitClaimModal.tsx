'use client';

import { useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AddressField } from '@/components/ui/AddressField';

const LOSS_TYPES = ['Wind', 'Hail', 'Wind/Hail', 'Fire', 'Flood', 'Liability', 'Other'] as const;
const CLAIM_TYPES = ['Residential', 'Commercial'] as const;
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
  const [claimType, setClaimType] = useState<(typeof CLAIM_TYPES)[number]>('Residential');
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setClaimType('Residential');
    setFiles([]);
    setError(null);
  }

  function handleCancel() {
    reset();
    onClose();
  }

  function addFiles(incoming: File[]) {
    const oversized = incoming.find((file) => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setError(`File "${oversized.name}" exceeds the 50MB limit.`);
      return;
    }
    setError(null);
    setFiles((current) => [...current, ...incoming]);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = '';
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    if (event.dataTransfer?.files?.length) {
      addFiles(Array.from(event.dataTransfer.files));
    }
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
      formData.append('claimType', claimType);
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
        <div style={{ display: 'grid', gap: '5px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>Claim Type *</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            {CLAIM_TYPES.map((type) => {
              const active = claimType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setClaimType(type)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: active ? '1px solid rgba(91,194,115,0.25)' : '1px solid var(--border)',
                    background: active ? 'var(--sage-dim)' : 'transparent',
                    color: active ? 'var(--sage)' : 'var(--muted)',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
        <AddressField
          label="Loss Address"
          value={lossAddress}
          onChange={setLossAddress}
          onSelect={(s) => {
            setLossAddress(s.formattedAddress);
            setCity(s.city);
            setState(s.state);
            setZip(s.zip);
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
        <div style={{ display: 'grid', gap: '5px' }}>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>File Attachments (max 50MB each)</span>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? 'var(--sage)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              textAlign: 'center',
              background: dragOver ? 'rgba(91,194,115,0.06)' : 'var(--card)',
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>☁︎</div>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '12px', color: 'var(--white)', letterSpacing: '0.04em' }}>
              Drag files here or click to browse
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
              Any file type · 50MB per file
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
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
