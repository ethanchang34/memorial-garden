import type { AuthUser } from './auth';
import { ensureVisitor, type VisitorDeps } from './visitor';

export const INCENSE_MAX = 3;
export const INCENSE_BURN_MS = 24 * 3_600_000;

export type IncenseState = {
  lit: number;
  litUntil: string | null;
  litToday: boolean;
};

export const NO_INCENSE: IncenseState = { lit: 0, litUntil: null, litToday: false };

export function withNewStick(state: IncenseState, now: Date): IncenseState {
  const burning = state.litUntil !== null && Date.parse(state.litUntil) > now.getTime();
  return {
    lit: burning ? Math.min(INCENSE_MAX, state.lit + 1) : 1,
    litUntil: new Date(now.getTime() + INCENSE_BURN_MS).toISOString(),
    litToday: true,
  };
}

export type IncenseErrorCode = 'daily_limit' | 'unknown';

export class IncenseError extends Error {
  constructor(readonly code: IncenseErrorCode) {
    super(code);
  }
}

export interface IncenseRepository {
  getState(memorialId: string): Promise<IncenseState>;
  light(memorialId: string): Promise<IncenseState>;
}

export type LightIncenseDeps = VisitorDeps & { incense: Pick<IncenseRepository, 'light'> };

export async function lightIncense(
  deps: LightIncenseDeps,
  user: AuthUser | null,
  memorialId: string,
): Promise<IncenseState> {
  await ensureVisitor(deps, user);
  return deps.incense.light(memorialId);
}
