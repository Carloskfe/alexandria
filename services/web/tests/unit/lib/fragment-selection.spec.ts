import {
  applyPhraseClick,
  selectionRange,
  addFragment,
  removeFragment,
  replaceFragments,
  EMPTY_SELECTION,
  SelectionState,
} from '../../../lib/fragment-selection';
import { Fragment } from '../../../lib/reader-utils';

// ── helpers ──────────────────────────────────────────────────────────────────

const makeFragment = (id: string, start: number, end: number): Fragment => ({
  id,
  bookId: 'book-1',
  userId: 'user-1',
  startPhraseIndex: start,
  endPhraseIndex: end,
  text: 'sample',
  note: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

// ── applyPhraseClick ──────────────────────────────────────────────────────────

describe('applyPhraseClick', () => {
  it('first click anchors selection and shows popover', () => {
    const result = applyPhraseClick(EMPTY_SELECTION, 3);
    expect(result).toEqual({ start: 3, end: 3, showPopover: true });
  });

  it('clicking the same single phrase again clears selection', () => {
    const state: SelectionState = { start: 3, end: 3, showPopover: true };
    const result = applyPhraseClick(state, 3);
    expect(result).toEqual(EMPTY_SELECTION);
  });

  it('clicking a different phrase extends the range', () => {
    const state: SelectionState = { start: 3, end: 3, showPopover: true };
    const result = applyPhraseClick(state, 7);
    expect(result).toEqual({ start: 3, end: 7, showPopover: true });
  });

  it('clicking backwards from anchor sets end below start', () => {
    const state: SelectionState = { start: 5, end: 5, showPopover: true };
    const result = applyPhraseClick(state, 2);
    expect(result).toEqual({ start: 5, end: 2, showPopover: true });
  });

  it('extending an already-extended selection keeps anchor and moves end', () => {
    const state: SelectionState = { start: 3, end: 7, showPopover: true };
    const result = applyPhraseClick(state, 10);
    expect(result).toEqual({ start: 3, end: 10, showPopover: true });
  });

  it('clicking start phrase when end differs does not cancel (only exact same-phrase cancels)', () => {
    const state: SelectionState = { start: 3, end: 7, showPopover: true };
    const result = applyPhraseClick(state, 3);
    expect(result).toEqual({ start: 3, end: 3, showPopover: true });
  });
});

// ── selectionRange ────────────────────────────────────────────────────────────

describe('selectionRange', () => {
  it('returns null when there is no selection', () => {
    expect(selectionRange(EMPTY_SELECTION)).toBeNull();
  });

  it('returns normalised range when start <= end', () => {
    const state: SelectionState = { start: 2, end: 6, showPopover: true };
    expect(selectionRange(state)).toEqual({ start: 2, end: 6 });
  });

  it('normalises reversed selection (end < start)', () => {
    const state: SelectionState = { start: 6, end: 2, showPopover: true };
    expect(selectionRange(state)).toEqual({ start: 2, end: 6 });
  });

  it('returns single-index range for a single phrase', () => {
    const state: SelectionState = { start: 4, end: 4, showPopover: true };
    expect(selectionRange(state)).toEqual({ start: 4, end: 4 });
  });
});

// ── addFragment ───────────────────────────────────────────────────────────────

describe('addFragment', () => {
  it('adds a fragment and sorts by startPhraseIndex', () => {
    const existing = [makeFragment('a', 5, 7), makeFragment('b', 10, 12)];
    const created = makeFragment('c', 2, 4);
    const result = addFragment(existing, created);
    expect(result.map((f) => f.id)).toEqual(['c', 'a', 'b']);
  });

  it('appends when the new fragment comes last', () => {
    const existing = [makeFragment('a', 0, 2)];
    const created = makeFragment('b', 5, 7);
    const result = addFragment(existing, created);
    expect(result.map((f) => f.id)).toEqual(['a', 'b']);
  });

  it('handles adding to an empty list', () => {
    const result = addFragment([], makeFragment('a', 3, 5));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('does not mutate the original array', () => {
    const existing = [makeFragment('a', 0, 2)];
    addFragment(existing, makeFragment('b', 5, 7));
    expect(existing).toHaveLength(1);
  });
});

// ── removeFragment ────────────────────────────────────────────────────────────

describe('removeFragment', () => {
  it('removes the fragment with the given id', () => {
    const fragments = [makeFragment('a', 0, 2), makeFragment('b', 5, 7)];
    const result = removeFragment(fragments, 'a');
    expect(result.map((f) => f.id)).toEqual(['b']);
  });

  it('returns the same list when id is not found', () => {
    const fragments = [makeFragment('a', 0, 2)];
    const result = removeFragment(fragments, 'nonexistent');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  it('handles an empty list gracefully', () => {
    expect(removeFragment([], 'x')).toEqual([]);
  });

  it('does not mutate the original array', () => {
    const fragments = [makeFragment('a', 0, 2), makeFragment('b', 5, 7)];
    removeFragment(fragments, 'a');
    expect(fragments).toHaveLength(2);
  });
});

// ── replaceFragments ──────────────────────────────────────────────────────────

describe('replaceFragments', () => {
  it('removes combined ids and inserts the new fragment sorted', () => {
    const fragments = [
      makeFragment('a', 0, 2),
      makeFragment('b', 5, 7),
      makeFragment('c', 10, 12),
    ];
    const combined = makeFragment('d', 0, 7);
    const result = replaceFragments(fragments, ['a', 'b'], combined);
    expect(result.map((f) => f.id)).toEqual(['d', 'c']);
  });

  it('sorts result by startPhraseIndex after replacement', () => {
    const fragments = [makeFragment('a', 3, 5), makeFragment('b', 8, 10)];
    const combined = makeFragment('c', 0, 5);
    const result = replaceFragments(fragments, ['a'], combined);
    expect(result[0].id).toBe('c');
    expect(result[1].id).toBe('b');
  });

  it('handles combining all fragments', () => {
    const fragments = [makeFragment('a', 0, 2), makeFragment('b', 5, 7)];
    const combined = makeFragment('c', 0, 7);
    const result = replaceFragments(fragments, ['a', 'b'], combined);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c');
  });

  it('does not mutate the original array', () => {
    const fragments = [makeFragment('a', 0, 2), makeFragment('b', 5, 7)];
    replaceFragments(fragments, ['a', 'b'], makeFragment('c', 0, 7));
    expect(fragments).toHaveLength(2);
  });
});
