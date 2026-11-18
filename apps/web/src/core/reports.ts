import type { ReportReason } from '@memorial-garden/shared';

export type ReportErrorCode = 'already_reported' | 'rate_limit' | 'needs_account' | 'unknown';

export class ReportError extends Error {
  constructor(readonly code: ReportErrorCode) {
    super(code);
  }
}

export interface ReportRepository {
  reportNote(noteId: string, reason: ReportReason, details: string | null): Promise<void>;
}
