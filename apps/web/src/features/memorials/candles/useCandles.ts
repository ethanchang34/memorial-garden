import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useServices } from '@/app/services';
import { lightCandle, NO_CANDLES, type CandleState } from '@/core/candles';
import { browserTimeZone } from '@/core/timeZoneSync';
import { sessionUser, useSession } from '@/features/auth/session';

function candleKey(memorialId: string) {
  return ['candles', memorialId] as const;
}

export function useCandles(memorialId: string) {
  const services = useServices();
  const session = useSession();
  const queryClient = useQueryClient();
  const userId = sessionUser(session)?.id ?? null;
  const lastUser = useRef(userId);

  useEffect(() => {
    if (lastUser.current === userId) return;
    lastUser.current = userId;
    void queryClient.invalidateQueries({ queryKey: candleKey(memorialId) });
  }, [userId, memorialId, queryClient]);

  return useQuery({
    queryKey: candleKey(memorialId),
    queryFn: () => (services ? services.candles.getState(memorialId) : NO_CANDLES),
    enabled: Boolean(services) && session.status !== 'loading',
    staleTime: 60_000,
  });
}

export function useLightCandle(memorialId: string) {
  const services = useServices();
  const session = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!services) throw new Error('Services unavailable');
      return lightCandle(
        {
          auth: services.auth,
          captcha: services.captcha,
          profiles: services.profiles,
          candles: services.candles,
          timeZone: browserTimeZone,
        },
        sessionUser(session),
        memorialId,
      );
    },
    onSuccess: async (state: CandleState) => {
      await queryClient.cancelQueries({ queryKey: candleKey(memorialId) });
      queryClient.setQueryData(candleKey(memorialId), state);
    },
  });
}
