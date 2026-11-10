import type { MemorialDate, MemorialInput } from '@memorial-garden/shared';

export type MemorialStatus = 'draft' | 'published' | 'hidden' | 'removed';

export type Memorial = {
  id: string;
  slug: string;
  ownerId: string | null;
  fullName: string;
  born: MemorialDate | null;
  died: MemorialDate;
  epitaph: string | null;
  status: MemorialStatus;
};

export type MemorialErrorCode = 'draft_limit' | 'sharing_closed' | 'unknown';

export class MemorialError extends Error {
  constructor(readonly code: MemorialErrorCode) {
    super(code);
  }
}

export interface MemorialRepository {
  create(ownerId: string, input: MemorialInput): Promise<Memorial>;
  update(id: string, input: MemorialInput): Promise<Memorial>;
  getBySlug(slug: string): Promise<Memorial | null>;
  listMine(ownerId: string): Promise<Memorial[]>;
  publish(id: string): Promise<string>;
}
