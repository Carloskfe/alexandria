import { Injectable } from '@nestjs/common';
import { SyncPhrase } from '../books/sync-map.entity';

const HEADING_MARKER = '##HEADING## ';

@Injectable()
export class PhraseSplitterService {
  split(text: string, maxChars = 200): SyncPhrase[] {
    // Normalize Windows line endings before splitting
    const trimmed = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (!trimmed) return [];

    const blocks = trimmed.split(/\n{2,}/);
    const phrases: SyncPhrase[] = [];
    let index = 0;

    for (const block of blocks) {
      const b = block.trim();
      if (!b) continue;

      if (b.startsWith(HEADING_MARKER)) {
        const headingText = b.slice(HEADING_MARKER.length).trim();
        if (headingText) {
          phrases.push({ index: index++, text: headingText, type: 'heading', startTime: 0, endTime: 0 });
        }
      } else if (this.isHeading(b)) {
        phrases.push({ index: index++, text: b, type: 'heading', startTime: 0, endTime: 0 });
      } else {
        for (const s of this.splitParagraph(b, maxChars)) {
          phrases.push({ index: index++, text: s, type: 'text', startTime: 0, endTime: 0 });
        }
      }
    }

    return phrases;
  }

  private isHeading(text: string): boolean {
    if (text.length > 100) return false;
    if (
      /^(CHAPTER|CAPÍTULO|CAPITULO|TRACTADO|PARTE|PART|LIBRO|BOOK|ACTO|ACT|CANTO|SECCIÓN|SECTION|PRÓLOGO|PROLOGO|EPILOGO|EPÍLOGO|INTRODUCCIÓN|INTRODUCCION|APÉNDICE|APPENDIX)\b/i.test(
        text,
      )
    )
      return true;
    // All-caps line with no lowercase letters
    if (!/[a-záéíóúü]/.test(text) && /[A-ZÁÉÍÓÚÜÑ]{3}/.test(text)) return true;
    // Standalone Roman numerals
    if (/^[IVXLCDM]+\.?\s*$/.test(text) && text.length <= 8) return true;
    return false;
  }

  private splitParagraph(paragraph: string, maxChars: number): string[] {
    const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s|$)/g) ?? [paragraph];
    const results: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      const s = sentence.trim();
      if (!s) continue;
      if (current.length > 0 && current.length + 1 + s.length > maxChars) {
        results.push(current);
        current = s;
      } else {
        current = current ? `${current} ${s}` : s;
      }
    }

    if (current) results.push(current);
    return results;
  }
}
