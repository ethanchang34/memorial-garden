import { StoneError, UNKNOWN_STONE, type StoneRepository, type StoneState } from '@/core/stone';
import type { AppSupabaseClient } from './client';

type StoneStateRow = { dirty_since: string | null; cleaned_today: boolean };

function toState(rows: StoneStateRow[]): StoneState {
  const row = rows[0];
  if (!row) return UNKNOWN_STONE;
  return { dirtySince: row.dirty_since, cleanedToday: row.cleaned_today };
}

export function createSupabaseStone(client: AppSupabaseClient): StoneRepository {
  return {
    async getState(memorialId) {
      const { data, error } = await client.rpc('stone_state', { target_memorial: memorialId });
      if (error) throw new StoneError('unknown');
      return toState(data);
    },

    async clean(memorialId) {
      const { data, error } = await client.rpc('clean_stone', { target_memorial: memorialId });
      if (error)
        throw new StoneError(error.hint === 'stone_daily_limit' ? 'daily_limit' : 'unknown');
      return toState(data);
    },
  };
}
