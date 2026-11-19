import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { HoldButton } from '@/components/ui/hold-button';
import { CaptchaError } from '@/core/captcha';
import { IncenseError, type IncenseState } from '@/core/incense';
import { cn } from '@/lib/utils';
import { GardenHint } from '../GardenHint';
import { useFlash } from '../useFlash';

type LightIncenseProps = {
  name: string;
  state: IncenseState;
  pending: boolean;
  onLight: () => Promise<unknown>;
};

export function LightIncense({ name, state, pending, onLight }: LightIncenseProps) {
  const { t } = useTranslation();
  const hintId = useId();
  const done = state.litToday;
  const [flash, showFlash] = useFlash();

  function light() {
    onLight().catch((error: unknown) => {
      if (error instanceof IncenseError && error.code === 'daily_limit')
        showFlash(t('memorial.incense.dailyLimit'));
      else if (error instanceof CaptchaError) toast.error(t('memorial.candles.captchaFailed'));
      else toast.error(t('memorial.incense.failed'));
    });
  }

  return (
    <>
      <HoldButton
        className={cn(
          'peer focus-visible:outline-ring min-h-touch min-w-touch absolute top-1/2 left-1/2 grid size-full -translate-x-1/2 -translate-y-1/2 place-items-center rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-2',
          'cursor-pointer',
        )}
        aria-label={t('memorial.incense.light')}
        aria-describedby={hintId}
        inactive={done || pending}
        onHoldComplete={light}
        onTap={() =>
          showFlash(done ? t('memorial.incense.dailyLimit') : t('memorial.incense.hold'))
        }
        data-incense-button=""
      >
        <svg viewBox="0 0 64 64" className="size-14 -rotate-90" aria-hidden="true">
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
      <GardenHint
        id={hintId}
        flash={flash}
        text={done ? t('memorial.incense.litToday') : t('memorial.incense.hold')}
        className="bottom-full left-1/2 mb-1 -translate-x-1/2"
      />
      <span role="status" className="sr-only">
        {state.lit > 0 ? t('memorial.incense.burning', { count: state.lit, name }) : ''}
      </span>
    </>
  );
}
