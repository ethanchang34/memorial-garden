import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useServices } from '@/app/services';
import { browserTimeZone, createTimeZoneSync } from '@/core/timeZoneSync';
import { myProfileQueryKey } from '@/features/profile/useMyProfile';
import { SessionContext, sessionUser, type Session } from './session';

export function SessionProvider({ children }: { children: ReactNode }) {
  const services = useServices();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session>(
    services ? { status: 'loading' } : { status: 'unavailable' },
  );

  const syncTimeZone = useMemo(
    () => (services ? createTimeZoneSync(services.profiles, browserTimeZone) : null),
    [services],
  );

  useEffect(() => {
    if (!services) return;
    services.auth.resumeSignIn(window.location.href).catch(() => undefined);
  }, [services]);

  useEffect(() => {
    if (!services) return undefined;
    return services.auth.onChange((user) => {
      setSession(
        user
          ? { status: user.isAnonymous ? 'visitor' : 'signed-in', user }
          : { status: 'signed-out' },
      );
      if (!user) queryClient.removeQueries({ queryKey: ['profile'] });
    });
  }, [services, queryClient]);

  const userId = sessionUser(session)?.id ?? null;

  useEffect(() => {
    if (!userId || !syncTimeZone) return;
    syncTimeZone(userId)
      .then((timeZone) => {
        if (timeZone) void queryClient.invalidateQueries({ queryKey: myProfileQueryKey(userId) });
      })
      .catch(() => undefined);
  }, [userId, syncTimeZone, queryClient]);

  return <SessionContext value={session}>{children}</SessionContext>;
}
