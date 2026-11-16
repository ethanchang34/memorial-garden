import { useState } from 'react';
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
import { StoneError } from '@/core/stone';
import { cn } from '@/lib/utils';

type CleanStoneProps = {
  name: string;
  level: number;
  cleanedToday: boolean;
  pending: boolean;
  onClean: () => Promise<unknown>;
};

export const SHOW_HINT_AT = 0.1;

export function CleanStone({ name, level, cleanedToday, pending, onClean }: CleanStoneProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const hint = cleanedToday ? t('memorial.stone.cleanedToday') : t('memorial.stone.clean');
  const alwaysShowHint = !cleanedToday && level >= SHOW_HINT_AT;

  function clean() {
    setOpen(false);
    onClean().then(
      () => toast(t('memorial.stone.cleaned')),
      (error: unknown) => {
        if (error instanceof StoneError && error.code === 'daily_limit')
          toast(t('memorial.stone.dailyLimit'));
        else if (error instanceof CaptchaError) toast.error(t('memorial.candles.captchaFailed'));
        else toast.error(t('memorial.stone.failed'));
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t('memorial.stone.clean')}
          aria-disabled={cleanedToday || pending || undefined}
          data-stone-button=""
          onClick={(event) => {
            if (cleanedToday || pending) event.preventDefault();
          }}
          className={cn(
            'group focus-visible:outline-ring absolute inset-0 rounded-t-full focus-visible:outline-3 focus-visible:outline-offset-2',
            !cleanedToday && 'can-hover:hover:bg-card/10 cursor-pointer',
          )}
        >
          <span
            className={cn(
              'bg-card/85 text-foreground pointer-events-none absolute top-[57%] left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-sm whitespace-nowrap shadow-sm transition-opacity',
              alwaysShowHint
                ? 'opacity-100'
                : 'can-hover:group-hover:opacity-100 opacity-0 group-focus-visible:opacity-100',
            )}
          >
            {hint}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('memorial.stone.confirmTitle')}</DialogTitle>
          <DialogDescription>{t('memorial.stone.confirmBody', { name })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">{t('memorial.stone.notNow')}</Button>
          </DialogClose>
          <Button onClick={clean}>{t('memorial.stone.clean')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
