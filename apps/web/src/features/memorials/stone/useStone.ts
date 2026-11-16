import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useServices } from '@/app/services';
import { cleanStone, UNKNOWN_STONE, type StoneState } from '@/core/stone';
import { browserTimeZone } from '@/core/timeZoneSync';
import { sessionUser, useSession } from '@/features/auth/session';

function stoneKey(memorialId: string) {
  return ['stone', memorialId] as const;
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
    onSuccess: async (state: StoneState) => {
      await queryClient.cancelQueries({ queryKey: stoneKey(memorialId) });
      queryClient.setQueryData(stoneKey(memorialId), state);
    },
  });
}
