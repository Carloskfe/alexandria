/**
 * Parsers for Whisper transcription output.
 *
 * Supported formats:
 *   VTT  — `whisper audio.mp3 --language es --word_timestamps True --output_format vtt`
 *   JSON — `whisper audio.mp3 --language es --output_format json`
 *
 * Both produce a flat TimedWord list sorted by start time.
 */

export interface TimedWord {
  word: string;   // raw text as transcribed
  start: number;  // seconds
  end: number;    // seconds
}

// ── VTT parser ────────────────────────────────────────────────────────────────
// Whisper word-level VTT embeds timestamps inline:
//   <00:00:01.200><c> lugar</c><00:00:01.600><c> de</c>
// Each cue may also contain a plain segment block without word tags.

const INLINE_WORD_RE = /<(\d{2}:\d{2}:\d{2}\.\d{3})><c>(.*?)<\/c>/g;
const CUE_HEADER_RE = /^(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/;

function vttTimeToSeconds(ts: string): number {
  const [hh, mm, ss] = ts.split(':');
  return parseInt(hh, 10) * 3600 + parseInt(mm, 10) * 60 + parseFloat(ss);
}

export function parseVtt(content: string): TimedWord[] {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const words: TimedWord[] = [];

  let cueStart = 0;
  let cueEnd = 0;
  let inCue = false;

  for (const line of lines) {
    const headerMatch = CUE_HEADER_RE.exec(line);
    if (headerMatch) {
      cueStart = vttTimeToSeconds(headerMatch[1]);
      cueEnd = vttTimeToSeconds(headerMatch[2]);
      inCue = true;
      continue;
    }

    if (inCue && line.trim() === '') {
      inCue = false;
      continue;
    }

    if (!inCue) continue;

    // Try to extract word-level timestamps from inline markers
    let match: RegExpExecArray | null;
    let hadWordTimestamps = false;
    INLINE_WORD_RE.lastIndex = 0;

    while ((match = INLINE_WORD_RE.exec(line)) !== null) {
      hadWordTimestamps = true;
      const wordStart = vttTimeToSeconds(match[1]);
      const word = match[2].trim();
      if (word) {
        words.push({ word, start: wordStart, end: wordStart });
      }
    }

    // Segment-level cue (no inline word timestamps): split into individual
    // words and distribute the timestamp range proportionally across them.
    if (!hadWordTimestamps) {
      const text = line.replace(/<[^>]+>/g, '').trim();
      if (text) {
        const tokens = text.split(/\s+/).filter(Boolean);
        const duration = cueEnd - cueStart;
        tokens.forEach((token, idx) => {
          const wordStart = cueStart + (idx / tokens.length) * duration;
          const wordEnd   = cueStart + ((idx + 1) / tokens.length) * duration;
          words.push({ word: token, start: wordStart, end: wordEnd });
        });
      }
    }
  }

  // Fix end times: each word ends where the next one starts
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].end === words[i].start) {
      words[i].end = words[i + 1].start;
    }
  }

  return words;
}

// ── JSON parser ────────────────────────────────────────────────────────────────
// Whisper JSON schema (relevant fields only):
//   { segments: [{ start, end, text, words: [{ word, start, end }] }] }

interface WhisperJsonWord {
  word: string;
  start: number;
  end: number;
}

interface WhisperJsonSegment {
  start: number;
  end: number;
  text: string;
  words?: WhisperJsonWord[];
}

interface WhisperJson {
  segments: WhisperJsonSegment[];
}

export function parseJson(content: string): TimedWord[] {
  const data: WhisperJson = JSON.parse(content);
  const words: TimedWord[] = [];

  for (const seg of data.segments ?? []) {
    if (seg.words && seg.words.length > 0) {
      for (const w of seg.words) {
        const word = w.word.trim();
        if (word) words.push({ word, start: w.start, end: w.end });
      }
    } else {
      // Segment-level fallback — no word timestamps
      const text = seg.text.trim();
      if (text) words.push({ word: text, start: seg.start, end: seg.end });
    }
  }

  return words;
}

// ── Auto-detect ────────────────────────────────────────────────────────────────

export function parseWhisperFile(content: string, filename: string): TimedWord[] {
  if (filename.endsWith('.json')) return parseJson(content);
  if (filename.endsWith('.vtt'))  return parseVtt(content);
  // Guess from content
  if (content.trimStart().startsWith('{')) return parseJson(content);
  return parseVtt(content);
}
