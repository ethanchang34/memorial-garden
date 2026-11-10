import type { ProfileRepository } from '@/core/profile';

export function createTimeZoneSync(
  profiles: Pick<ProfileRepository, 'setTimeZone'>,
  browserTimeZone: () => string | undefined,
) {
  const synced = new Set<string>();

  return async function syncTimeZone(userId: string): Promise<string | undefined> {
    const timeZone = browserTimeZone();
    if (!timeZone || synced.has(userId)) return undefined;

    synced.add(userId);
    try {
      return await profiles.setTimeZone(timeZone);
    } catch (error) {
      synced.delete(userId);
      throw error;
    }
  };
}

export function browserTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}
