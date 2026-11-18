export const REPORT_REASONS = ['hurtful', 'spam', 'private', 'not_about', 'other'] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_DETAILS_MAX_LENGTH = 500;

export function normalizeReportDetails(value: string): string {
  return value.normalize('NFC').replace(/\r\n?/g, '\n').replace(/\t/g, ' ').trim();
}

export function reportDetailsProblem(value: string): 'too_long' | 'characters' | null {
  const details = normalizeReportDetails(value);
  if ([...details].length > REPORT_DETAILS_MAX_LENGTH) return 'too_long';
  // eslint-disable-next-line no-control-regex
  if (/[\u0001-\u0009\u000B-\u001F\u007F]/.test(details)) return 'characters';
  return null;
}
