import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServices } from '@/app/services';
import { useSession } from '@/features/auth/session';

export function myProfileQueryKey(userId: string) {
  return ['profile', userId] as const;
}

export function useMyProfile() {
  const services = useServices();
  const session = useSession();
  const userId = session.status === 'signed-in' ? session.user.id : null;

  return useQuery({
    queryKey: myProfileQueryKey(userId ?? 'none'),
    queryFn: () => {
      if (!services || !userId) throw new Error('Not signed in');
      return services.profiles.getMine(userId);
    },
    enabled: Boolean(services && userId),
    staleTime: 60_000,
  });
}

export function useUpdateDisplayName() {
  const services = useServices();
  const session = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayName: string) => {
      if (!services || session.status !== 'signed-in') throw new Error('Not signed in');
      return services.profiles.updateDisplayName(session.user.id, displayName);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(myProfileQueryKey(profile.id), profile);
    },
  });
}
