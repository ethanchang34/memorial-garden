import { z } from 'zod';

export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 40;

export const displayNameSchema = z
  .string()
  .trim()
  .min(DISPLAY_NAME_MIN_LENGTH)
  .max(DISPLAY_NAME_MAX_LENGTH);

export const profileUpdateSchema = z.object({
  displayName: displayNameSchema,
  timeZone: z.string().trim().min(1).max(64),
  locale: z.string().trim().min(2).max(16),
});
