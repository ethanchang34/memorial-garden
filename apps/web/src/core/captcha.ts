export interface CaptchaProvider {
  getToken(): Promise<string | undefined>;
}

export class CaptchaError extends Error {
  constructor() {
    super('captcha_failed');
  }
}

export const noCaptcha: CaptchaProvider = {
  getToken: () => Promise.resolve(undefined),
};
