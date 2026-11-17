import type { AuthUser } from './auth';
import { ensureVisitor, type VisitorDeps } from './visitor';

export const CANDLE_CLUSTER_MAX = 15;

export type CandleState = {
  lit: number;
  litUntil: string | null;
  litToday: boolean;
};

export const NO_CANDLES: CandleState = { lit: 0, litUntil: null, litToday: false };

export const CANDLE_BURN_MS = 3 * 86_400_000;

export function withNewCandle(state: CandleState, now: Date): CandleState {
  const burning = state.litUntil !== null && Date.parse(state.litUntil) > now.getTime();
  return {
    lit: burning ? Math.min(CANDLE_CLUSTER_MAX, state.lit + 1) : 1,
    litUntil: new Date(now.getTime() + CANDLE_BURN_MS).toISOString(),
    litToday: true,
  };
}

export type CandleErrorCode = 'daily_limit' | 'unknown';

export class CandleError extends Error {
  constructor(readonly code: CandleErrorCode) {
    super(code);
  }
}

export interface CandleRepository {
  getState(memorialId: string): Promise<CandleState>;
  light(memorialId: string): Promise<CandleState>;
}

export type LightCandleDeps = VisitorDeps & { candles: Pick<CandleRepository, 'light'> };

export async function lightCandle(
  deps: LightCandleDeps,
  user: AuthUser | null,
  memorialId: string,
): Promise<CandleState> {
  await ensureVisitor(deps, user);
  return deps.candles.light(memorialId);
}
