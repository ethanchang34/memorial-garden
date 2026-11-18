import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useServices } from '@/app/services';
import { lightIncense, NO_INCENSE, withNewStick, type IncenseState } from '@/core/incense';
import { browserTimeZone } from '@/core/timeZoneSync';
import { sessionUser, useSession } from '@/features/auth/session';

function incenseKey(memorialId: string) {
  return ['incense', memorialId] as const;
}

function burnKey(memorialId: string) {
  return ['incense', memorialId, 'light'] as const;
}

export function useIncense(memorialId: string) {
  const services = useServices();
  const session = useSession();
  const queryClient = useQueryClient();
  const userId = sessionUser(session)?.id ?? null;
  const lastUser = useRef(userId);

  useEffect(() => {
    if (lastUser.current === userId) return;
    lastUser.current = userId;
    if (queryClient.isMutating({ mutationKey: burnKey(memorialId) }) > 0) return;
    void queryClient.invalidateQueries({ queryKey: incenseKey(memorialId) });
  }, [userId, memorialId, queryClient]);

  return useQuery({
    queryKey: incenseKey(memorialId),
    queryFn: () => (services ? services.incense.getState(memorialId) : NO_INCENSE),
    enabled: Boolean(services) && session.status !== 'loading',
    staleTime: 60_000,
  });
}

export function useLightIncense(memorialId: string) {
  const services = useServices();
  const session = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: burnKey(memorialId),
    mutationFn: () => {
      if (!services) throw new Error('Services unavailable');
      return lightIncense(
        {
          auth: services.auth,
          captcha: services.captcha,
          profiles: services.profiles,
          incense: services.incense,
          timeZone: browserTimeZone,
        },
        sessionUser(session),
        memorialId,
      );
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: incenseKey(memorialId) });
      const before = queryClient.getQueryData<IncenseState>(incenseKey(memorialId));
      queryClient.setQueryData(
        incenseKey(memorialId),
        withNewStick(before ?? NO_INCENSE, new Date()),
      );
      return { before };
    },
    onError: (_error, _variables, context) => {
      if (context?.before) queryClient.setQueryData(incenseKey(memorialId), context.before);
    },
    onSuccess: async (state: IncenseState) => {
      await queryClient.cancelQueries({ queryKey: incenseKey(memorialId) });
      queryClient.setQueryData(incenseKey(memorialId), state);
    },
  });
}
