import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { GardenScene } from './GardenScene';
import { PALETTES, type TimeOfDay } from './palettes';
import { StationeryScene } from './StationeryScene';

const TIMES: { value: TimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'day', label: 'Day' },
  { value: 'golden', label: 'Golden hour' },
  { value: 'evening', label: 'Evening' },
];

export function DirectionsPage() {
  const [companion, setCompanion] = useState(true);
  const [time, setTime] = useState<TimeOfDay>('golden');

  return (
    <div className="mx-auto flex w-[min(100%-2rem,60rem)] flex-col gap-12 py-10">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">Developer preview</p>
        <h1>Visual directions</h1>
        <p className="text-muted-foreground max-w-prose">
          Rough sketches of the three candidate directions in docs/VISUAL_DIRECTION.md, using the
          same garden so only the style differs. Direction A imitates painted art with filters; a
          real version would be hand-painted.
        </p>
        <div>
          <Button
            variant="secondary"
            aria-pressed={companion}
            onClick={() => setCompanion((value) => !value)}
          >
            {companion ? 'Hide the companion' : 'Show the companion'}
          </Button>
        </div>
      </header>

      <Direction
        id="direction-a"
        title="A. Painted golden hour"
        summary="Soft storybook painting, warm light, brushy edges. Most emotional; needs painted art for every stone, decoration, and time of day."
        scene={
          <GardenScene
            palette={PALETTES.golden}
            painted
            companion={companion}
            label="Direction A: painted garden at golden hour"
          />
        }
      />

      <Direction
        id="direction-b"
        title="B. Layered paper garden"
        summary="Flat layered shapes with paper grain and soft light. Cheap to extend and sharp at every size; each time of day is only a color change."
        scene={
          <GardenScene
            palette={PALETTES[time]}
            companion={companion}
            label={`Direction B: layered paper garden, ${time}`}
          />
        }
        controls={
          <div role="group" aria-label="Time of day" className="flex flex-wrap gap-2">
            {TIMES.map((option) => (
              <Button
                key={option.value}
                size="small"
                variant={time === option.value ? 'default' : 'secondary'}
                aria-pressed={time === option.value}
                onClick={() => setTime(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        }
      />

      <Direction
        id="direction-c"
        title="C. Pressed-flower stationery"
        summary="Botanical line drawings and watercolor washes on paper. Elegant and very readable; the garden feels like a card rather than a place."
        scene={
          <StationeryScene companion={companion} label="Direction C: pressed-flower stationery" />
        }
      />
    </div>
  );
}

type DirectionProps = {
  id: string;
  title: string;
  summary: string;
  scene: ReactNode;
  controls?: ReactNode;
};

function Direction({ id, title, summary, scene, controls }: DirectionProps) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="font-display text-2xl">
          {title}
        </h2>
        <p className="text-muted-foreground max-w-prose">{summary}</p>
      </div>
      <figure className="border-border shadow-soft overflow-hidden rounded-xl border">
        {scene}
      </figure>
      {controls}
    </section>
  );
}
