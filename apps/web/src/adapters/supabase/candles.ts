import { CandleError, NO_CANDLES, type CandleRepository, type CandleState } from '@/core/candles';
import type { AppSupabaseClient } from './client';

type CandleStateRow = { lit_count: number; lit_until: string | null; lit_today: boolean };

function toState(rows: CandleStateRow[]): CandleState {
  const row = rows[0];
  if (!row) return NO_CANDLES;
  return { lit: row.lit_count, litUntil: row.lit_until, litToday: row.lit_today };
}

export function createSupabaseCandles(client: AppSupabaseClient): CandleRepository {
  return {
    async getState(memorialId) {
      const { data, error } = await client.rpc('candle_state', { target_memorial: memorialId });
      if (error) throw new CandleError('unknown');
      return toState(data);
    },

    async light(memorialId) {
      const { data, error } = await client.rpc('light_candle', { target_memorial: memorialId });
      if (error)
        throw new CandleError(error.hint === 'candle_daily_limit' ? 'daily_limit' : 'unknown');
      return toState(data);
    },
  };
}
