import {
  FlowerError,
  isFlowerType,
  NO_FLOWERS,
  type FlowerCredit,
  type FlowerErrorCode,
  type FlowerRepository,
  type FlowerState,
} from '@/core/flowers';
import type { AppSupabaseClient } from './client';

type FlowerStateRow = { flower_types: string[]; bloom_until: string | null; placed_today: boolean };

type FlowerCreditRow = {
  stem: number;
  flower_id: string;
  flower_type: string;
  giver_name: string | null;
  placed_at: string;
  message: string | null;
  message_hidden: boolean;
  mine: boolean;
};

const HINTS: Record<string, FlowerErrorCode> = {
  flower_daily_limit: 'daily_limit',
  flower_message_needs_account: 'message_needs_account',
  flower_message_invalid: 'message_invalid',
  flower_undo_expired: 'undo_expired',
};

function toError(error: { hint?: string | null }): FlowerError {
  return new FlowerError((error.hint && HINTS[error.hint]) || 'unknown');
}

function toState(rows: FlowerStateRow[]): FlowerState {
  const row = rows[0];
  if (!row) return NO_FLOWERS;
  return {
    types: row.flower_types.filter(isFlowerType),
    bloomUntil: row.bloom_until,
    placedToday: row.placed_today,
  };
}

function toCredit(row: FlowerCreditRow): FlowerCredit | null {
  if (!isFlowerType(row.flower_type)) return null;
  return {
    stem: row.stem,
    id: row.flower_id,
    type: row.flower_type,
    giverName: row.giver_name,
    placedAt: row.placed_at,
    message: row.message,
    messageHidden: row.message_hidden,
    mine: row.mine,
  };
}

export function createSupabaseFlowers(client: AppSupabaseClient): FlowerRepository {
  return {
    async getState(memorialId) {
      const { data, error } = await client.rpc('flower_state', { target_memorial: memorialId });
      if (error) throw new FlowerError('unknown');
      return toState(data);
    },

    async place(memorialId, type, message) {
      const { data, error } = await client.rpc('place_flower', {
        target_memorial: memorialId,
        chosen_type: type,
        ...(message ? { note: message } : {}),
      });
      if (error) throw toError(error);
      return toState(data);
    },

    async undo(memorialId) {
      const { data, error } = await client.rpc('undo_flower', { target_memorial: memorialId });
      if (error) throw toError(error);
      return toState(data);
    },

    async credits(memorialId) {
      const { data, error } = await client.rpc('flower_credits', { target_memorial: memorialId });
      if (error) throw new FlowerError('unknown');
      return data.map(toCredit).filter((credit) => credit !== null);
    },

    async setMessageHidden(flowerId, hidden) {
      const { data, error } = await client.rpc('set_flower_message_hidden', {
        target_flower: flowerId,
        hidden,
      });
      if (error) throw new FlowerError('unknown');
      return data;
    },
  };
}
