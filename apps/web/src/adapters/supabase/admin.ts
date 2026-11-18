import { AdminError, type AdminRepository } from '@/core/admin';
import type { AppSupabaseClient } from './client';

function toError(error: { code?: string; hint?: string | null }): AdminError {
  if (error.code === '42501') return new AdminError('forbidden');
  if (error.hint === 'admin_reason_required') return new AdminError('reason_required');
  return new AdminError('unknown');
}

export function createSupabaseAdmin(client: AppSupabaseClient): AdminRepository {
  return {
    async reportQueue() {
      const { data, error } = await client.rpc('admin_report_queue');
      if (error) throw toError(error);
      return data.map((row) => ({
        noteId: row.note_id,
        body: row.note_body,
        noteStatus: row.note_status,
        noteCreatedAt: row.note_created_at,
        authorName: row.author_name,
        authorStatus: row.author_status,
        memorialSlug: row.memorial_slug,
        memorialName: row.memorial_name,
        reportCount: row.report_count,
        reasons: row.reasons,
        details: row.details,
        firstReportedAt: row.first_reported_at,
      }));
    },

    async resolveNoteReports(noteId, decision, reason) {
      const { data, error } = await client.rpc('admin_resolve_note_reports', {
        target_note: noteId,
        decision,
        reason,
      });
      if (error) throw toError(error);
      return data;
    },
  };
}
