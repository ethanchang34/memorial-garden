import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { AdminDecision } from '@/core/admin';
import { useSession } from '@/features/auth/session';

const queueKey = ['admin', 'reports'] as const;

export function useReportQueue() {
  const services = useServices();
  const session = useSession();
  return useQuery({
    queryKey: queueKey,
    queryFn: () => {
      if (!services) throw new Error('Unavailable');
      return services.admin.reportQueue();
    },
    enabled: Boolean(services) && session.status === 'signed-in',
    retry: false,
  });
}

export function useResolveReports() {
  const services = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { noteId: string; decision: AdminDecision; reason: string }) => {
      if (!services) throw new Error('Unavailable');
      return services.admin.resolveNoteReports(input.noteId, input.decision, input.reason);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queueKey }),
  });
}
