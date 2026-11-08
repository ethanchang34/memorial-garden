import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      offset={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      toastOptions={{
        classNames: {
          toast:
            'rounded-lg border border-border bg-popover font-sans text-popover-foreground shadow-lift',
          description: 'text-muted-foreground',
          actionButton: 'bg-primary text-primary-foreground',
          cancelButton: 'bg-muted text-foreground',
        },
      }}
    />
  );
}
