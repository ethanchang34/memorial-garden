import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-touch shrink-0 items-center justify-center gap-2 rounded-full font-bold whitespace-nowrap transition-[background-color,box-shadow,transform] duration-200 ease-soft select-none focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-ring active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-soft can-hover:hover:bg-primary-hover',
        secondary:
          'border border-border bg-secondary text-secondary-foreground shadow-soft can-hover:hover:bg-secondary-hover',
        outline:
          'border border-input bg-transparent text-foreground can-hover:hover:bg-accent can-hover:hover:text-accent-foreground',
        ghost:
          'bg-transparent text-foreground can-hover:hover:bg-accent can-hover:hover:text-accent-foreground',
        destructive:
          'bg-destructive text-destructive-foreground shadow-soft can-hover:hover:bg-destructive-hover',
        link: 'min-h-0 rounded-sm px-1 text-primary underline-offset-4 can-hover:hover:underline',
      },
      size: {
        default: 'px-5 py-2.5 text-base',
        small: 'px-4 py-2 text-sm',
        icon: 'size-touch p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ asChild = false, className, size, variant, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button';

  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
