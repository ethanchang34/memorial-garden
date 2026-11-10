import type { AuthProvider } from '@/core/auth';
import type { MemorialRepository } from '@/core/memorial';
import type { ProfileRepository } from '@/core/profile';
import { createSupabaseAuth } from './auth';
import { createSupabaseClient } from './client';
import { createSupabaseMemorials } from './memorials';
import { createSupabaseProfiles } from './profiles';

export function createSupabaseServices(
  url: string,
  publishableKey: string,
): { auth: AuthProvider; profiles: ProfileRepository; memorials: MemorialRepository } {
  const client = createSupabaseClient(url, publishableKey);
  return {
    auth: createSupabaseAuth(client),
    profiles: createSupabaseProfiles(client),
    memorials: createSupabaseMemorials(client),
  };
}
