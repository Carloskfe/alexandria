import { Fragment } from './reader-utils';

export type SelectionState = {
  start: number | null;
  end: number | null;
  showPopover: boolean;
};

export const EMPTY_SELECTION: SelectionState = {
  start: null,
  end: null,
  showPopover: false,
};

export function applyPhraseClick(state: SelectionState, idx: number): SelectionState {
  if (state.start === null) {
    return { start: idx, end: idx, showPopover: true };
  }
  if (idx === state.start && idx === state.end) {
    return EMPTY_SELECTION;
  }
  return { ...state, end: idx, showPopover: true };
}

export function selectionRange(state: SelectionState): { start: number; end: number } | null {
  if (state.start === null || state.end === null) return null;
  return {
    start: Math.min(state.start, state.end),
    end: Math.max(state.start, state.end),
  };
}

export function addFragment(fragments: Fragment[], created: Fragment): Fragment[] {
  return [...fragments, created].sort((a, b) => a.startPhraseIndex - b.startPhraseIndex);
}

export function removeFragment(fragments: Fragment[], id: string): Fragment[] {
  return fragments.filter((f) => f.id !== id);
}

export function replaceFragments(fragments: Fragment[], ids: string[], combined: Fragment): Fragment[] {
  return [...fragments.filter((f) => !ids.includes(f.id)), combined].sort(
    (a, b) => a.startPhraseIndex - b.startPhraseIndex,
  );
}
