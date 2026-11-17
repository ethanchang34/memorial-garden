import { describe, expect, it } from 'vitest';
import { linkConflictReturnUrl } from './linkConflict';

describe('linkConflictReturnUrl', () => {
  it('finds the conflict in the query and returns the page without the error', () => {
    expect(
      linkConflictReturnUrl(
        'https://garden.test/m/rosa?error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked',
      ),
    ).toBe('https://garden.test/m/rosa');
  });

  it('finds the conflict in the hash', () => {
    expect(
      linkConflictReturnUrl(
        'https://garden.test/m/rosa?tab=notes#error=server_error&error_code=identity_already_exists',
      ),
    ).toBe('https://garden.test/m/rosa?tab=notes');
  });

  it('ignores other errors and normal pages', () => {
    expect(linkConflictReturnUrl('https://garden.test/m/rosa?error_code=otp_expired')).toBeNull();
    expect(linkConflictReturnUrl('https://garden.test/m/rosa')).toBeNull();
  });
});
