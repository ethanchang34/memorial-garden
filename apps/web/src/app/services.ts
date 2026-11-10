import { createContext, useContext } from 'react';
import { createSupabaseServices } from '@/adapters/supabase';
import type { AuthProvider } from '@/core/auth';
import type { ProfileRepository } from '@/core/profile';

export type AppServices = {
  auth: AuthProvider;
  profiles: ProfileRepository;
};

export function createAppServices(): AppServices | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return createSupabaseServices(url, publishableKey);
}

export const ServicesContext = createContext<AppServices | null>(null);

export function useServices(): AppServices | null {
  return useContext(ServicesContext);
}
