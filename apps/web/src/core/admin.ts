export const ADMIN_DECISIONS = ['dismiss', 'remove', 'remove_and_suspend'] as const;
export type AdminDecision = (typeof ADMIN_DECISIONS)[number];
export const ADMIN_REASON_MAX_LENGTH = 500;

export type ReportedNote = {
  noteId: string;
  body: string;
  noteStatus: string;
  noteCreatedAt: string;
  authorName: string | null;
  authorStatus: string | null;
  memorialSlug: string;
  memorialName: string;
  reportCount: number;
  reasons: string[];
  details: string[];
  firstReportedAt: string;
};

export class AdminError extends Error {
  constructor(readonly code: 'forbidden' | 'reason_required' | 'unknown') {
    super(code);
  }
}

export interface AdminRepository {
  reportQueue(): Promise<ReportedNote[]>;
  resolveNoteReports(noteId: string, decision: AdminDecision, reason: string): Promise<number>;
}
