import { describe, expect, it } from 'vitest';
import { normalizeReportDetails, REPORT_DETAILS_MAX_LENGTH, reportDetailsProblem } from './reports';

describe('report details', () => {
  it('are trimmed and optional', () => {
    expect(normalizeReportDetails('  It names a living person.\r\n ')).toBe(
      'It names a living person.',
    );
    expect(reportDetailsProblem('')).toBeNull();
  });

  it('have a length limit', () => {
    expect(reportDetailsProblem('a'.repeat(REPORT_DETAILS_MAX_LENGTH + 1))).toBe('too_long');
  });
});
