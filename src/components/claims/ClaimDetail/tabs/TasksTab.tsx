'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string | null;
}

const LABEL_STYLE = {
  fontFamily: 'Barlow Condensed, sans-serif',
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: 'var(--muted)',
};

export function TasksTab({ claimId }: { claimId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', dueDate: '' });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/claims/${claimId}/tasks`);
        const json = await res.json() as { tasks?: Task[]; error?: string };
        if (!res.ok) throw new Error(json.error ?? 'Failed to load tasks');
        setTasks(json.tasks ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    })();
  }, [claimId]);

  async function handleToggle(task: Task) {
    setTogglingId(task.id);
    try {
      const res = await fetch(`/api/claims/${claimId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      const json = await res.json() as { task?: Task; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to update task');
      setTasks((prev) => prev.map((t) => (t.id === task.id ? json.task! : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleAdd() {
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/claims/${claimId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: form.title.trim(), dueDate: form.dueDate || null }),
      });
      const json = await res.json() as { task?: Task; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Failed to save task');
      setTasks((prev) => [...prev, json.task!]);
      setForm({ title: '', dueDate: '' });
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card><div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>Loading…</div></Card>;

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={LABEL_STYLE}>Tasks</div>
        {!adding ? (
          <Button size="sm" variant="ghost" onClick={() => setAdding(true)}>+ Add Task</Button>
        ) : null}
      </div>

      {error ? <div style={{ color: 'var(--orange)', fontSize: '12px', marginBottom: '10px' }}>{error}</div> : null}

      {tasks.length === 0 && !adding ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--muted)' }}>No tasks yet.</div>
      ) : (
        tasks.map((task) => (
          <div key={task.id} style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
            <button
              type="button"
              onClick={() => void handleToggle(task)}
              disabled={togglingId === task.id}
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '4px',
                border: `1.5px solid ${task.completed ? 'var(--sage)' : 'var(--border)'}`,
                background: task.completed ? 'var(--sage)' : 'transparent',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              {task.completed ? <span style={{ color: 'var(--surface)', fontSize: '11px', lineHeight: 1 }}>✓</span> : null}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? 'var(--muted)' : 'var(--white)' }}>
                {task.title}
              </div>
              {task.due_date ? (
                <div style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}>
                  Due {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ) : null}
            </div>
            <Badge tone={task.completed ? 'sage' : 'orange'}>{task.completed ? 'Done' : 'Open'}</Badge>
          </div>
        ))
      )}

      {adding ? (
        <div style={{ marginTop: '14px', display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              placeholder="Task title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleAdd(); }}
              autoFocus
            />
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px', color: 'var(--white)', fontSize: '13px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="primary" onClick={() => void handleAdd()} disabled={saving || !form.title.trim()}>
              {saving ? 'Saving…' : 'Add Task'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)} disabled={saving}>Cancel</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
