import { Share2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Memorial } from '@/core/memorial';

type ShareMemorialProps = {
  memorial: Memorial;
  open: boolean;
  justShared: boolean;
  onOpenChange: (open: boolean) => void;
};

function memorialUrl(slug: string): string {
  return new URL(`/m/${slug}`, window.location.origin).toString();
}

function canShareNatively(data: ShareData): boolean {
  return typeof navigator.share === 'function' && (navigator.canShare?.(data) ?? true);
}

export function ShareMemorial({ memorial, open, justShared, onOpenChange }: ShareMemorialProps) {
  const { t } = useTranslation();
  const linkId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const url = memorialUrl(memorial.slug);
  const data: ShareData = {
    title: memorial.fullName,
    text: t('memorial.share.text', { name: memorial.fullName }),
    url,
  };

  async function shareNatively() {
    try {
      await navigator.share(data);
      onOpenChange(false);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      onOpenChange(true);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast(t('memorial.share.copied'));
    } catch {
      input.current?.select();
      toast(t('memorial.share.copyManually'));
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        size="small"
        onClick={() => {
          if (canShareNatively(data)) void shareNatively();
          else onOpenChange(true);
        }}
      >
        <Share2 className="size-4" aria-hidden="true" />
        {t('memorial.share.button')}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setCopied(false);
          onOpenChange(next);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {justShared ? t('memorial.share.sharedTitle') : t('memorial.share.title')}
            </DialogTitle>
            <DialogDescription>{t('memorial.share.body')}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <label htmlFor={linkId} className="text-sm font-medium">
              {t('memorial.share.linkLabel')}
            </label>
            <Input
              ref={input}
              id={linkId}
              readOnly
              value={url}
              onFocus={(event) => event.currentTarget.select()}
            />
          </div>
          <DialogFooter>
            {canShareNatively(data) ? (
              <Button variant="secondary" onClick={() => void shareNatively()}>
                {t('memorial.share.native')}
              </Button>
            ) : null}
            <Button onClick={() => void copy()}>
              {copied ? t('memorial.share.copiedButton') : t('memorial.share.copy')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
