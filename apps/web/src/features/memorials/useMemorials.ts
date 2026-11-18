import type { MemorialInput } from '@memorial-garden/shared';
import type { Memorial } from '@/core/memorial';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { useSession } from '@/features/auth/session';

const memorialKey = (slug: string) => ['memorial', slug] as const;
const myMemorialsKey = (userId: string) => ['memorials', 'mine', userId] as const;

function useUserId() {
  const session = useSession();
  return session.status === 'signed-in' ? session.user.id : null;
}

export function useMemorial(slug: string) {
  const services = useServices();
  const userId = useUserId();
  return useQuery({
    queryKey: [...memorialKey(slug), userId],
    queryFn: () => {
      if (!services) throw new Error('Unavailable');
      return services.memorials.getBySlug(slug);
    },
    enabled: Boolean(services),
  });
}

export function useMyMemorials() {
  const services = useServices();
  const userId = useUserId();
  return useQuery({
    queryKey: myMemorialsKey(userId ?? 'none'),
    queryFn: () => {
      if (!services || !userId) throw new Error('Not signed in');
      return services.memorials.listMine(userId);
    },
    enabled: Boolean(services && userId),
  });
}

export function useCreateMemorial() {
  const services = useServices();
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MemorialInput) => {
      if (!services || !userId) throw new Error('Not signed in');
      return services.memorials.create(userId, input);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memorials', 'mine'] }),
  });
}

export function usePublishMemorial(slug: string) {
  const services = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!services) throw new Error('Unavailable');
      return services.memorials.publish(id);
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: memorialKey(slug) }),
        queryClient.invalidateQueries({ queryKey: ['memorials', 'mine'] }),
      ]),
  });
}

export function useUpdateMemorial(slug: string) {
  const services = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MemorialInput }) => {
      if (!services) throw new Error('Unavailable');
      return services.memorials.update(id, input);
    },
    onSuccess: (memorial: Memorial) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: memorialKey(slug) }),
        queryClient.invalidateQueries({ queryKey: memorialKey(memorial.slug) }),
        queryClient.invalidateQueries({ queryKey: ['memorials', 'mine'] }),
      ]),
  });
}

export function useUpdateLifeStory(slug: string) {
  const services = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, story }: { id: string; story: string | null }) => {
      if (!services) throw new Error('Unavailable');
      return services.memorials.updateLifeStory(id, story);
    },
    onSuccess: (memorial: Memorial) => {
      queryClient.setQueriesData({ queryKey: memorialKey(slug) }, memorial);
    },
  });
}
