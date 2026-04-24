import { buildSavedPhraseSet, Fragment } from '../../../lib/reader-utils';

const makeFragment = (start: number, end: number): Fragment => ({
  id: `f-${start}-${end}`,
  bookId: 'book-1',
  userId: 'user-1',
  startPhraseIndex: start,
  endPhraseIndex: end,
  text: 'sample text',
  note: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

describe('buildSavedPhraseSet', () => {
  it('returns an empty set for no fragments', () => {
    const result = buildSavedPhraseSet([]);
    expect(result.size).toBe(0);
  });

  it('returns correct range for a single fragment', () => {
    const result = buildSavedPhraseSet([makeFragment(3, 7)]);
    expect(result.size).toBe(5);
    expect(result.has(3)).toBe(true);
    expect(result.has(5)).toBe(true);
    expect(result.has(7)).toBe(true);
    expect(result.has(2)).toBe(false);
    expect(result.has(8)).toBe(false);
  });

  it('returns union of ranges for overlapping fragments', () => {
    const result = buildSavedPhraseSet([makeFragment(1, 4), makeFragment(3, 6)]);
    expect(result.size).toBe(6);
    for (let i = 1; i <= 6; i++) {
      expect(result.has(i)).toBe(true);
    }
    expect(result.has(0)).toBe(false);
    expect(result.has(7)).toBe(false);
  });

  it('handles non-overlapping fragments', () => {
    const result = buildSavedPhraseSet([makeFragment(0, 2), makeFragment(5, 7)]);
    expect(result.size).toBe(6);
    expect(result.has(0)).toBe(true);
    expect(result.has(2)).toBe(true);
    expect(result.has(3)).toBe(false);
    expect(result.has(4)).toBe(false);
    expect(result.has(5)).toBe(true);
    expect(result.has(7)).toBe(true);
  });

  it('handles a single-phrase fragment', () => {
    const result = buildSavedPhraseSet([makeFragment(5, 5)]);
    expect(result.size).toBe(1);
    expect(result.has(5)).toBe(true);
  });
});
