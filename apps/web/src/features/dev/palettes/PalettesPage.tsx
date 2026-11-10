import { GardenScene } from '../directions/GardenScene';
import { PALETTE_OPTIONS } from './palettes';

export function PalettesPage() {
  return (
    <div className="mx-auto flex w-[min(100%-2rem,76rem)] flex-col gap-12 py-10">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Developer preview</p>
        <h1>Color study</h1>
        <p className="text-muted-foreground max-w-prose">
          Six complete palettes on the same layered garden, at golden hour and in the evening. Only
          the colors differ; the shapes are placeholders.
        </p>
      </header>

      {PALETTE_OPTIONS.map((option) => (
        <section
          key={option.id}
          aria-labelledby={`palette-${option.id}`}
          data-palette={option.id}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <h2 id={`palette-${option.id}`} className="font-display text-2xl">
              {option.name}
            </h2>
            <p className="text-muted-foreground max-w-prose">{option.mood}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <figure className="border-border shadow-soft overflow-hidden rounded-xl border">
              <GardenScene
                palette={option.golden}
                companion
                label={`${option.name}, golden hour`}
              />
            </figure>
            <figure className="border-border shadow-soft overflow-hidden rounded-xl border">
              <GardenScene palette={option.evening} companion label={`${option.name}, evening`} />
            </figure>
          </div>
        </section>
      ))}
    </div>
  );
}
