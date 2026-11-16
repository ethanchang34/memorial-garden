export type NoteStatus = 'visible' | 'hidden_by_owner';

export type Note = {
  id: string;
  memorialId: string;
  authorId: string;
  authorName: string | null;
  body: string;
  status: NoteStatus;
  createdAt: string;
  editedAt: string | null;
};

export type NoteErrorCode = 'rate_limit' | 'new_account_limit' | 'unknown';

export class NoteError extends Error {
  constructor(readonly code: NoteErrorCode) {
    super(code);
  }
}

export interface NoteRepository {
  list(memorialId: string): Promise<Note[]>;
  create(memorialId: string, authorId: string, body: string): Promise<Note>;
  update(id: string, body: string): Promise<Note>;
  remove(id: string): Promise<void>;
  setHidden(id: string, hidden: boolean): Promise<NoteStatus>;
}

export function visibleCount(notes: readonly Note[]): number {
  return notes.filter((note) => note.status === 'visible').length;
}
