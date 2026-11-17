import { createContext, useContext } from 'react';
import { createSupabaseServices } from '@/adapters/supabase';
import { createTurnstileCaptcha } from '@/adapters/turnstile';
import type { AuthProvider } from '@/core/auth';
import { noCaptcha, type CaptchaProvider } from '@/core/captcha';
import type { CandleRepository } from '@/core/candles';
import type { FlowerRepository } from '@/core/flowers';
import type { MemorialRepository } from '@/core/memorial';
import type { NoteRepository } from '@/core/notes';
import type { ProfileRepository } from '@/core/profile';
import type { StoneRepository } from '@/core/stone';

export type AppServices = {
  auth: AuthProvider;
  profiles: ProfileRepository;
  memorials: MemorialRepository;
  candles: CandleRepository;
  flowers: FlowerRepository;
  notes: NoteRepository;
  stone: StoneRepository;
  captcha: CaptchaProvider;
};

export function createAppServices(): AppServices | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  return {
    ...createSupabaseServices(url, publishableKey),
    captcha: siteKey ? createTurnstileCaptcha(siteKey) : noCaptcha,
  };
}

export const ServicesContext = createContext<AppServices | null>(null);

export function useServices(): AppServices | null {
  return useContext(ServicesContext);
}
