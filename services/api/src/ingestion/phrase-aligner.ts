/**
 * Aligns a book's SyncPhrase list against a flat list of Whisper TimedWords.
 *
 * Strategy: greedy forward scan with a configurable lookahead window.
 * For each text phrase we search ahead up to MAX_DRIFT words for the best
 * scoring window, then advance the cursor past the match. Headings and
 * paragraph-breaks are skipped (readers rarely recite chapter titles verbatim).
 *
 * Confidence is the fraction of phrase words found in the matched window.
 * Phrases below LOW_CONFIDENCE_THRESHOLD are logged so the user can spot-check.
 */

import { SyncPhrase } from '../books/sync-map.entity';
import { TimedWord } from './whisper-parser';

export interface AlignmentResult {
  phraseIndex: number;
  startTime: number;
  endTime: number;
  confidence: number;  // 0–1
}

export interface AlignmentStats {
  total: number;
  aligned: number;
  lowConfidence: number;
  avgConfidence: number;
  lowConfidencePhrases: Array<{ index: number; text: string; confidence: number }>;
}

const MAX_DRIFT     = 80;   // words to search ahead of cursor
const LOW_THRESHOLD = 0.50; // flag phrases below this confidence

// ── Text normalisation ─────────────────────────────────────────────────────────

export function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // strip accent marks
    .replace(/[^a-z0-9]/g, '');       // remove punctuation
}

function tokenize(text: string): string[] {
  return text.split(/\s+/).map(normalizeWord).filter(Boolean);
}

// ── Window scoring ─────────────────────────────────────────────────────────────

function scoreWindow(
  phraseTokens: string[],
  words: TimedWord[],
  offset: number,
): number {
  const n = phraseTokens.length;
  const available = words.length - offset;
  if (available <= 0) return 0;

  let matches = 0;
  const windowSize = Math.min(n, available);

  for (let i = 0; i < windowSize; i++) {
    if (normalizeWord(words[offset + i].word) === phraseTokens[i]) matches++;
  }

  return matches / n;
}

// ── Main alignment ─────────────────────────────────────────────────────────────

export function alignPhrases(
  phrases: SyncPhrase[],
  timedWords: TimedWord[],
): { phrases: SyncPhrase[]; stats: AlignmentStats } {
  const result = phrases.map((p) => ({ ...p }));
  const lowConfidencePhrases: AlignmentStats['lowConfidencePhrases'] = [];

  let wordCursor = 0;
  let aligned = 0;
  let totalConfidence = 0;

  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];

    // Only align actual text phrases — skip headings and paragraph-breaks
    if (phrase.type !== 'text') continue;

    const tokens = tokenize(phrase.text);
    if (tokens.length === 0) continue;

    const searchEnd = Math.min(
      wordCursor + MAX_DRIFT,
      timedWords.length - tokens.length,
    );

    let best = { pos: wordCursor, score: 0 };

    for (let w = wordCursor; w <= searchEnd; w++) {
      const score = scoreWindow(tokens, timedWords, w);
      if (score > best.score) {
        best = { pos: w, score };
        if (score === 1) break; // perfect match — stop searching
      }
    }

    const endPos = Math.min(best.pos + tokens.length - 1, timedWords.length - 1);
    result[i] = {
      ...phrase,
      startTime: timedWords[best.pos]?.start ?? 0,
      endTime:   timedWords[endPos]?.end   ?? 0,
    };

    wordCursor = best.pos + tokens.length;
    aligned++;
    totalConfidence += best.score;

    if (best.score < LOW_THRESHOLD) {
      lowConfidencePhrases.push({
        index:      phrase.index,
        text:       phrase.text.slice(0, 80),
        confidence: Math.round(best.score * 100) / 100,
      });
    }
  }

  const textPhraseCount = phrases.filter((p) => p.type === 'text').length;

  return {
    phrases: result,
    stats: {
      total:               textPhraseCount,
      aligned,
      lowConfidence:       lowConfidencePhrases.length,
      avgConfidence:       aligned > 0 ? Math.round((totalConfidence / aligned) * 100) / 100 : 0,
      lowConfidencePhrases,
    },
  };
}
