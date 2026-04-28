import { Injectable } from '@nestjs/common';

@Injectable()
export class GutenbergFetcherService {
  async fetch(gutenbergId: number): Promise<string> {
    const url = `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`;
    const res = await globalThis.fetch(url);
    if (!res.ok) {
      throw new Error(`Gutenberg fetch failed for ID ${gutenbergId}: HTTP ${res.status}`);
    }
    const raw = await res.text();
    return this.stripHeaders(raw);
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
}
