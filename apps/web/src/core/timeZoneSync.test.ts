import { describe, expect, it, vi } from 'vitest';
import { createTimeZoneSync } from './timeZoneSync';

function fakeProfiles() {
  return { setTimeZone: vi.fn(async (timeZone: string) => timeZone) };
}

describe('createTimeZoneSync', () => {
  it('sends the browser time zone once per user', async () => {
    const profiles = fakeProfiles();
    const sync = createTimeZoneSync(profiles, () => 'America/Chicago');

    await expect(sync('user-1')).resolves.toBe('America/Chicago');
    await expect(sync('user-1')).resolves.toBeUndefined();
    await sync('user-2');

    expect(profiles.setTimeZone).toHaveBeenCalledTimes(2);
    expect(profiles.setTimeZone).toHaveBeenNthCalledWith(1, 'America/Chicago');
  });

  it('does nothing when the browser has no time zone', async () => {
    const profiles = fakeProfiles();
    const sync = createTimeZoneSync(profiles, () => undefined);

    await expect(sync('user-1')).resolves.toBeUndefined();
    expect(profiles.setTimeZone).not.toHaveBeenCalled();
  });

  it('retries after a failure', async () => {
    const profiles = fakeProfiles();
    profiles.setTimeZone.mockRejectedValueOnce(new Error('offline'));
    const sync = createTimeZoneSync(profiles, () => 'Asia/Tokyo');

    await expect(sync('user-1')).rejects.toThrow('offline');
    await expect(sync('user-1')).resolves.toBe('Asia/Tokyo');
    expect(profiles.setTimeZone).toHaveBeenCalledTimes(2);
  });

  it('returns the server value, which may differ inside the 7-day limit', async () => {
    const profiles = { setTimeZone: vi.fn(async () => 'America/Chicago') };
    const sync = createTimeZoneSync(profiles, () => 'Asia/Tokyo');

    await expect(sync('user-1')).resolves.toBe('America/Chicago');
  });
});
