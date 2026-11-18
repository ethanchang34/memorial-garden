import { ReportError, type ReportErrorCode, type ReportRepository } from '@/core/reports';
import type { AppSupabaseClient } from './client';

const HINTS: Record<string, ReportErrorCode> = {
  already_reported: 'already_reported',
  report_rate_limit: 'rate_limit',
  report_needs_account: 'needs_account',
};

export function createSupabaseReports(client: AppSupabaseClient): ReportRepository {
  return {
    async reportNote(noteId, reason, details) {
      const { error } = await client.rpc('report_content', {
        target_type: 'note',
        target_id: noteId,
        reason,
        ...(details ? { details } : {}),
      });
      if (error) throw new ReportError((error.hint && HINTS[error.hint]) || 'unknown');
    },
  };
}
