import { describe, expect, it } from 'vitest';
import { linkPreview } from './linkPreview';

describe('linkPreview', () => {
  it('names the person with their years and invites a visit', () => {
    expect(
      linkPreview({
        fullName: 'Rosa Martínez',
        born: { date: '1932-03-04', precision: 'day' },
        died: { date: '2024-07-19', precision: 'day' },
        epitaph: null,
      }),
    ).toEqual({
      title: 'Rosa Martínez (1932 – 2024)',
      description: 'A garden to remember Rosa Martínez. Visit, light a candle, and leave a note.',
    });
  });

  it('leads with the epitaph and keeps approximate years', () => {
    const preview = linkPreview({
      fullName: 'Ana',
      born: { date: '1890-01-01', precision: 'circa' },
      died: { date: '1952-01-01', precision: 'year' },
      epitaph: 'Always in our garden',
    });
    expect(preview.title).toBe('Ana (c. 1890 – 1952)');
    expect(preview.description.startsWith('“Always in our garden” A garden to remember Ana.')).toBe(
      true,
    );
  });

  it('keeps long descriptions short enough for chat previews', () => {
    const preview = linkPreview({
      fullName: 'A'.repeat(120),
      born: null,
      died: { date: '2020-01-01', precision: 'year' },
      epitaph: 'B'.repeat(160),
    });
    expect([...preview.description].length).toBeLessThanOrEqual(200);
    expect(preview.description.endsWith('…')).toBe(true);
  });
});
