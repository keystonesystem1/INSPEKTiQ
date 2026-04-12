'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import type { CardSize } from '@/lib/dashboard-cards';

interface DashboardCardShellProps {
  id: string;
  size: CardSize;
  locked: boolean;
  allowedSizes: CardSize[];
  customizing: boolean;
  onResize: (id: string, size: CardSize) => void;
  onHide: (id: string) => void;
  children: ReactNode;
}

export function DashboardCardShell({
  id,
  size,
  locked,
  allowedSizes,
  customizing,
  onResize,
  onHide,
  children,
}: DashboardCardShellProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: locked || !customizing });

  const canResize = !locked && allowedSizes.length > 1;
  const nextSize: CardSize = size === 'half' ? 'full' : 'half';

  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn: size === 'full' ? 'span 2' : 'span 1',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        outline: customizing && !locked ? '1.5px dashed var(--border-hi)' : undefined,
      }}
    >
      {/* Customize-mode chrome */}
      {customizing ? (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 10,
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
          }}
        >
          {canResize ? (
            <button
              type="button"
              onClick={() => onResize(id, nextSize)}
              title={size === 'half' ? 'Expand to full width' : 'Collapse to half width'}
              style={CTRL_STYLE}
            >
              {size === 'half' ? '⊞' : '⊡'}
            </button>
          ) : null}
          {!locked ? (
            <button
              type="button"
              onClick={() => onHide(id)}
              title="Hide card"
              style={CTRL_STYLE}
            >
              ✕
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Drag handle — only in customize mode, only on non-locked cards */}
      {customizing && !locked ? (
        <div
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          style={{
            position: 'absolute',
            top: '50%',
            left: '10px',
            transform: 'translateY(-50%)',
            zIndex: 10,
            cursor: isDragging ? 'grabbing' : 'grab',
            color: 'var(--muted)',
            fontSize: '16px',
            lineHeight: 1,
            userSelect: 'none',
            touchAction: 'none',
          }}
        >
          ⠿
        </div>
      ) : null}

      {/* Card content — indent when drag handle is visible */}
      <div style={{ paddingLeft: customizing && !locked ? '28px' : undefined }}>
        {children}
      </div>
    </div>
  );
}

const CTRL_STYLE: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--muted)',
  cursor: 'pointer',
  fontSize: '13px',
  height: '26px',
  width: '26px',
  display: 'grid',
  placeItems: 'center',
  padding: 0,
};
