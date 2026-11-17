import type { AuthUser } from './auth';
import { ensureVisitor, type VisitorDeps } from './visitor';

export const FLOWER_TYPES = ['rose', 'tulip', 'daisy', 'poppy'] as const;
export type FlowerType = (typeof FLOWER_TYPES)[number];

export const STEMS_PER_VASE = 5;
export const VASE_COUNT = 3;
export const FLOWER_MAX = STEMS_PER_VASE * VASE_COUNT;
export const FLOWER_BLOOM_MS = 14 * 86_400_000;

export type FlowerState = {
  types: FlowerType[];
  bloomUntil: string | null;
  placedToday: boolean;
};

export const NO_FLOWERS: FlowerState = { types: [], bloomUntil: null, placedToday: false };

export function isFlowerType(value: string): value is FlowerType {
  return (FLOWER_TYPES as readonly string[]).includes(value);
}

export function withNewFlower(state: FlowerState, type: FlowerType, now: Date): FlowerState {
  const blooming = state.bloomUntil !== null && Date.parse(state.bloomUntil) > now.getTime();
  const current = blooming ? state.types : [];
  return {
    types: current.length >= FLOWER_MAX ? current : [...current, type],
    bloomUntil: new Date(now.getTime() + FLOWER_BLOOM_MS).toISOString(),
    placedToday: true,
  };
}

export function vasesShown(count: number): number {
  return Math.min(VASE_COUNT, Math.floor(Math.max(0, count) / STEMS_PER_VASE) + 1);
}

export type FlowerErrorCode = 'daily_limit' | 'unknown';

export class FlowerError extends Error {
  constructor(readonly code: FlowerErrorCode) {
    super(code);
  }
}

export interface FlowerRepository {
  getState(memorialId: string): Promise<FlowerState>;
  place(memorialId: string, type: FlowerType): Promise<FlowerState>;
}

export type PlaceFlowerDeps = VisitorDeps & { flowers: Pick<FlowerRepository, 'place'> };

export async function placeFlower(
  deps: PlaceFlowerDeps,
  user: AuthUser | null,
  memorialId: string,
  type: FlowerType,
): Promise<FlowerState> {
  await ensureVisitor(deps, user);
  return deps.flowers.place(memorialId, type);
}
