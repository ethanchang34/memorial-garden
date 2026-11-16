import type { AuthProvider, AuthUser } from './auth';
import type { CaptchaProvider } from './captcha';
import type { ProfileRepository } from './profile';

export type VisitorDeps = {
  auth: Pick<AuthProvider, 'signInAsVisitor'>;
  captcha: CaptchaProvider;
  profiles: Pick<ProfileRepository, 'setTimeZone'>;
  timeZone: () => string | undefined;
};

export async function ensureVisitor(deps: VisitorDeps, user: AuthUser | null): Promise<void> {
  if (user) return;
  const token = await deps.captcha.getToken();
  await deps.auth.signInAsVisitor(token);
  const timeZone = deps.timeZone();
  if (timeZone) await deps.profiles.setTimeZone(timeZone).catch(() => undefined);
}
