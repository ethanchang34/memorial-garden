import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  const { t } = useTranslation();

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="bg-ink/30 data-[state=open]:animate-fade-in fixed inset-0 z-50 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          'border-border bg-popover text-popover-foreground shadow-lift fixed z-50 flex flex-col gap-4 border outline-none',
          'px-safe data-[state=open]:animate-sheet-in inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-xl pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
          'md:data-[state=open]:animate-dialog-in md:inset-x-auto md:top-1/2 md:bottom-auto md:left-1/2 md:max-h-[85dvh] md:w-[min(32rem,calc(100%-2rem))] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl md:p-8',
          className,
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className="bg-stone absolute top-3 left-1/2 h-1.5 w-12 -translate-x-1/2 rounded-full md:hidden"
        />
        {children}
        <DialogPrimitive.Close
          className="size-touch text-muted-foreground focus-visible:outline-ring can-hover:hover:bg-accent can-hover:hover:text-foreground absolute top-3 right-3 grid place-items-center rounded-full transition-colors focus-visible:outline-3 focus-visible:outline-offset-3"
          aria-label={t('common.close')}
        >
          <X className="size-5" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 pr-10', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('font-display text-2xl font-medium tracking-tight', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-muted-foreground text-base leading-relaxed', className)}
      {...props}
    />
  );
}
