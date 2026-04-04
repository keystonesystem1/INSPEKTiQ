'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { NoteItem, Role } from '@/lib/types';

type NoteFilter = 'all' | NoteItem['type'];

function getBadgeLabel(type: NoteItem['type']) {
  if (type === 'internal') return 'Internal';
  if (type === 'shared') return 'Shared';
  return 'System';
}

export function NotesTab({ notes, role, claimId }: { notes: NoteItem[]; role: Role; claimId: string }) {
  const router = useRouter();
  const [filter, setFilter] = useState<NoteFilter>('all');
  const [noteType, setNoteType] = useState<'internal' | 'shared'>('shared');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const visibleNotes = useMemo(() => {
    const roleFiltered = notes.filter((note) => (role === 'carrier' ? note.type === 'shared' : true));

    if (filter === 'all') {
      return roleFiltered;
    }

    return roleFiltered.filter((note) => note.type === filter);
  }, [filter, notes, role]);

  return (
    <Card>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {[
          { label: 'All', value: 'all' as const },
          { label: 'Shared', value: 'shared' as const },
          { label: 'Internal', value: 'internal' as const },
          { label: 'System', value: 'system' as const },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            style={{ padding: '5px 10px', borderRadius: '4px', color: filter === item.value ? 'var(--sage)' : 'var(--muted)', background: filter === item.value ? 'var(--sage-dim)' : 'transparent', border: '1px solid var(--border)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            {item.label}
          </button>
        ))}
      </div>
      {visibleNotes.length === 0 ? (
        <div style={{ color: 'var(--muted)', paddingBottom: '12px' }}>No notes yet.</div>
      ) : null}
      {visibleNotes.map((note) => (
        <div key={note.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--sage-dim)', color: 'var(--sage)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '10px' }}>{note.initials}</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500 }}>{note.author}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{note.timestamp}</div>
            </div>
            <Badge tone={note.type === 'internal' ? 'orange' : note.type === 'shared' ? 'blue' : 'faint'}>{getBadgeLabel(note.type)}</Badge>
          </div>
          <div style={{ color: 'var(--muted)' }}>{note.content}</div>
        </div>
      ))}
      {role !== 'carrier' ? (
        <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
            <button
              onClick={() => setNoteType('shared')}
              style={{ padding: '5px 10px', borderRadius: '4px', background: noteType === 'shared' ? 'var(--sage-dim)' : 'transparent', color: noteType === 'shared' ? 'var(--sage)' : 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid var(--border)' }}
            >
              Shared
            </button>
            <button
              onClick={() => setNoteType('internal')}
              style={{ padding: '5px 10px', borderRadius: '4px', background: noteType === 'internal' ? 'var(--sage-dim)' : 'transparent', color: noteType === 'internal' ? 'var(--sage)' : 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', border: '1px solid var(--border)' }}
            >
              Internal Only
            </button>
          </div>
          <textarea rows={4} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Post note..." style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '9px 12px', color: 'var(--white)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ color: 'var(--faint)', fontSize: '11px' }}>Shared notes are visible to firm users and the assigned adjuster.</span>
            <div style={{ display: 'grid', justifyItems: 'end', gap: '6px' }}>
              {error ? <span style={{ color: 'var(--orange)', fontSize: '11px' }}>{error}</span> : null}
              <Button
                size="sm"
                disabled={isPending}
                onClick={() => {
                  const nextContent = content.trim();

                  if (!nextContent) {
                    setError('Note content is required.');
                    return;
                  }

                  setError('');
                  startTransition(async () => {
                    const response = await fetch(`/api/claims/${claimId}/notes`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        noteType,
                        content: nextContent,
                      }),
                    });

                    if (!response.ok) {
                      const payload = (await response.json().catch(() => ({ error: 'Unable to post note.' }))) as {
                        error?: string;
                      };
                      setError(payload.error ?? 'Unable to post note.');
                      return;
                    }

                    setContent('');
                    router.refresh();
                  });
                }}
              >
                Post Note
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
