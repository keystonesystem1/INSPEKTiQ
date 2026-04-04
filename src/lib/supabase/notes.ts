import { createAdminClient } from '@/lib/supabase/admin';
import type { NoteItem } from '@/lib/types';
import { getUserEmailsById } from '@/lib/supabase/adjusters';

interface ClaimNoteRow {
  id: string;
  author_id: string | null;
  note_type: NoteItem['type'];
  content: string;
  created_at: string | null;
}

interface FirmUserRow {
  id: string;
  user_id: string | null;
}

function getInitials(value: string) {
  return value
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'SY';
}

export async function getClaimNotes(claimId: string): Promise<NoteItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('claim_notes')
    .select('id, author_id, note_type, content, created_at')
    .eq('claim_id', claimId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getClaimNotes error:', error);
    return [];
  }

  const notes = (data ?? []) as ClaimNoteRow[];
  const authorIds = notes
    .map((note) => note.author_id)
    .filter((value): value is string => Boolean(value));

  const { data: firmUsers, error: firmUsersError } = await supabase
    .from('firm_users')
    .select('id, user_id')
    .in('id', authorIds);

  if (firmUsersError) {
    console.error('getClaimNotes firmUsers error:', firmUsersError);
  }

  const firmUsersById = new Map(
    ((firmUsers ?? []) as FirmUserRow[]).map((firmUser) => [firmUser.id, firmUser.user_id ?? '']),
  );

  const authUserIds = Array.from(
    new Set(
      Array.from(firmUsersById.values()).filter((value): value is string => Boolean(value)),
    ),
  );
  const emailsByAuthUserId = await getUserEmailsById(authUserIds);

  return notes.map((note) => {
    const authUserId = note.author_id ? firmUsersById.get(note.author_id) ?? '' : '';
    const email = authUserId ? emailsByAuthUserId.get(authUserId) ?? '' : '';
    const author = email || (note.note_type === 'system' ? 'System' : 'Unknown');

    return {
      id: note.id,
      type: note.note_type,
      author,
      initials: author === 'System' ? 'SY' : getInitials(author),
      timestamp: note.created_at
        ? new Date(note.created_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })
        : '',
      content: note.content,
    };
  });
}
