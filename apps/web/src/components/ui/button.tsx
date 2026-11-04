import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center rounded-full border border-transparent px-5 py-3 font-extrabold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-[#526b4d] text-white hover:bg-[#42583e]',
        secondary: 'border-[#d5d2ca] bg-white/65 text-ink hover:bg-white',
        quiet: 'bg-transparent text-ink hover:bg-black/5',
      },
      size: {
        default: 'text-base',
        small: 'min-h-11 px-4 py-2 text-sm',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button';

  return (
    <Component className={cn(buttonVariants({ className, size, variant }))} {...props} />
  );
}
