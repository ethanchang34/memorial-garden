export const FLOWER_MESSAGE_MAX_LENGTH = 140;

export function normalizeFlowerMessage(value: string): string {
  return value.normalize('NFC').replace(/\s+/gu, ' ').trim();
}

export type FlowerMessageProblem = 'too_long' | 'characters';

export function flowerMessageProblem(value: string): FlowerMessageProblem | null {
  const message = normalizeFlowerMessage(value);
  if ([...message].length > FLOWER_MESSAGE_MAX_LENGTH) return 'too_long';
  // eslint-disable-next-line no-control-regex
  if (/[\u0001-\u001F\u007F]/.test(message)) return 'characters';
  return null;
}
