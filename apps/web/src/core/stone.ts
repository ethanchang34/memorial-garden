import type { AuthUser } from './auth';
import { ensureVisitor, type VisitorDeps } from './visitor';

export type StoneState = {
  dirtySince: string | null;
  cleanedToday: boolean;
};

export const UNKNOWN_STONE: StoneState = { dirtySince: null, cleanedToday: false };

export type StoneErrorCode = 'daily_limit' | 'unknown';

export class StoneError extends Error {
  constructor(readonly code: StoneErrorCode) {
    super(code);
  }
}

export interface StoneRepository {
  getState(memorialId: string): Promise<StoneState>;
  clean(memorialId: string): Promise<StoneState>;
}

export type CleanStoneDeps = VisitorDeps & { stone: Pick<StoneRepository, 'clean'> };

export async function cleanStone(
  deps: CleanStoneDeps,
  user: AuthUser | null,
  memorialId: string,
): Promise<StoneState> {
  await ensureVisitor(deps, user);
  return deps.stone.clean(memorialId);
}
