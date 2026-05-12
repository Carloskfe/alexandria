import { Injectable } from '@nestjs/common';

@Injectable()
export class GutenbergFetcherService {
  async fetch(
    gutenbergId: number,
    narrativeStartPattern?: string,
    narrativeEndPattern?: string,
  ): Promise<string> {
    const url = `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`;
    const res = await globalThis.fetch(url);
    if (!res.ok) {
      throw new Error(`Gutenberg fetch failed for ID ${gutenbergId}: HTTP ${res.status}`);
    }
    const raw = await res.text();
    let text = this.stripHeaders(raw);
    text = this.trimNarrative(text, narrativeStartPattern, narrativeEndPattern);
    return text;
  }

  private stripHeaders(raw: string): string {
    const startRe = /\*{3}\s*START OF (?:THE|THIS) PROJECT GUTENBERG[^\n]*\n/i;
    const endRe = /\*{3}\s*END OF (?:THE|THIS) PROJECT GUTENBERG/i;

    let text = raw;

    const startMatch = startRe.exec(raw);
    if (startMatch) {
      text = raw.slice(startMatch.index + startMatch[0].length);
    }

    const endMatch = endRe.exec(text);
    if (endMatch) {
      text = text.slice(0, endMatch.index);
    }

    return text.trim();
  }

  private trimNarrative(text: string, startPattern?: string, endPattern?: string): string {
    let result = text;
    if (startPattern) {
      const idx = result.indexOf(startPattern);
      if (idx >= 0) result = result.slice(idx);
    }
    if (endPattern) {
      const idx = result.indexOf(endPattern);
      if (idx >= 0) result = result.slice(0, idx + endPattern.length);
    }
    return result.trim();
  }
}
