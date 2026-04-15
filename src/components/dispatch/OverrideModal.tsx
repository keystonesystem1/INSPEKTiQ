'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { AssignMismatchIssue } from '@/components/dispatch/AssignModal';

interface OverrideModalProps {
  open: boolean;
  adjusterName: string;
  issues: AssignMismatchIssue[];
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const DEFAULT_PLACEHOLDER = 'Explain why this assignment should proceed despite the mismatch...';
const WARNING_PLACEHOLDER = 'Warning: override reason is required (10+ characters)';

export function OverrideModal({
  open,
  adjusterName,
  issues,
  onClose,
  onConfirm,
}: OverrideModalProps) {
  const [reason, setReason] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason('');
      setShowValidationError(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const isValid = reason.trim().length >= 10;

  function handleInvalidSubmit() {
    if (isValid) {
      return;
    }

    setShowValidationError(true);
  }

  function handleConfirm() {
    if (!isValid) {
      handleInvalidSubmit();
      return;
    }

    onConfirm(reason.trim());
  }

  return (
    <div className="fixed inset-0 z-[320] flex items-center justify-center bg-[rgba(0,0,0,0.45)] px-6">
      <div className="w-[min(420px,90vw)] overflow-hidden rounded-[12px] border border-[rgba(224,123,63,0.4)] bg-[var(--surface)]">
        <div className="border-b border-[rgba(224,123,63,0.2)] bg-[var(--orange-dim)] px-5 py-4">
          <div className="font-['Barlow_Condensed'] text-[15px] font-extrabold tracking-[0.04em] text-[var(--orange)]">
            ⚠ Capability Mismatch
          </div>
          <div className="mt-1 text-[12px] text-[var(--muted)]">
            {issues.length} issue{issues.length === 1 ? '' : 's'} found assigning to {adjusterName}
          </div>
        </div>

        <div className="px-5 py-[18px]">
          <div className="mb-[14px]">
            {issues.map((issue, index) => (
              <div
                key={`${issue.kind}-${issue.message}-${index}`}
                className="mb-[6px] flex items-start gap-2 rounded-[6px] border border-[rgba(224,123,63,0.15)] bg-[rgba(224,123,63,0.07)] px-[10px] py-2 text-[12px] text-[var(--muted)] last:mb-0"
              >
                <div className="shrink-0 text-[14px] text-[var(--orange)]">⚠</div>
                <div className="leading-[1.5]">
                  <strong className="text-[var(--white)]">{issue.message}</strong>
                </div>
              </div>
            ))}
          </div>

          <label className="block">
            <div className="mb-[6px] font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              Reason for Override
            </div>
            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                if (showValidationError && event.target.value.trim().length >= 10) {
                  setShowValidationError(false);
                }
              }}
              rows={3}
              placeholder={showValidationError ? WARNING_PLACEHOLDER : DEFAULT_PLACEHOLDER}
              className="w-full resize-none rounded-[6px] border bg-[var(--card)] px-3 py-[9px] text-[13px] text-[var(--white)] outline-none transition"
              style={{
                borderColor: showValidationError ? 'var(--red)' : 'var(--border)',
              }}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <div onClick={handleInvalidSubmit}>
            <Button variant="danger" disabled={!isValid} onClick={handleConfirm}>Confirm Override</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
