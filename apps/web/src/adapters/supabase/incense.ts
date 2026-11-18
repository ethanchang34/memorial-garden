import {
  IncenseError,
  NO_INCENSE,
  type IncenseRepository,
  type IncenseState,
} from '@/core/incense';
import type { AppSupabaseClient } from './client';

type IncenseStateRow = { lit_count: number; lit_until: string | null; lit_today: boolean };

function toState(rows: IncenseStateRow[]): IncenseState {
  const row = rows[0];
  if (!row) return NO_INCENSE;
  return { lit: row.lit_count, litUntil: row.lit_until, litToday: row.lit_today };
}

export function createSupabaseIncense(client: AppSupabaseClient): IncenseRepository {
  return {
    async getState(memorialId) {
      const { data, error } = await client.rpc('incense_state', { target_memorial: memorialId });
      if (error) throw new IncenseError('unknown');
      return toState(data);
    },

    async light(memorialId) {
      const { data, error } = await client.rpc('light_incense', { target_memorial: memorialId });
      if (error)
        throw new IncenseError(error.hint === 'incense_daily_limit' ? 'daily_limit' : 'unknown');
      return toState(data);
    },
  };
}
