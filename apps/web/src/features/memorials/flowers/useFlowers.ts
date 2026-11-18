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

function creditsKey(memorialId: string) {
  return ['flower-credits', memorialId] as const;
}

export type PlaceFlowerInput = { type: FlowerType; message: string | null };

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
    mutationFn: ({ type, message }: PlaceFlowerInput) => {
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
        message,
      );
    },
    onMutate: async ({ type }: PlaceFlowerInput) => {
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
      void queryClient.invalidateQueries({ queryKey: creditsKey(memorialId) });
    },
  });
}

export function useUndoFlower(memorialId: string) {
  const services = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!services) throw new Error('Services unavailable');
      return services.flowers.undo(memorialId);
    },
    onSuccess: (state: FlowerState) => {
      queryClient.setQueryData(flowerKey(memorialId), state);
      void queryClient.invalidateQueries({ queryKey: creditsKey(memorialId) });
    },
  });
}

export function useFlowerCredits(memorialId: string, enabled: boolean) {
  const services = useServices();
  const session = useSession();
  const userId = sessionUser(session)?.id ?? null;
  return useQuery({
    queryKey: [...creditsKey(memorialId), userId],
    queryFn: () => (services ? services.flowers.credits(memorialId) : []),
    enabled: Boolean(services) && enabled && session.status !== 'loading',
    staleTime: 60_000,
  });
}

export function useSetFlowerMessageHidden(memorialId: string) {
  const services = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hidden }: { id: string; hidden: boolean }) => {
      if (!services) throw new Error('Services unavailable');
      return services.flowers.setMessageHidden(id, hidden);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: creditsKey(memorialId) }),
  });
}
