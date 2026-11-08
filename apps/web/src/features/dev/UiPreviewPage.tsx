import { Flame, Flower2, Info, Trash2 } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function UiPreviewPage() {
  return (
    <div className="mx-auto flex w-[min(100%-2rem,56rem)] flex-col gap-12 py-10">
      <header className="flex flex-col gap-2">
        <p className="eyebrow">Developer preview</p>
        <h1>Interface pieces</h1>
        <p className="text-muted-foreground max-w-prose">
          Base components in the cozy style. This page exists only in development and test builds.
        </p>
      </header>

      <section aria-labelledby="buttons-heading" className="flex flex-col gap-4">
        <h2 id="buttons-heading" className="font-display text-2xl">
          Buttons
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button>Create a memorial</Button>
          <Button variant="secondary">Find someone</Button>
          <Button variant="outline">Share</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">
            <Trash2 aria-hidden="true" />
            Delete note
          </Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="small">
            <Flower2 aria-hidden="true" />
            Small
          </Button>
          <Button size="icon" variant="secondary" aria-label="Light a candle">
            <Flame aria-hidden="true" />
          </Button>
        </div>
      </section>

      <section aria-labelledby="dialog-heading" className="flex flex-col gap-4">
        <h2 id="dialog-heading" className="font-display text-2xl">
          Dialog
        </h2>
        <p className="text-muted-foreground">
          A centered card on tablets and up, a bottom sheet on phones.
        </p>
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">
                <Flower2 aria-hidden="true" />
                Place flowers
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Place flowers for Rosa</DialogTitle>
                <DialogDescription>
                  A pot of spring flowers by the stone. They last 14 days.
                </DialogDescription>
              </DialogHeader>
              <dl className="bg-muted grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 rounded-lg p-4 text-sm">
                <dt className="text-muted-foreground">Price</dt>
                <dd className="font-bold">200 coins</dd>
                <dt className="text-muted-foreground">Your balance</dt>
                <dd>1,240 → 1,040</dd>
              </dl>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">Not now</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => toast('Flowers placed 🌸')}>Place flowers</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section aria-labelledby="tooltip-heading" className="flex flex-col gap-4">
        <h2 id="tooltip-heading" className="font-display text-2xl">
          Tooltip and toast
        </h2>
        <div className="flex flex-wrap gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">
                <Info aria-hidden="true" />
                Who left these?
              </Button>
            </TooltipTrigger>
            <TooltipContent>Flowers from Alex C. · Nov 3 · fades in 9 days</TooltipContent>
          </Tooltip>
          <Button
            variant="secondary"
            onClick={() =>
              toast('Note saved', { description: 'Your note is now on Rosa’s stone.' })
            }
          >
            Show a toast
          </Button>
        </div>
      </section>
    </div>
  );
}
