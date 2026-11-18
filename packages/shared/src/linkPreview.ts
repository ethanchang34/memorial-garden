import { formatLifespan, type MemorialDate } from './dates';

export const SITE_NAME = 'Memorial Garden';
export const PREVIEW_IMAGE_PATH = '/og-garden.jpg';
export const PREVIEW_IMAGE_ALT =
  'A gravestone in a garden at golden hour, with flowers in clay vases and lit candles beside it';

export type PreviewMemorial = {
  fullName: string;
  born: MemorialDate | null;
  died: MemorialDate;
  epitaph: string | null;
};

export type LinkPreview = { title: string; description: string };

const PREVIEW_LABELS = { circa: (year: string) => `c. ${year}` };
const DESCRIPTION_MAX = 200;

function clip(text: string, max: number): string {
  const chars = [...text];
  return chars.length <= max
    ? text
    : `${chars
        .slice(0, max - 1)
        .join('')
        .trimEnd()}…`;
}

export function linkPreview(memorial: PreviewMemorial): LinkPreview {
  const lifespan = formatLifespan(memorial.born, memorial.died, 'en', PREVIEW_LABELS);
  const invitation = `A garden to remember ${memorial.fullName}. Visit, light a candle, and leave a note.`;
  return {
    title: `${memorial.fullName} (${lifespan})`,
    description: clip(
      memorial.epitaph ? `“${memorial.epitaph}” ${invitation}` : invitation,
      DESCRIPTION_MAX,
    ),
  };
}
