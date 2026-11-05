import { z } from 'zod';

export const DISPLAY_NAME_MIN_LENGTH = 1;
export const DISPLAY_NAME_MAX_LENGTH = 40;

export const displayNameSchema = z
  .string()
  .trim()
  .min(DISPLAY_NAME_MIN_LENGTH)
  .max(DISPLAY_NAME_MAX_LENGTH);

export const localeSchema = z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/);

export const timeZoneSchema = z.string().trim().min(1).max(64);

export const profileUpdateSchema = z.strictObject({
  displayName: displayNameSchema,
  locale: localeSchema,
});

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
