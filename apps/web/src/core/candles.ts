import type { AuthUser } from './auth';
import { ensureVisitor, type VisitorDeps } from './visitor';

export const CANDLE_CLUSTER_MAX = 15;

export type CandleState = {
  lit: number;
  litUntil: string | null;
  litToday: boolean;
};

export const NO_CANDLES: CandleState = { lit: 0, litUntil: null, litToday: false };

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
