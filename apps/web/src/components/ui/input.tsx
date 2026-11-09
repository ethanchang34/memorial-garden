import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, type = 'text', ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'min-h-touch border-input bg-card text-foreground shadow-soft ease-soft placeholder:text-muted-foreground focus-visible:outline-ring aria-[invalid=true]:border-destructive w-full rounded-md border px-4 py-2.5 text-base transition-[border-color,box-shadow] duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
