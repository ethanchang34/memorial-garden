import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import type { Note } from '@/core/notes';
import { sessionUser, useSession } from '@/features/auth/session';

function notesKey(memorialId: string) {
  return ['notes', memorialId] as const;
}

export function useNotes(memorialId: string) {
  const services = useServices();
  const session = useSession();
  const userId = sessionUser(session)?.id ?? 'none';

  return useQuery({
    queryKey: [...notesKey(memorialId), userId],
    queryFn: () => (services ? services.notes.list(memorialId) : Promise.resolve([] as Note[])),
    enabled: Boolean(services) && session.status !== 'loading',
    staleTime: 30_000,
  });
}

export function useNoteActions(memorialId: string) {
  const services = useServices();
  const session = useSession();
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: notesKey(memorialId) });

  function member() {
    if (!services || session.status !== 'signed-in') throw new Error('Not signed in');
    return { notes: services.notes, userId: session.user.id };
  }

  return {
    create: useMutation({
      mutationFn: (body: string) => {
        const { notes, userId } = member();
        return notes.create(memorialId, userId, body);
      },
      onSuccess: refresh,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: string }) => member().notes.update(id, body),
      onSuccess: refresh,
    }),
    remove: useMutation({
      mutationFn: (id: string) => member().notes.remove(id),
      onSuccess: refresh,
    }),
    setHidden: useMutation({
      mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) =>
        member().notes.setHidden(id, hidden),
      onSuccess: refresh,
    }),
  };
}
