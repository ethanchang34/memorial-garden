import {
  FlowerError,
  isFlowerType,
  NO_FLOWERS,
  type FlowerRepository,
  type FlowerState,
} from '@/core/flowers';
import type { AppSupabaseClient } from './client';

type FlowerStateRow = { flower_types: string[]; bloom_until: string | null; placed_today: boolean };

function toState(rows: FlowerStateRow[]): FlowerState {
  const row = rows[0];
  if (!row) return NO_FLOWERS;
  return {
    types: row.flower_types.filter(isFlowerType),
    bloomUntil: row.bloom_until,
    placedToday: row.placed_today,
  };
}

export function createSupabaseFlowers(client: AppSupabaseClient): FlowerRepository {
  return {
    async getState(memorialId) {
      const { data, error } = await client.rpc('flower_state', { target_memorial: memorialId });
      if (error) throw new FlowerError('unknown');
      return toState(data);
    },

    async place(memorialId, type) {
      const { data, error } = await client.rpc('place_flower', {
        target_memorial: memorialId,
        chosen_type: type,
      });
      if (error)
        throw new FlowerError(error.hint === 'flower_daily_limit' ? 'daily_limit' : 'unknown');
      return toState(data);
    },
  };
}
