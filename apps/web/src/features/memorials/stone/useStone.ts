import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useServices } from '@/app/services';
import { cleanStone, UNKNOWN_STONE, type StoneState } from '@/core/stone';
import { browserTimeZone } from '@/core/timeZoneSync';
import { sessionUser, useSession } from '@/features/auth/session';

function stoneKey(memorialId: string) {
  return ['stone', memorialId] as const;
}

function cleanKey(memorialId: string) {
  return ['stone', memorialId, 'clean'] as const;
}

export function useStone(memorialId: string) {
  const services = useServices();
  const session = useSession();
  const queryClient = useQueryClient();
  const userId = sessionUser(session)?.id ?? null;
  const lastUser = useRef(userId);

  useEffect(() => {
    if (lastUser.current === userId) return;
    lastUser.current = userId;
    if (queryClient.isMutating({ mutationKey: cleanKey(memorialId) }) > 0) return;
    void queryClient.invalidateQueries({ queryKey: stoneKey(memorialId) });
  }, [userId, memorialId, queryClient]);

  return useQuery({
    queryKey: stoneKey(memorialId),
    queryFn: () => (services ? services.stone.getState(memorialId) : UNKNOWN_STONE),
    enabled: Boolean(services) && session.status !== 'loading',
    staleTime: 60_000,
  });
}

export function useCleanStone(memorialId: string) {
  const services = useServices();
  const session = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: cleanKey(memorialId),
    mutationFn: () => {
      if (!services) throw new Error('Services unavailable');
      return cleanStone(
        {
          auth: services.auth,
          captcha: services.captcha,
          profiles: services.profiles,
          stone: services.stone,
          timeZone: browserTimeZone,
        },
        sessionUser(session),
        memorialId,
      );
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: stoneKey(memorialId) });
      const before = queryClient.getQueryData<StoneState>(stoneKey(memorialId));
      queryClient.setQueryData(stoneKey(memorialId), {
        dirtySince: new Date().toISOString(),
        cleanedToday: true,
      });
      return { before };
    },
    onError: (_error, _variables, context) => {
      if (context?.before) queryClient.setQueryData(stoneKey(memorialId), context.before);
    },
    onSuccess: async (state: StoneState) => {
      await queryClient.cancelQueries({ queryKey: stoneKey(memorialId) });
      queryClient.setQueryData(stoneKey(memorialId), state);
    },
  });
}
