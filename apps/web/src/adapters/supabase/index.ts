import type { AuthProvider } from '@/core/auth';
import type { CandleRepository } from '@/core/candles';
import type { MemorialRepository } from '@/core/memorial';
import type { NoteRepository } from '@/core/notes';
import type { ProfileRepository } from '@/core/profile';
import type { StoneRepository } from '@/core/stone';
import { createSupabaseAuth } from './auth';
import { createSupabaseCandles } from './candles';
import { createSupabaseClient } from './client';
import { createSupabaseMemorials } from './memorials';
import { createSupabaseNotes } from './notes';
import { createSupabaseProfiles } from './profiles';
import { createSupabaseStone } from './stone';

export function createSupabaseServices(
  url: string,
  publishableKey: string,
): {
  auth: AuthProvider;
  profiles: ProfileRepository;
  memorials: MemorialRepository;
  candles: CandleRepository;
  notes: NoteRepository;
  stone: StoneRepository;
} {
  const client = createSupabaseClient(url, publishableKey);
  return {
    auth: createSupabaseAuth(client),
    profiles: createSupabaseProfiles(client),
    memorials: createSupabaseMemorials(client),
    candles: createSupabaseCandles(client),
    notes: createSupabaseNotes(client),
    stone: createSupabaseStone(client),
  };
}
