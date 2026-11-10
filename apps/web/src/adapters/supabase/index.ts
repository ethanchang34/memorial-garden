import type { AuthProvider } from '@/core/auth';
import type { ProfileRepository } from '@/core/profile';
import { createSupabaseAuth } from './auth';
import { createSupabaseClient } from './client';
import { createSupabaseProfiles } from './profiles';

export function createSupabaseServices(
  url: string,
  publishableKey: string,
): { auth: AuthProvider; profiles: ProfileRepository } {
  const client = createSupabaseClient(url, publishableKey);
  return { auth: createSupabaseAuth(client), profiles: createSupabaseProfiles(client) };
}
