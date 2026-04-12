import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface ModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose?: () => void;
  footer?: ReactNode;
}

export function Modal({ open, title, subtitle, children, onClose, footer }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: 'min(540px, 92vw)',
          background: 'var(--surface)',
          border: '1px solid var(--border-hi)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border)' }}>
          <div
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800,
              fontSize: '22px',
              letterSpacing: '0.04em',
            }}
          >
            {title}
          </div>
          {subtitle ? <div style={{ marginTop: '4px', color: 'var(--dim)' }}>{subtitle}</div> : null}
        </div>
        <div style={{ padding: '22px 28px' }}>{children}</div>
        <div
          style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
          }}
        >
          {footer ?? (
            <>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={onClose}>Done</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
