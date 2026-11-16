export const FULL_DAYS = 60;
export const MAX_OPACITY = 0.6;
export const GROWTH_EASE = 0.8;
export const CLEAN_ENOUGH = 0.05;

const DAY_MS = 86_400_000;

export function grimeLevel(dirtySince: string | null, now: Date): number {
  if (!dirtySince) return 0;
  const since = Date.parse(dirtySince);
  if (Number.isNaN(since)) return 0;
  const days = Math.max(0, (now.getTime() - since) / DAY_MS);
  return Math.min(1, days / FULL_DAYS) ** GROWTH_EASE;
}
