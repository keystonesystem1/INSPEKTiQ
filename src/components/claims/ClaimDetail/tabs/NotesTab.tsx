import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { NoteItem, Role } from '@/lib/types';

export function NotesTab({ notes, role }: { notes: NoteItem[]; role: Role }) {
  const visibleNotes = notes.filter((note) => role === 'carrier' ? note.type === 'shared' : true);

  return (
    <Card>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {['All', 'Shared', 'Internal', 'System'].map((label) => (
          <button key={label} style={{ padding: '5px 10px', borderRadius: '4px', color: label === 'All' ? 'var(--sage)' : 'var(--muted)', background: label === 'All' ? 'var(--sage-dim)' : 'transparent', border: '1px solid var(--border)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {label}
          </button>
        ))}
      </div>
      {visibleNotes.map((note) => (
        <div key={note.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'var(--sage-dim)', color: 'var(--sage)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '10px' }}>{note.initials}</div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500 }}>{note.author}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{note.timestamp}</div>
            </div>
            <Badge tone={note.type === 'internal' ? 'orange' : note.type === 'shared' ? 'blue' : 'faint'}>{note.type}</Badge>
          </div>
          <div style={{ color: 'var(--muted)' }}>{note.content}</div>
        </div>
      ))}
      {role !== 'carrier' ? (
        <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
            <button style={{ padding: '5px 10px', borderRadius: '4px', background: 'var(--sage-dim)', color: 'var(--sage)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Shared</button>
            <button style={{ padding: '5px 10px', borderRadius: '4px', color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Internal Only</button>
          </div>
          <textarea rows={4} placeholder="Post note..." style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '9px 12px', color: 'var(--white)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ color: 'var(--faint)', fontSize: '11px' }}>Shared notes are visible to firm users and the assigned adjuster.</span>
            <Button size="sm">Post Note</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
