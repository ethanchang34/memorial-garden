import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { HoldButton } from '@/components/ui/hold-button';
import { CaptchaError } from '@/core/captcha';
import { CandleError, type CandleState } from '@/core/candles';
import { cn } from '@/lib/utils';

type LightCandleProps = {
  name: string;
  state: CandleState;
  pending: boolean;
  onLight: () => Promise<unknown>;
};

export function LightCandle({ name, state, pending, onLight }: LightCandleProps) {
  const { t } = useTranslation();
  const hintId = useId();
  const done = state.litToday;

  function light() {
    onLight().catch((error: unknown) => {
      if (error instanceof CandleError && error.code === 'daily_limit')
        toast(t('memorial.candles.dailyLimit'));
      else if (error instanceof CaptchaError) toast.error(t('memorial.candles.captchaFailed'));
      else toast.error(t('memorial.candles.failed'));
    });
  }

  return (
    <>
      <HoldButton
        aria-label={t('memorial.candles.light')}
        aria-describedby={hintId}
        inactive={done || pending}
        onHoldComplete={light}
        data-candle-button=""
        className={cn(
          'focus-visible:outline-ring absolute top-0 left-0 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus-visible:outline-3 focus-visible:outline-offset-2',
          !done && 'can-hover:hover:bg-card/15 cursor-pointer',
        )}
      >
        <svg viewBox="0 0 64 64" className="size-full -rotate-90" aria-hidden="true">
          <circle
            cx="32"
            cy="32"
            r="29"
            pathLength={1}
            className="candle-hold-ring stroke-gold fill-none"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </HoldButton>
      <span
        id={hintId}
        className="bg-card/85 text-foreground pointer-events-none absolute right-[-2.5rem] bottom-12 rounded-full px-3 py-0.5 text-sm whitespace-nowrap shadow-sm md:top-12 md:right-auto md:bottom-auto md:left-0 md:-translate-x-1/2"
      >
        {done ? t('memorial.candles.litToday') : t('memorial.candles.hold')}
      </span>
      <span role="status" className="sr-only">
        {state.lit > 0 ? t('memorial.candles.burning', { count: state.lit, name }) : ''}
      </span>
    </>
  );
}
