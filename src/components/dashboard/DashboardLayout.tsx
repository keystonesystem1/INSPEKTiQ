'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { DashboardCardShell } from '@/components/dashboard/DashboardCardShell';
import { Button } from '@/components/ui/Button';
import type { CardDefinition, CardLayoutItem, CardSize } from '@/lib/dashboard-cards';
import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  /** Card definitions for this role (registry). */
  cardDefs: CardDefinition[];
  /** Server-loaded initial layout (merged with defaults). */
  initialLayout: CardLayoutItem[];
  /** Map of card id → React node to render inside the card. */
  cardContent: Record<string, ReactNode>;
  /** Greeting / subtitle header rendered above the grid. */
  header: ReactNode;
}

export function DashboardLayout({
  cardDefs,
  initialLayout,
  cardContent,
  header,
}: DashboardLayoutProps) {
  const [layout, setLayout] = useState<CardLayoutItem[]>(initialLayout);
  const [customizing, setCustomizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const defById = new Map(cardDefs.map((d) => [d.id, d]));
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced persist — fires 600ms after the last layout change
  const persistLayout = useCallback((next: CardLayoutItem[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/user/preferences', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layout: next }),
          });
          setSaveStatus(res.ok ? 'saved' : 'error');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        }
      })();
    }, 600);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  function updateLayout(next: CardLayoutItem[]) {
    setLayout(next);
    persistLayout(next);
  }

  // dnd-kit drag end
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const visibleItems = layout.filter((item) => item.visible);
    const oldIndex = visibleItems.findIndex((item) => item.id === active.id);
    const newIndex = visibleItems.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(visibleItems, oldIndex, newIndex);

    // Merge back with hidden items (hidden items keep their relative position at the end)
    const hiddenItems = layout.filter((item) => !item.visible);
    updateLayout([...reordered, ...hiddenItems]);
  }

  function handleResize(id: string, size: CardSize) {
    updateLayout(layout.map((item) => (item.id === id ? { ...item, size } : item)));
  }

  function handleHide(id: string) {
    updateLayout(layout.map((item) => (item.id === id ? { ...item, visible: false } : item)));
  }

  function handleRestore(id: string) {
    const def = defById.get(id);
    if (!def) return;
    // Move restored card to after the last visible card
    const withoutHidden = layout.filter((item) => item.id !== id);
    const restored: CardLayoutItem = { id, size: def.defaultSize, visible: true };
    // Insert before the first hidden item (or at end)
    const firstHiddenIndex = withoutHidden.findIndex((item) => !item.visible);
    const insertAt = firstHiddenIndex === -1 ? withoutHidden.length : firstHiddenIndex;
    const next = [...withoutHidden.slice(0, insertAt), restored, ...withoutHidden.slice(insertAt)];
    updateLayout(next);
  }

  const visibleItems = layout.filter((item) => item.visible);
  const hiddenItems = layout.filter((item) => !item.visible);

  return (
    <div style={{ display: 'grid', gap: '24px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ flex: 1 }}>{header}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px', flexShrink: 0 }}>
          {saveStatus === 'saving' ? (
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Saving…</span>
          ) : saveStatus === 'saved' ? (
            <span style={{ fontSize: '11px', color: 'var(--sage)' }}>Saved</span>
          ) : saveStatus === 'error' ? (
            <span style={{ fontSize: '11px', color: 'var(--orange)' }}>Save failed</span>
          ) : null}
          <Button
            size="sm"
            variant={customizing ? 'primary' : 'ghost'}
            onClick={() => setCustomizing((c) => !c)}
          >
            {customizing ? 'Done' : 'Customize'}
          </Button>
        </div>
      </div>

      {/* Customizing hint */}
      {customizing ? (
        <div style={{
          background: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 14px',
          fontSize: '12px',
          color: 'var(--muted)',
        }}>
          Drag cards to reorder · Click <strong style={{ color: 'var(--white)' }}>⊞ / ⊡</strong> to change width · Click <strong style={{ color: 'var(--white)' }}>✕</strong> to hide
        </div>
      ) : null}

      {/* Main grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleItems.map((item) => item.id)} strategy={rectSortingStrategy}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '16px',
            }}
          >
            {visibleItems.map((item) => {
              const def = defById.get(item.id);
              if (!def) return null;
              const content = cardContent[item.id];
              return (
                <DashboardCardShell
                  key={item.id}
                  id={item.id}
                  size={item.size}
                  locked={def.locked}
                  allowedSizes={def.allowedSizes}
                  customizing={customizing}
                  onResize={handleResize}
                  onHide={handleHide}
                >
                  {content}
                </DashboardCardShell>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* Hidden cards tray — only visible while customizing */}
      {customizing && hiddenItems.length > 0 ? (
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700,
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}>
            Hidden Cards
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {hiddenItems.map((item) => {
              const def = defById.get(item.id);
              if (!def) return null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRestore(item.id)}
                  style={{
                    background: 'transparent',
                    border: '1.5px dashed var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '10px 16px',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '16px' }}>+</span>
                  {def.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
