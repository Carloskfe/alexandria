import { alignPhrases, normalizeWord } from '../../../src/ingestion/phrase-aligner';
import { SyncPhrase } from '../../../src/books/sync-map.entity';
import { TimedWord } from '../../../src/ingestion/whisper-parser';

// ── normalizeWord ─────────────────────────────────────────────────────────────

describe('normalizeWord', () => {
  it('lowercases and removes punctuation', () => {
    expect(normalizeWord('Mancha,')).toBe('mancha');
    expect(normalizeWord('¡Hola!')).toBe('hola');
  });

  it('strips accent marks', () => {
    expect(normalizeWord('están')).toBe('estan');
    expect(normalizeWord('Córdoba')).toBe('cordoba');
  });

  it('returns empty string for punctuation-only tokens', () => {
    expect(normalizeWord('...')).toBe('');
    expect(normalizeWord(',;')).toBe('');
  });
});

// ── alignPhrases ──────────────────────────────────────────────────────────────

function makePhrase(index: number, text: string, type: SyncPhrase['type'] = 'text'): SyncPhrase {
  return { index, text, type: type ?? 'text', startTime: 0, endTime: 0 };
}

function makeWord(word: string, start: number, end: number): TimedWord {
  return { word, start, end };
}

describe('alignPhrases', () => {
  it('assigns correct timestamps to a perfect match', () => {
    const phrases = [makePhrase(0, 'En un lugar de la Mancha')];
    const words = [
      makeWord('En', 0, 0.5),
      makeWord('un', 0.5, 0.9),
      makeWord('lugar', 0.9, 1.4),
      makeWord('de', 1.4, 1.7),
      makeWord('la', 1.7, 2.0),
      makeWord('Mancha', 2.0, 3.0),
    ];

    const { phrases: result, stats } = alignPhrases(phrases, words);
    expect(result[0].startTime).toBe(0);
    expect(result[0].endTime).toBe(3.0);
    expect(stats.avgConfidence).toBe(1);
  });

  it('handles slight word mismatches (Whisper errors) gracefully', () => {
    const phrases = [makePhrase(0, 'de cuyo nombre no quiero acordarme')];
    // Whisper mishears "cuyo" as "cuio"
    const words = [
      makeWord('de', 4.0, 4.3),
      makeWord('cuio', 4.3, 4.7),   // mishear
      makeWord('nombre', 4.7, 5.2),
      makeWord('no', 5.2, 5.4),
      makeWord('quiero', 5.4, 5.9),
      makeWord('acordarme', 5.9, 6.8),
    ];

    const { phrases: result } = alignPhrases(phrases, words);
    expect(result[0].startTime).toBe(4.0);
    expect(result[0].endTime).toBe(6.8);
  });

  it('aligns multiple sequential phrases correctly', () => {
    const phrases = [
      makePhrase(0, 'En un lugar'),
      makePhrase(1, 'de la Mancha'),
    ];
    const words = [
      makeWord('En', 0, 0.5),
      makeWord('un', 0.5, 0.9),
      makeWord('lugar', 0.9, 1.4),
      makeWord('de', 1.4, 1.7),
      makeWord('la', 1.7, 2.0),
      makeWord('Mancha', 2.0, 3.0),
    ];

    const { phrases: result } = alignPhrases(phrases, words);
    expect(result[0].startTime).toBe(0);
    expect(result[1].startTime).toBe(1.4);
    expect(result[1].endTime).toBe(3.0);
  });

  it('skips heading and paragraph-break phrases', () => {
    const phrases = [
      makePhrase(0, 'CAPÍTULO I', 'heading'),
      makePhrase(1, '', 'paragraph-break'),
      makePhrase(2, 'En un lugar'),
    ];
    const words = [makeWord('En', 1.0, 1.5), makeWord('un', 1.5, 1.8), makeWord('lugar', 1.8, 2.5)];

    const { phrases: result, stats } = alignPhrases(phrases, words);
    // Heading and paragraph-break keep startTime 0
    expect(result[0].startTime).toBe(0);
    expect(result[1].startTime).toBe(0);
    // Text phrase gets aligned
    expect(result[2].startTime).toBe(1.0);
    expect(stats.total).toBe(1);
  });

  it('reports low-confidence phrases', () => {
    const phrases = [makePhrase(0, 'palabra completamente diferente aqui')];
    const words = [
      makeWord('xyzzy', 0, 1),
      makeWord('foo', 1, 2),
      makeWord('bar', 2, 3),
      makeWord('baz', 3, 4),
    ];

    const { stats } = alignPhrases(phrases, words);
    expect(stats.lowConfidence).toBe(1);
    expect(stats.lowConfidencePhrases[0].index).toBe(0);
  });

  it('returns empty stats for empty phrase list', () => {
    const { stats } = alignPhrases([], []);
    expect(stats.total).toBe(0);
    expect(stats.aligned).toBe(0);
  });
});
