import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerTitle = DialogPrimitive.Title;
export const DrawerDescription = DialogPrimitive.Description;

type DrawerContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  side: 'left' | 'right';
};

export function DrawerContent({ side, className, children, ...props }: DrawerContentProps) {
  const { t } = useTranslation();

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="bg-ink/15 data-[state=open]:animate-fade-in fixed inset-0 z-50" />
      <DialogPrimitive.Content
        data-side={side}
        className={cn(
          'border-border bg-popover text-popover-foreground shadow-lift fixed z-50 flex flex-col gap-4 border outline-none',
          'px-safe data-[state=open]:animate-sheet-in inset-x-0 bottom-0 max-h-[70dvh] overflow-y-auto rounded-t-xl pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]',
          'md:inset-y-0 md:bottom-auto md:h-dvh md:max-h-none md:w-[min(26rem,40vw)] md:rounded-none md:p-8 md:pt-16',
          side === 'left'
            ? 'md:data-[state=open]:animate-drawer-left md:right-auto md:left-0 md:rounded-r-xl md:border-l-0'
            : 'md:data-[state=open]:animate-drawer-right md:right-0 md:left-auto md:rounded-l-xl md:border-r-0',
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
