import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-touch border-input bg-card text-foreground shadow-soft ease-soft placeholder:text-muted-foreground focus-visible:outline-ring aria-[invalid=true]:border-destructive field-sizing-content w-full resize-none rounded-md border px-4 py-2.5 text-base leading-relaxed transition-[border-color,box-shadow] duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
