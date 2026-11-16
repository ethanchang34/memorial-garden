import { CaptchaError, type CaptchaProvider } from '@/core/captcha';

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileOptions = {
  sitekey: string;
  appearance: 'always' | 'execute' | 'interaction-only';
  callback: (token: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
  'timeout-callback': () => void;
};

type Turnstile = {
  render(container: HTMLElement, options: TurnstileOptions): string | undefined;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

let loading: Promise<Turnstile> | null = null;

function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new CaptchaError());
    };
    script.onerror = () => {
      script.remove();
      loading = null;
      reject(new CaptchaError());
    };
    document.head.append(script);
  });
  return loading;
}

export function createTurnstileCaptcha(siteKey: string): CaptchaProvider {
  return {
    async getToken() {
      const turnstile = await loadTurnstile();
      const host = document.createElement('div');
      host.className = 'fixed bottom-4 left-1/2 z-[60] -translate-x-1/2';
      document.body.append(host);

      return new Promise<string>((resolve, reject) => {
        const widget: { id?: string } = {};
        const finish = (result: () => void) => {
          if (widget.id) turnstile.remove(widget.id);
          host.remove();
          result();
        };
        const fail = () => finish(() => reject(new CaptchaError()));
        widget.id = turnstile.render(host, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          callback: (token) => finish(() => resolve(token)),
          'error-callback': fail,
          'expired-callback': fail,
          'timeout-callback': fail,
        });
      });
    },
  };
}
