import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useServices } from '@/app/services';
import {
  NO_FLOWERS,
  placeFlower,
  withNewFlower,
  type FlowerState,
  type FlowerType,
} from '@/core/flowers';
import { browserTimeZone } from '@/core/timeZoneSync';
import { sessionUser, useSession } from '@/features/auth/session';

function flowerKey(memorialId: string) {
  return ['flowers', memorialId] as const;
}

function placeKey(memorialId: string) {
  return ['flowers', memorialId, 'place'] as const;
}

export function useFlowers(memorialId: string) {
  const services = useServices();
  const session = useSession();
  const queryClient = useQueryClient();
  const userId = sessionUser(session)?.id ?? null;
  const lastUser = useRef(userId);

  useEffect(() => {
    if (lastUser.current === userId) return;
    lastUser.current = userId;
    if (queryClient.isMutating({ mutationKey: placeKey(memorialId) }) > 0) return;
    void queryClient.invalidateQueries({ queryKey: flowerKey(memorialId) });
  }, [userId, memorialId, queryClient]);

  return useQuery({
    queryKey: flowerKey(memorialId),
    queryFn: () => (services ? services.flowers.getState(memorialId) : NO_FLOWERS),
    enabled: Boolean(services) && session.status !== 'loading',
    staleTime: 60_000,
  });
}

export function usePlaceFlower(memorialId: string) {
  const services = useServices();
  const session = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: placeKey(memorialId),
    mutationFn: (type: FlowerType) => {
      if (!services) throw new Error('Services unavailable');
      return placeFlower(
        {
          auth: services.auth,
          captcha: services.captcha,
          profiles: services.profiles,
          flowers: services.flowers,
          timeZone: browserTimeZone,
        },
        sessionUser(session),
        memorialId,
        type,
      );
    },
    onMutate: async (type: FlowerType) => {
      await queryClient.cancelQueries({ queryKey: flowerKey(memorialId) });
      const before = queryClient.getQueryData<FlowerState>(flowerKey(memorialId));
      queryClient.setQueryData(
        flowerKey(memorialId),
        withNewFlower(before ?? NO_FLOWERS, type, new Date()),
      );
      return { before };
    },
    onError: (_error, _type, context) => {
      if (context?.before) queryClient.setQueryData(flowerKey(memorialId), context.before);
    },
    onSuccess: async (state: FlowerState) => {
      await queryClient.cancelQueries({ queryKey: flowerKey(memorialId) });
      queryClient.setQueryData(flowerKey(memorialId), state);
    },
  });
}
