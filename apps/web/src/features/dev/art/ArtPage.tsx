import { OrchardStillLife } from './OrchardStillLife';

export function ArtPage() {
  return (
    <div className="mx-auto flex w-[min(100%-2rem,48rem)] flex-col gap-8 py-10">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Developer preview</p>
        <h1>Code-drawn art</h1>
        <p className="text-muted-foreground max-w-prose">
          A test of drawing with code in the honeyed orchard palette: a vase whose flowers snap into
          its opening, a candle with a flickering flame, and a drifting petal. Every petal and leaf
          is generated with slight variation. Motion stops when reduced motion is requested.
        </p>
      </header>
      <figure className="border-border shadow-soft overflow-hidden rounded-xl border">
        <OrchardStillLife label="Orchard still life: terracotta vase of cosmos flowers and a lit candle on a mossy stone ledge" />
      </figure>
    </div>
  );
}
