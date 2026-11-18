import { useState } from 'react';
import { GardenScene } from '@/features/garden/GardenScene';

const GOLDEN_HOUR = new Date(2026, 9, 1, 18, 15);
const BOUQUET = ['rose', 'daisy', 'tulip', 'poppy', 'rose', 'daisy', 'poppy', 'tulip'] as const;

export function OgImagePage() {
  const [now] = useState(() => GOLDEN_HOUR);
  return (
    <div className="fixed inset-0 z-[100] bg-black" data-og="">
      <div className="h-[630px] w-[1200px]">
        <GardenScene
          name=""
          dates=""
          label="Preview image"
          now={now}
          candlesLit={7}
          flowers={BOUQUET}
        />
      </div>
    </div>
  );
}
