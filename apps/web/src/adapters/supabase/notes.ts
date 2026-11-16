import { NoteError, type Note, type NoteRepository, type NoteStatus } from '@/core/notes';
import type { AppSupabaseClient } from './client';

const COLUMNS = 'id, memorial_id, author_id, body, status, created_at, edited_at';

type NoteRow = {
  id: string;
  memorial_id: string;
  author_id: string;
  body: string;
  status: NoteStatus | 'removed';
  created_at: string;
  edited_at: string | null;
};

function toNote(row: NoteRow, names: Map<string, string>): Note {
  return {
    id: row.id,
    memorialId: row.memorial_id,
    authorId: row.author_id,
    authorName: names.get(row.author_id) ?? null,
    body: row.body,
    status: row.status === 'hidden_by_owner' ? 'hidden_by_owner' : 'visible',
    createdAt: row.created_at,
    editedAt: row.edited_at,
  };
}

function toError(error: { hint?: string | null }): NoteError {
  if (error.hint === 'note_rate_limit') return new NoteError('rate_limit');
  if (error.hint === 'note_new_account_limit') return new NoteError('new_account_limit');
  return new NoteError('unknown');
}

export function createSupabaseNotes(client: AppSupabaseClient): NoteRepository {
  async function namesFor(authorIds: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(authorIds)];
    const names = new Map<string, string>();
    for (let start = 0; start < unique.length; start += 100) {
      const { data, error } = await client.rpc('public_display_names', {
        user_ids: unique.slice(start, start + 100),
      });
      if (error) throw toError(error);
      for (const row of data) names.set(row.id, row.display_name);
    }
    return names;
  }

  async function one(row: NoteRow): Promise<Note> {
    return toNote(row, await namesFor([row.author_id]));
  }

  return {
    async list(memorialId) {
      const { data, error } = await client
        .from('notes')
        .select(COLUMNS)
        .eq('memorial_id', memorialId)
        .neq('status', 'removed')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw toError(error);
      const names = data.length ? await namesFor(data.map((row) => row.author_id)) : new Map();
      return data.map((row) => toNote(row, names));
    },

    async create(memorialId, authorId, body) {
      const { data, error } = await client
        .from('notes')
        .insert({ memorial_id: memorialId, author_id: authorId, body })
        .select(COLUMNS)
        .single();
      if (error) throw toError(error);
      return one(data);
    },

    async update(id, body) {
      const { data, error } = await client
        .from('notes')
        .update({ body })
        .eq('id', id)
        .select(COLUMNS)
        .single();
      if (error) throw toError(error);
      return one(data);
    },

    async remove(id) {
      const { error } = await client.from('notes').delete().eq('id', id);
      if (error) throw toError(error);
    },

    async setHidden(id, hidden) {
      const { data, error } = await client.rpc('set_note_hidden', { note_id: id, hidden });
      if (error) throw toError(error);
      return data === 'hidden_by_owner' ? 'hidden_by_owner' : 'visible';
    },
  };
}
