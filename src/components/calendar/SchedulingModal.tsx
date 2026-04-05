'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { SchedulingQueueItem } from '@/lib/types';

interface SchedulingModalProps {
  open: boolean;
  onClose: () => void;
  onScheduled: () => Promise<void>;
  claims: SchedulingQueueItem[];
  firmId: string;
  adjusterUserId: string;
  claimId?: string;
  date?: string;
}

interface ClaimOption {
  id: string;
  label: string;
  detail: string;
}

const FIELD_LABEL_STYLE = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '10px',
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: 'var(--muted)',
};

const FIELD_STYLE = {
  width: '100%',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '10px 12px',
  color: 'var(--white)',
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2);
  const minutes = index % 2 === 0 ? '00' : '30';
  const value = `${String(hours).padStart(2, '0')}:${minutes}`;
  const date = new Date(`1970-01-01T${value}:00`);
  const label = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  return { value, label };
});

function toTimeForApi(value: string) {
  return `${value}:00`;
}

function getClaimOption(claim: SchedulingQueueItem): ClaimOption {
  return {
    id: claim.id,
    label: `${claim.claimNumber} · ${claim.insuredName}`,
    detail: [claim.lossAddress, `${claim.carrier} · ${claim.lossType}`].filter(Boolean).join(' · '),
  };
}

export function SchedulingModal({
  open,
  onClose,
  onScheduled,
  claims,
  firmId,
  adjusterUserId,
  claimId,
  date,
}: SchedulingModalProps) {
  const claimOptions = useMemo(() => claims.map(getClaimOption), [claims]);
  const prefilledClaim = useMemo(
    () => claimOptions.find((option) => option.id === claimId),
    [claimId, claimOptions],
  );
  const [selectedClaimId, setSelectedClaimId] = useState(claimId ?? '');
  const [claimQuery, setClaimQuery] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(date ?? '');
  const [arrivalTime, setArrivalTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedClaimId(claimId ?? '');
    setClaimQuery('');
    setAppointmentDate(date ?? '');
    setArrivalTime('09:00');
    setEndTime('11:00');
    setNotes('');
    setSaving(false);
    setError(null);
  }, [claimId, date, open]);

  const filteredClaims = useMemo(() => {
    if (!claimQuery.trim()) {
      return claimOptions;
    }

    const query = claimQuery.trim().toLowerCase();
    return claimOptions.filter((option) =>
      `${option.label} ${option.detail}`.toLowerCase().includes(query),
    );
  }, [claimOptions, claimQuery]);

  const resolvedClaimId = claimId ?? selectedClaimId;
  const selectedClaim = prefilledClaim ?? claimOptions.find((option) => option.id === selectedClaimId);
  const canSubmit =
    Boolean(resolvedClaimId) &&
    Boolean(appointmentDate) &&
    Boolean(arrivalTime) &&
    Boolean(endTime) &&
    arrivalTime < endTime &&
    !saving;

  async function handleSubmit() {
    if (!resolvedClaimId) {
      setError('Choose a claim to schedule.');
      return;
    }

    if (!appointmentDate) {
      setError('Choose an inspection date.');
      return;
    }

    if (arrivalTime >= endTime) {
      setError('End time must be later than the arrival time.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId: resolvedClaimId,
          firmId,
          adjusterUserId,
          date: appointmentDate,
          arrivalTime: toTimeForApi(arrivalTime),
          endTime: toTimeForApi(endTime),
          status: 'pending',
          notes: notes.trim() || null,
        }),
      });

      if (!appointmentResponse.ok) {
        const payload = (await appointmentResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Failed to schedule the inspection.');
      }

      await onScheduled();
      onClose();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Failed to schedule the inspection.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Inspection"
      subtitle="Set appointment date, time, and confirm with insured"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit}>
            {saving ? 'Scheduling...' : 'Schedule Inspection'}
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '14px' }}>
        <div style={{ display: 'grid', gap: '6px' }}>
          <span style={FIELD_LABEL_STYLE}>Claim</span>
          {prefilledClaim ? (
            <div style={{ ...FIELD_STYLE, color: 'var(--muted)' }}>{prefilledClaim.label}</div>
          ) : (
            <div style={{ display: 'grid', gap: '8px' }}>
              <input
                value={claimQuery}
                onChange={(event) => setClaimQuery(event.target.value)}
                placeholder="Search by claim number or insured name"
                style={FIELD_STYLE}
              />
              <div
                style={{
                  maxHeight: '170px',
                  overflowY: 'auto',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--card)',
                }}
              >
                {filteredClaims.length ? (
                  filteredClaims.map((option) => {
                    const active = option.id === selectedClaimId;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setSelectedClaimId(option.id)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: 'none',
                          borderBottom: '1px solid var(--border)',
                          background: active ? 'rgba(91,194,115,0.12)' : 'transparent',
                          color: active ? 'var(--white)' : 'var(--muted)',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{option.label}</div>
                        <div style={{ marginTop: '3px', fontSize: '11px' }}>{option.detail || 'No address available'}</div>
                      </button>
                    );
                  })
                ) : (
                  <div style={{ padding: '12px', fontSize: '12px', color: 'var(--muted)' }}>
                    No matching claims in the scheduling queue.
                  </div>
                )}
              </div>
            </div>
          )}
          {!prefilledClaim && selectedClaim ? (
            <div style={{ fontSize: '11px', color: 'var(--faint)' }}>{selectedClaim.detail || 'No address available'}</div>
          ) : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={{ display: 'grid', gap: '6px' }}>
            <span style={FIELD_LABEL_STYLE}>Date</span>
            <input
              type="date"
              value={appointmentDate}
              onChange={(event) => setAppointmentDate(event.target.value)}
              style={FIELD_STYLE}
            />
          </label>
          <div />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={{ display: 'grid', gap: '6px' }}>
            <span style={FIELD_LABEL_STYLE}>Arrival Time</span>
            <select
              value={arrivalTime}
              onChange={(event) => setArrivalTime(event.target.value)}
              style={FIELD_STYLE}
            >
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'grid', gap: '6px' }}>
            <span style={FIELD_LABEL_STYLE}>End Time</span>
            <select
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              style={FIELD_STYLE}
            >
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={{ display: 'grid', gap: '6px' }}>
          <span style={FIELD_LABEL_STYLE}>Notes</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional scheduling notes"
            rows={4}
            style={{ ...FIELD_STYLE, resize: 'vertical' as const }}
          />
        </label>

        {error ? (
          <div
            style={{
              border: '1px solid rgba(224,92,92,0.35)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(224,92,92,0.08)',
              padding: '10px 12px',
              color: 'var(--red)',
              fontSize: '12px',
            }}
          >
            {error}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
