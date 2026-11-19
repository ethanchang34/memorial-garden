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
import { GardenHint } from '../GardenHint';
import { useFlash } from '../useFlash';

type CleanStoneProps = {
  name: string;
  level: number;
  cleanedToday: boolean;
  pending: boolean;
  onClean: () => Promise<unknown>;
};

export function CleanStone({ name, level, cleanedToday, pending, onClean }: CleanStoneProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [flash, showFlash] = useFlash();
  const hint = cleanedToday ? t('memorial.stone.cleanedToday') : t('memorial.stone.clean');

  function clean() {
    setOpen(false);
    onClean().then(
      () => toast(t('memorial.stone.cleaned')),
      (error: unknown) => {
        if (error instanceof StoneError && error.code === 'daily_limit')
          showFlash(t('memorial.stone.dailyLimit'));
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
          data-level={level.toFixed(2)}
          onClick={(event) => {
            if (!cleanedToday && !pending) return;
            event.preventDefault();
            if (cleanedToday) showFlash(t('memorial.stone.dailyLimit'));
          }}
          className="peer focus-visible:outline-ring absolute inset-0 cursor-pointer rounded-t-full focus-visible:outline-3 focus-visible:outline-offset-2"
        />
      </DialogTrigger>
      <GardenHint flash={flash} text={hint} className="top-[57%] left-1/2 -translate-x-1/2" />
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
