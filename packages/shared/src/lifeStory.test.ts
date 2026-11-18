import { describe, expect, it } from 'vitest';
import {
  LIFE_STORY_MAX_LENGTH,
  lifeStoryParagraphs,
  lifeStoryProblem,
  normalizeLifeStory,
} from './lifeStory';

describe('normalizeLifeStory', () => {
  it('trims, unifies line endings and keeps at most one blank line between paragraphs', () => {
    expect(normalizeLifeStory('  Born in Oaxaca.  \r\n\r\n\r\n\r\nMoved north.\tLater.  ')).toBe(
      'Born in Oaxaca.\n\nMoved north.  Later.',
    );
  });
});

describe('lifeStoryProblem', () => {
  it('allows an empty story, which clears it', () => {
    expect(lifeStoryProblem('   ')).toBeNull();
  });

  it('rejects stories over the limit and control characters', () => {
    expect(lifeStoryProblem('a'.repeat(LIFE_STORY_MAX_LENGTH + 1))).toBe('too_long');
    expect(lifeStoryProblem('bell\u0007')).toBe('characters');
  });
});

describe('lifeStoryParagraphs', () => {
  it('splits on blank lines and keeps single line breaks inside a paragraph', () => {
    expect(lifeStoryParagraphs('One\ntwo\n\nThree')).toEqual(['One\ntwo', 'Three']);
  });
});
