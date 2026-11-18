export const LIFE_STORY_MAX_LENGTH = 10000;

export function normalizeLifeStory(value: string): string {
  return value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/[ \u00a0]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type LifeStoryProblem = 'too_long' | 'characters';

export function lifeStoryProblem(value: string): LifeStoryProblem | null {
  const story = normalizeLifeStory(value);
  if ([...story].length > LIFE_STORY_MAX_LENGTH) return 'too_long';
  // eslint-disable-next-line no-control-regex
  if (/[\u0001-\u0009\u000B-\u001F\u007F]/.test(story)) return 'characters';
  return null;
}

export function lifeStoryParagraphs(story: string): string[] {
  return story.split(/\n{2,}/).filter((paragraph) => paragraph.length > 0);
}
