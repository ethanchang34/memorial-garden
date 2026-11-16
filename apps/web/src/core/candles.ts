import type { AuthProvider, AuthUser } from './auth';
import type { CaptchaProvider } from './captcha';
import type { ProfileRepository } from './profile';

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

export type LightCandleDeps = {
  auth: Pick<AuthProvider, 'signInAsVisitor'>;
  captcha: CaptchaProvider;
  profiles: Pick<ProfileRepository, 'setTimeZone'>;
  candles: Pick<CandleRepository, 'light'>;
  timeZone: () => string | undefined;
};

export async function lightCandle(
  deps: LightCandleDeps,
  user: AuthUser | null,
  memorialId: string,
): Promise<CandleState> {
  if (!user) {
    const token = await deps.captcha.getToken();
    await deps.auth.signInAsVisitor(token);
    const timeZone = deps.timeZone();
    if (timeZone) await deps.profiles.setTimeZone(timeZone).catch(() => undefined);
  }
  return deps.candles.light(memorialId);
}
