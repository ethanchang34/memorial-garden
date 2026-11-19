import { cn } from '@/lib/utils';

type GardenHintProps = {
  id?: string;
  text: string;
  flash: string | null;
  className?: string;
};

export function GardenHint({ id, text, flash, className }: GardenHintProps) {
  return (
    <>
      <span
        id={id}
        aria-hidden="true"
        data-garden-hint=""
        data-flash={flash ? '' : undefined}
        className={cn(
          'garden-hint absolute',
          flash
            ? 'opacity-100'
            : 'can-hover:peer-hover:opacity-100 opacity-0 peer-focus-visible:opacity-100',
          className,
        )}
      >
        {flash ?? text}
      </span>
      <span role="status" className="sr-only">
        {flash ?? ''}
      </span>
    </>
  );
}
