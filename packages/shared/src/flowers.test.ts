import { describe, expect, it } from 'vitest';
import { FLOWER_MESSAGE_MAX_LENGTH, flowerMessageProblem, normalizeFlowerMessage } from './flowers';

describe('flower messages', () => {
  it('fold onto one trimmed line', () => {
    expect(normalizeFlowerMessage('  Miss you,\n\n  Rosa  ')).toBe('Miss you, Rosa');
  });

  it('are optional and limited in length', () => {
    expect(flowerMessageProblem('')).toBeNull();
    expect(flowerMessageProblem('a'.repeat(FLOWER_MESSAGE_MAX_LENGTH))).toBeNull();
    expect(flowerMessageProblem('a'.repeat(FLOWER_MESSAGE_MAX_LENGTH + 1))).toBe('too_long');
  });
});
