import type { ReportReason } from '@memorial-garden/shared';
import { useMutation } from '@tanstack/react-query';
import { useServices } from '@/app/services';

export function useReportNote() {
  const services = useServices();
  return useMutation({
    mutationFn: ({
      noteId,
      reason,
      details,
    }: {
      noteId: string;
      reason: ReportReason;
      details: string | null;
    }) => {
      if (!services) throw new Error('Services unavailable');
      return services.reports.reportNote(noteId, reason, details);
    },
  });
}
