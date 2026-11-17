import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CaptchaError } from '@/core/captcha';
import {
  FLOWER_MAX,
  FLOWER_TYPES,
  FlowerError,
  type FlowerState,
  type FlowerType,
} from '@/core/flowers';
import { Bloom } from '@/features/garden/FlowerVases';
import { cn } from '@/lib/utils';

type PlaceFlowerProps = {
  name: string;
  state: FlowerState;
  pending: boolean;
  onPlace: (type: FlowerType) => Promise<unknown>;
};

const asIs = (hex: string) => hex;

export function PlaceFlower({ name, state, pending, onPlace }: PlaceFlowerProps) {
  const { t } = useTranslation();
  const groupId = useId();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<FlowerType>('rose');
  const done = state.placedToday;
  const full = state.types.length >= FLOWER_MAX;

  function place() {
    setOpen(false);
    onPlace(choice).then(
      () => toast(t('memorial.flowers.placed')),
      (error: unknown) => {
        if (error instanceof FlowerError && error.code === 'daily_limit')
          toast(t('memorial.flowers.dailyLimit'));
        else if (error instanceof CaptchaError) toast.error(t('memorial.candles.captchaFailed'));
        else toast.error(t('memorial.flowers.failed'));
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t('memorial.flowers.place')}
          aria-disabled={done || pending || undefined}
          data-flower-button=""
          onClick={(event) => {
            if (done || pending) event.preventDefault();
          }}
          className={cn(
            'group focus-visible:outline-ring min-w-touch absolute inset-y-0 left-1/2 w-full -translate-x-1/2 rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-2',
            !done && 'can-hover:hover:bg-card/10 cursor-pointer',
          )}
        >
          <span
            className={cn(
              'bg-card/85 text-foreground pointer-events-none absolute top-[72%] left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-sm whitespace-nowrap shadow-sm transition-opacity',
              done
                ? 'can-hover:group-hover:opacity-100 opacity-0 group-focus-visible:opacity-100'
                : 'opacity-100',
            )}
          >
            {done ? t('memorial.flowers.placedToday') : t('memorial.flowers.place')}
          </span>
        </button>
      </DialogTrigger>
      <span role="status" className="sr-only">
        {state.types.length > 0
          ? t('memorial.flowers.inBloom', { count: state.types.length, name })
          : ''}
      </span>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('memorial.flowers.title')}</DialogTitle>
          <DialogDescription>
            {full ? t('memorial.flowers.full', { name }) : t('memorial.flowers.body', { name })}
          </DialogDescription>
        </DialogHeader>
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">{t('memorial.flowers.typeLabel')}</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FLOWER_TYPES.map((type) => (
              <label
                key={type}
                className={cn(
                  'border-border bg-card has-[:focus-visible]:outline-ring min-h-touch flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 p-3 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2',
                  choice === type ? 'border-gold-deep bg-muted' : 'can-hover:hover:bg-muted',
                )}
              >
                <input
                  type="radio"
                  name={groupId}
                  value={type}
                  checked={choice === type}
                  onChange={() => setChoice(type)}
                  className="sr-only"
                />
                <svg viewBox="-14 -14 28 26" className="size-14" aria-hidden="true">
                  <Bloom type={type} size={11} lit={asIs} />
                </svg>
                <span className="text-sm">{t(`memorial.flowers.types.${type}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{t('memorial.flowers.notNow')}</Button>
          </DialogClose>
          <Button onClick={place}>{t('memorial.flowers.confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
